(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const REMINDER_ID = 900031;
  const DEFAULTS = { enabled: true, hour: 0, minute: 0, version: 2 };

  // Migrate the earlier 09:00 default to the start of Saturday.
  function migrate(saved) {
    const old = Object.assign({}, saved || {});
    if (!old.version || old.version < 2) {
      old.hour = 0;
      old.minute = 0;
      old.version = 2;
      if (SE.store && SE.store.prefs) SE.store.prefs.set("sabtReminder", Object.assign({}, DEFAULTS, old));
    }
    return old;
  }

  function getSettings() {
    const saved = SE.store && SE.store.prefs ? SE.store.prefs.get("sabtReminder", DEFAULTS) : DEFAULTS;
    return Object.assign({}, DEFAULTS, migrate(saved));
  }
  function setSettings(partial) {
    const next = Object.assign(getSettings(), partial || {});
    if (SE.store && SE.store.prefs) SE.store.prefs.set("sabtReminder", next);
    return next;
  }
  function message(lang) {
    const en = lang === "en";
    return {
      title: en ? "Yom Sabt reminder" : "یادآوری یوم سبت",
      body: en ? "Yom Sabt: buying and selling are prohibited." : "یوم سبت؛ خرید و فروش ممنوع است."
    };
  }
  function nextSaturday(cfg) {
    cfg = cfg || getSettings();
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), cfg.hour, cfg.minute, 0, 0);
    const daysUntil = (6 - now.getDay() + 7) % 7;
    date.setDate(date.getDate() + daysUntil);
    if (date.getTime() <= now.getTime() + 5000) date.setDate(date.getDate() + 7);
    return date;
  }
  async function schedule(opts) {
    opts = opts || {};
    const cfg = getSettings();
    if (!cfg.enabled && !opts.force) return { ok: false, reason: "disabled" };
    const lang = opts.lang || (SE.i18n && SE.i18n.lang) || "fa";
    const msg = message(lang);
    if (SE.notify && SE.notify.ensurePermission) {
      const permission = await SE.notify.ensurePermission();
      if (permission === "denied" || permission === "unsupported") return { ok: false, reason: permission };
    }
    const native = SE.platform && SE.platform.isNative && SE.platform.isNative();
    const plugin = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    try {
      if (native && plugin && plugin.schedule) {
        if (plugin.cancel) {
          try { await plugin.cancel({ notifications: [{ id: REMINDER_ID }] }); } catch (e) {}
        }
        await plugin.schedule({ notifications: [{
          id: REMINDER_ID, title: msg.title, body: msg.body,
          schedule: { on: { weekday: 7, hour: cfg.hour, minute: cfg.minute }, repeats: true },
          extra: { type: "sabt_reminder" }, smallIcon: "ic_stat_icon", actionTypeId: "OPEN_APP"
        }] });
        return { ok: true, method: "native", weekday: 7, hour: cfg.hour, minute: cfg.minute };
      }
      const when = nextSaturday(cfg);
      if (g.__sabtReminderTimer) clearTimeout(g.__sabtReminderTimer);
      g.__sabtReminderTimer = setTimeout(async () => {
        if (SE.notify && SE.notify.show) await SE.notify.show(msg.title, msg.body, "sabt", true);
        else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(msg.title, { body: msg.body, dir: "rtl", lang: lang });
        }
        schedule({ lang, force: true });
      }, Math.max(0, when.getTime() - Date.now()));
      return { ok: true, method: "web", at: when.toISOString() };
    } catch (error) {
      return { ok: false, error: String(error.message || error) };
    }
  }
  async function enable(opts) {
    setSettings({ enabled: true });
    return schedule(opts);
  }
  async function disable() {
    setSettings({ enabled: false });
    try {
      const plugin = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
      if (plugin && plugin.cancel) await plugin.cancel({ notifications: [{ id: REMINDER_ID }] });
    } catch (e) {}
    if (g.__sabtReminderTimer) { clearTimeout(g.__sabtReminderTimer); g.__sabtReminderTimer = null; }
    return { ok: true };
  }
  async function testNow(lang) {
    const msg = message(lang || "fa");
    if (SE.notify && SE.notify.ensurePermission) await SE.notify.ensurePermission();
    if (SE.notify && SE.notify.show) {
      await SE.notify.show(msg.title, msg.body, "sabt", true);
      return { ok: true };
    }
    if (typeof Notification !== "undefined") {
      if (Notification.permission !== "granted") await Notification.requestPermission();
      if (Notification.permission === "granted") {
        new Notification(msg.title, { body: msg.body, dir: "rtl", lang: lang || "fa" });
        return { ok: true };
      }
    }
    return { ok: false };
  }
  SE.sabtReminder = { REMINDER_ID, DEFAULTS, getSettings, setSettings, nextSaturday, schedule, enable, disable, testNow, message };
  function autoStart() { try { if (getSettings().enabled) schedule({}); } catch (e) {} }
  if (g.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(autoStart, 1100));
    else setTimeout(autoStart, 1100);
  }
  if (typeof module !== "undefined" && module.exports) module.exports = SE.sabtReminder;
})(typeof globalThis !== "undefined" ? globalThis : this);
