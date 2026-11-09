(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const REMINDER_ID = 900031;
  const DEFAULTS = { enabled: true, upcoming: [], version: 3 };
  function getSettings() {
    const saved = SE.store && SE.store.prefs ? SE.store.prefs.get("sabtReminder", DEFAULTS) : DEFAULTS;
    const cfg = Object.assign({}, DEFAULTS, saved || {});
    cfg.upcoming = Array.isArray(cfg.upcoming) ? cfg.upcoming : [];
    return cfg;
  }
  function setSettings(partial) {
    const next = Object.assign(getSettings(), partial || {});
    if (SE.store && SE.store.prefs) SE.store.prefs.set("sabtReminder", next);
    return next;
  }
  function message(lang) {
    return lang === "en"
      ? { title: "Yom Sabt reminder", body: "Yom Sabt: buying and selling are prohibited." }
      : { title: "یادآوری یوم سبت", body: "یوم سبت؛ خرید و فروش ممنوع است." };
  }
  function dateKey(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function notificationId(key) {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    return 910000 + Math.abs(h) % 80000;
  }
  function parseTime(value) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(value || ""));
    if (!m) return null;
    const hour = Number(m[1]), minute = Number(m[2]);
    return hour <= 23 && minute <= 59 ? { hour, minute } : null;
  }
  function localDateTimeToTimestamp(year, month, day, hour, minute, timeZone) {
    if (!timeZone) return new Date(year, month - 1, day, hour, minute, 0, 0).getTime();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone, calendar: "gregory", numberingSystem: "latn",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23"
    });
    const target = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    const partsAt = instant => formatter.formatToParts(new Date(instant));
    const wallTimestamp = parts => {
      const part = type => Number(parts.find(x => x.type === type).value);
      return Date.UTC(part("year"), part("month") - 1, part("day"),
        part("hour"), part("minute"), part("second"));
    };
    const offsets = new Set();
    for (let hours = -48; hours <= 48; hours += 6) {
      const instant = target + hours * 60 * 60 * 1000;
      offsets.add(wallTimestamp(partsAt(instant)) - instant);
    }
    const candidates = Array.from(offsets, offset => {
      const instant = target - offset;
      return { instant, wall: wallTimestamp(partsAt(instant)) };
    });
    const exact = candidates.filter(x => x.wall === target).sort((a, b) => a.instant - b.instant);
    if (exact.length) return exact[0].instant;
    // For a wall time skipped by a DST jump, move forward by the size of the gap.
    const after = candidates.filter(x => x.wall > target).sort((a, b) => a.wall - b.wall || a.instant - b.instant);
    if (after.length) return after[0].instant;
    throw new RangeError("Cannot resolve local time in " + timeZone);
  }
  function buildSaturdayEntries(rows, opts) {
    opts = opts || {};
    if (opts.year == null || opts.month == null) return [];
    const out = [];
    (rows || []).forEach(row => {
      if (!Array.isArray(row) || row[0] == null) return;
      let gd;
      if ((opts.calendar || "j") === "j" && SE.jalali && SE.jalali.jalaliToGregorian) {
        gd = SE.jalali.jalaliToGregorian(Number(opts.year), Number(opts.month), Number(row[0]));
      } else gd = { year: Number(opts.year), month: Number(opts.month), day: Number(row[0]) };
      if (!gd) return;
      const weekday = new Date(Date.UTC(gd.year, gd.month - 1, gd.day)).getUTCDay();
      if (weekday !== 6) return;
      const time = parseTime(row[1]);
      if (!time) return;
      const key = String(gd.year) + "-" + String(gd.month).padStart(2, "0") + "-" + String(gd.day).padStart(2, "0");
      const at = localDateTimeToTimestamp(gd.year, gd.month, gd.day, time.hour, time.minute, opts.timeZone);
      out.push({ key, at, hour: time.hour, minute: time.minute });
    });
    return out;
  }
  async function cancelScheduled() {
    const plugin = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    const ids = (getSettings().scheduledIds || []).concat([REMINDER_ID]).filter((v, i, a) => a.indexOf(v) === i);
    if (plugin && plugin.cancel && ids.length) {
      try { await plugin.cancel({ notifications: ids.map(id => ({ id })) }); } catch (e) {}
    }
    if (g.__sabtReminderTimer) { clearTimeout(g.__sabtReminderTimer); g.__sabtReminderTimer = null; }
  }
  async function schedule(opts) {
    opts = opts || {};
    const cfg = getSettings();
    if (!cfg.enabled && !opts.force) return { ok: false, reason: "disabled" };
    const upcoming = cfg.upcoming.filter(x => x && x.at > Date.now()).sort((a, b) => a.at - b.at).slice(0, 12);
    if (!upcoming.length) return { ok: false, reason: "no_table_data" };
    const lang = opts.lang || (SE.i18n && SE.i18n.lang) || "fa";
    const msg = message(lang);
    if (SE.notify && SE.notify.ensurePermission) {
      const permission = await SE.notify.ensurePermission();
      if (permission !== "granted") return { ok: false, reason: permission || "permission_required" };
    }
    const native = SE.platform && SE.platform.isNative && SE.platform.isNative();
    const plugin = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    try {
      await cancelScheduled();
      if (native && plugin && plugin.schedule) {
        const notifications = upcoming.map(item => ({
          id: notificationId(item.key), title: msg.title,
          body: msg.body + " · " + String(item.hour).padStart(2, "0") + ":" + String(item.minute).padStart(2, "0"),
          schedule: { at: new Date(item.at) },
          extra: { type: "sabt_reminder", date: item.key, dayStart: String(item.hour).padStart(2, "0") + ":" + String(item.minute).padStart(2, "0") },
          smallIcon: "ic_stat_icon", actionTypeId: "OPEN_APP"
        }));
        await plugin.schedule({ notifications });
        setSettings({ scheduledIds: notifications.map(n => n.id) });
        return { ok: true, method: "native", count: notifications.length, next: upcoming[0] };
      }
      const next = upcoming[0];
      g.__sabtReminderTimer = setTimeout(async () => {
        if (SE.notify && SE.notify.show) await SE.notify.show(msg.title, msg.body, "sabt", true);
        else if (typeof Notification !== "undefined" && Notification.permission === "granted")
          new Notification(msg.title, { body: msg.body, dir: "rtl", lang });
        setSettings({ upcoming: getSettings().upcoming.filter(x => x.key !== next.key) });
        schedule({ lang, force: true });
      }, Math.max(0, next.at - Date.now()));
      return { ok: true, method: "web", count: upcoming.length, next };
    } catch (error) { return { ok: false, error: String(error.message || error) }; }
  }
  async function scheduleFromMonth(rows, opts) {
    const entries = buildSaturdayEntries(rows, opts);
    if (!entries.length) return { ok: false, reason: "no_saturday_rows" };
    const byDate = new Map(getSettings().upcoming.filter(x => x && x.at > Date.now()).map(x => [x.key, x]));
    entries.forEach(x => byDate.set(x.key, x));
    const upcoming = Array.from(byDate.values()).sort((a, b) => a.at - b.at).slice(0, 12);
    setSettings({ upcoming, version: 3 });
    return getSettings().enabled ? schedule({ lang: opts && opts.lang }) : { ok: true, scheduled: false, count: upcoming.length };
  }
  async function enable(opts) { setSettings({ enabled: true }); return schedule(opts); }
  async function disable() {
    setSettings({ enabled: false });
    await cancelScheduled();
    setSettings({ scheduledIds: [] });
    return { ok: true };
  }
  async function testNow(lang) {
    const msg = message(lang || "fa");
    if (SE.notify && SE.notify.ensurePermission) await SE.notify.ensurePermission();
    if (SE.notify && SE.notify.show) { await SE.notify.show(msg.title, msg.body, "sabt", true); return { ok: true }; }
    if (typeof Notification !== "undefined") {
      if (Notification.permission !== "granted") await Notification.requestPermission();
      if (Notification.permission === "granted") { new Notification(msg.title, { body: msg.body, dir: "rtl", lang: lang || "fa" }); return { ok: true }; }
    }
    return { ok: false };
  }
  SE.sabtReminder = { REMINDER_ID, DEFAULTS, getSettings, setSettings, localDateTimeToTimestamp, buildSaturdayEntries, scheduleFromMonth, schedule, enable, disable, testNow, message };
  function autoStart() { try { if (getSettings().enabled) schedule({}); } catch (e) {} }
  if (g.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(autoStart, 1100));
    else setTimeout(autoStart, 1100);
  }
  if (typeof module !== "undefined" && module.exports) module.exports = SE.sabtReminder;
})(typeof globalThis !== "undefined" ? globalThis : this);
