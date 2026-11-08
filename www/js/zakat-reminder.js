(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  const REMINDER_ID = 900029;
  const DEFAULTS = {
    enabled: true,
    day: 29,
    hour: 10,
    minute: 0,
    calendar: "j"
  };

  function getSettings() {
    const s = SE.store && SE.store.prefs
      ? SE.store.prefs.get("zakatReminder", DEFAULTS)
      : DEFAULTS;
    const merged = Object.assign({}, DEFAULTS, s || {});
    if (s && s.day === 28 && !s._migrated29) {
      merged.day = 29;
      merged._migrated29 = true;
      if (SE.store && SE.store.prefs) SE.store.prefs.set("zakatReminder", merged);
    }
    return merged;
  }

  function setSettings(partial) {
    const next = Object.assign(getSettings(), partial || {});
    if (SE.store && SE.store.prefs) SE.store.prefs.set("zakatReminder", next);
    return next;
  }

  function todayJalali() {
    if (SE.dates && SE.dates.today) return SE.dates.today().jalali;
    if (SE.jalali && SE.jalali.gregorianToJalali) {
      const d = new Date();
      return SE.jalali.gregorianToJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    }
    return null;
  }

  function daysInJalaliMonth(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return 29;
  }

  function pastTimeToday(hour, minute) {
    const now = new Date();
    return now.getHours() > hour || (now.getHours() === hour && now.getMinutes() >= minute);
  }

  function nextZakatDate(cfg) {
    cfg = cfg || getSettings();
    const day = cfg.day || 29;
    const hour = cfg.hour != null ? cfg.hour : 10;
    const minute = cfg.minute != null ? cfg.minute : 0;

    if (cfg.calendar === "g") {
      const now = new Date();
      let y = now.getFullYear(), m = now.getMonth();
      let candidate = new Date(y, m, day, hour, minute, 0, 0);
      if (candidate.getDate() !== day) candidate = new Date(y, m + 1, day, hour, minute, 0, 0);
      if (candidate.getTime() <= Date.now() + 5000) {
        candidate = new Date(y, m + 1, day, hour, minute, 0, 0);
        if (candidate.getDate() !== day) candidate = new Date(y, m + 2, day, hour, minute, 0, 0);
      }
      return candidate;
    }

    const j = todayJalali();
    if (!j) return nextZakatDate(Object.assign({}, cfg, { calendar: "g" }));

    let jy = j.year, jm = j.month;
    if (j.day > day || (j.day === day && pastTimeToday(hour, minute))) {
      jm += 1;
      if (jm > 12) { jm = 1; jy += 1; }
    }

    const targetDay = Math.min(day, daysInJalaliMonth(jy, jm));
    const g = (SE.jalali && SE.jalali.jalaliToGregorian)
      ? SE.jalali.jalaliToGregorian(jy, jm, targetDay)
      : (SE.dates && SE.dates.j2g)
        ? SE.dates.j2g(jy, jm, targetDay)
        : null;

    if (!g) return nextZakatDate(Object.assign({}, cfg, { calendar: "g" }));
    return new Date(g.year, g.month - 1, g.day, hour, minute, 0, 0);
  }

  function message(lang) {
    const isFa = lang !== "en";
    return {
      title: isFa ? "یادآوری زکات" : "Zakat reminder",
      body: isFa
        ? "امروز ۲۹ ماه است — زمان پرداخت زکات 🤲"
        : "It is the 29th — time to pay Zakat 🤲"
    };
  }

  async function scheduleOnce(opts) {
    opts = opts || {};
    const cfg = getSettings();
    if (!cfg.enabled && !opts.force) return { ok: false, reason: "disabled" };

    const lang = opts.lang || (SE.i18n && SE.i18n.lang) || "fa";
    const when = nextZakatDate(cfg);
    const msg = message(lang);

    if (SE.notify && SE.notify.ensurePermission) {
      const status = await SE.notify.ensurePermission();
      if (status === "denied" || status === "unsupported") return { ok: false, reason: status };
    }

    const isNative = SE.platform && SE.platform.isNative && SE.platform.isNative();
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;

    try {
      if (isNative && p && p.cancel) {
        try { await p.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (e) {}
      }

      if (isNative && p && p.schedule) {
        await p.schedule({
          notifications: [{
            id: REMINDER_ID,
            title: msg.title,
            body: msg.body,
            schedule: { at: when },
            sound: "default",
            extra: { type: "zakat_reminder", day: cfg.day },
            smallIcon: "ic_stat_icon",
            actionTypeId: "OPEN_APP"
          }]
        });
        return { ok: true, method: "native", at: when.toISOString() };
      }

      const delay = when.getTime() - Date.now();
      if (delay > 0 && delay < 35 * 24 * 60 * 60 * 1000) {
        if (g.__zakatReminderTimer) clearTimeout(g.__zakatReminderTimer);
        g.__zakatReminderTimer = setTimeout(async () => {
          if (SE.notify && SE.notify.show) {
            await SE.notify.show(msg.title, msg.body, "zakat", true);
          } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(msg.title, { body: msg.body, dir: "rtl", lang: "fa" });
          }
          scheduleOnce({ lang, force: true });
        }, delay);
        return { ok: true, method: "web", at: when.toISOString() };
      }
      return { ok: false, reason: "schedule_window", at: when.toISOString() };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  async function enable(opts) {
    setSettings({ enabled: true });
    return scheduleOnce(opts);
  }

  async function disable() {
    setSettings({ enabled: false });
    try {
      const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
      if (p && p.cancel) await p.cancel({ notifications: [{ id: REMINDER_ID }] });
    } catch (e) {}
    if (g.__zakatReminderTimer) {
      clearTimeout(g.__zakatReminderTimer);
      g.__zakatReminderTimer = null;
    }
    return { ok: true };
  }

  async function testNow(lang) {
    const msg = message(lang || "fa");
    if (SE.notify && SE.notify.ensurePermission) await SE.notify.ensurePermission();
    if (SE.notify && SE.notify.show) {
      await SE.notify.show(msg.title, msg.body, "zakat", true);
      return { ok: true };
    }
    if (typeof Notification !== "undefined") {
      if (Notification.permission !== "granted") await Notification.requestPermission();
      if (Notification.permission === "granted") {
        new Notification(msg.title, { body: msg.body, dir: "rtl" });
        return { ok: true };
      }
    }
    return { ok: false };
  }

  SE.zakatReminder = {
    REMINDER_ID, DEFAULTS, getSettings, setSettings,
    nextZakatDate, scheduleOnce, enable, disable, testNow, message
  };

  function autoStart() {
    try { if (getSettings().enabled) scheduleOnce({}); } catch (e) {}
  }
  if (g.document) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(autoStart, 1000));
    } else setTimeout(autoStart, 1000);
  }

  if (typeof module !== "undefined" && module.exports) module.exports = SE.zakatReminder;
})(typeof globalThis !== "undefined" ? globalThis : this);
