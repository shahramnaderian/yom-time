(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  const REMINDER_ID = 900001;
  const DEFAULTS = { enabled: true, hour: 17, minute: 0, pages: 2 };

  function getSettings() {
    const s = SE.store && SE.store.prefs
      ? SE.store.prefs.get("quranReminder", DEFAULTS)
      : DEFAULTS;
    return Object.assign({}, DEFAULTS, s || {});
  }

  function setSettings(partial) {
    const next = Object.assign(getSettings(), partial || {});
    if (SE.store && SE.store.prefs) SE.store.prefs.set("quranReminder", next);
    return next;
  }

  function nextAt(hour, minute) {
    const now = new Date();
    const when = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    if (when.getTime() <= now.getTime() + 5000) when.setDate(when.getDate() + 1);
    return when;
  }

  function message(lang, pages) {
    const isFa = lang !== "en";
    const n = pages || 2;
    return {
      title: isFa ? "یادآوری قرآن" : "Quran reminder",
      body: isFa ? "امروز " + n + " صفحه قرآن مطالعه کنید 📖" : "Read " + n + " pages of the Quran today 📖"
    };
  }

  async function scheduleOnce(opts) {
    opts = opts || {};
    const cfg = getSettings();
    if (!cfg.enabled && !opts.force) return { ok: false, reason: "disabled" };

    const hour = opts.hour != null ? opts.hour : cfg.hour;
    const minute = opts.minute != null ? opts.minute : cfg.minute;
    const pages = opts.pages != null ? opts.pages : cfg.pages;
    const lang = opts.lang || (SE.i18n && SE.i18n.lang) || "fa";
    const when = nextAt(hour, minute);
    const msg = message(lang, pages);

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
            schedule: { at: when, repeats: true },
            sound: "default",
            extra: { type: "quran_reminder", pages },
            smallIcon: "ic_stat_icon",
            actionTypeId: "OPEN_APP"
          }]
        });
        return { ok: true, method: "native", at: when.toISOString(), pages };
      }

      const delay = when.getTime() - Date.now();
      if (delay > 0 && delay < 48 * 60 * 60 * 1000) {
        if (g.__quranReminderTimer) clearTimeout(g.__quranReminderTimer);
        g.__quranReminderTimer = setTimeout(async () => {
          if (SE.notify && SE.notify.show) {
            await SE.notify.show(msg.title, msg.body, "quran", true);
          } else if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification(msg.title, { body: msg.body, dir: "rtl", lang: "fa" });
          }
          scheduleOnce({ lang, pages, hour, minute, force: true });
        }, delay);
        return { ok: true, method: "web", at: when.toISOString(), pages };
      }
      return { ok: false, reason: "schedule_window" };
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
    if (g.__quranReminderTimer) {
      clearTimeout(g.__quranReminderTimer);
      g.__quranReminderTimer = null;
    }
    return { ok: true };
  }

  async function testNow(lang) {
    const cfg = getSettings();
    const msg = message(lang || "fa", cfg.pages);
    if (SE.notify && SE.notify.ensurePermission) await SE.notify.ensurePermission();
    if (SE.notify && SE.notify.show) {
      await SE.notify.show(msg.title, msg.body, "quran", true);
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

  SE.quranReminder = {
    REMINDER_ID, DEFAULTS, getSettings, setSettings,
    scheduleOnce, enable, disable, testNow, nextAt, message
  };

  function autoStart() {
    try {
      if (getSettings().enabled) scheduleOnce({});
    } catch (e) {}
  }
  if (g.document) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => setTimeout(autoStart, 800));
    } else setTimeout(autoStart, 800);
  }

  if (typeof module !== "undefined" && module.exports) module.exports = SE.quranReminder;
})(typeof globalThis !== "undefined" ? globalThis : this);
