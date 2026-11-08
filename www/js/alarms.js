(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  const ALARM_TYPES = [
    { key: "fajr",       labelFa: "نماز صبح",     labelEn: "Fajr",         col: 2 },
    { key: "sunrise",    labelFa: "طلوع خورشید",  labelEn: "Sunrise",      col: 3 },
    { key: "dhuhr",      labelFa: "نماز ظهر",     labelEn: "Dhuhr",        col: 4 },
    { key: "asr",        labelFa: "نماز عصر",     labelEn: "Asr",          col: 5 },
    { key: "maghrib",    labelFa: "نماز مغرب",    labelEn: "Maghrib",      col: 6 },
    { key: "isha",       labelFa: "نماز عشا",     labelEn: "Isha",         col: 8 },
    { key: "night1",     labelFa: "یک‌سوم شب",    labelEn: "1/3 of night", col: 9 },
    { key: "night2",     labelFa: "دو‌سوم شب",    labelEn: "2/3 of night", col: 10 }
  ];

  const DEFAULT_ENABLED = {
    fajr: true, sunrise: false, dhuhr: true, asr: true,
    maghrib: true, isha: true, night1: true, night2: true
  };

  function getEnabled() {
    return SE.store.prefs.get("alarms", DEFAULT_ENABLED);
  }

  function setEnabled(map) {
    SE.store.prefs.set("alarms", map);
  }

  function toggle(key, on) {
    const m = getEnabled();
    m[key] = !!on;
    setEnabled(m);
    return m;
  }

  function timeToDate(hhmm, baseDate, rollPast, timeZone) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || ""));
    if (!match) return null;
    const h = Number(match[1]), m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    const year = baseDate.getUTCFullYear();
    const month = baseDate.getUTCMonth() + 1;
    const day = baseDate.getUTCDate();
    const resolve = (y, mo, d) => timeZone && SE.sabtReminder && SE.sabtReminder.localDateTimeToTimestamp
      ? SE.sabtReminder.localDateTimeToTimestamp(y, mo, d, h, m, timeZone)
      : new Date(y, mo - 1, d, h, m, 0, 0).getTime();
    let timestamp = resolve(year, month, day);
    let date = new Date(timestamp);
    if (date.getTime() <= Date.now() - 60000) {
      if (!rollPast) return null;
      const next = new Date(Date.UTC(year, month - 1, day + 1));
      timestamp = resolve(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
      date = new Date(timestamp);
    }
    return date;
  }

  function buildNotifications(row, placeName, lang, dayNumber, targetDate, timeZone) {
    const enabled = getEnabled();
    const now = new Date();
    const list = [];
    const isFa = lang !== "en";
    const dayNum = dayNumber != null ? dayNumber : (Array.isArray(row) ? row[0] : null);
    const dayLabel = dayNum != null ? (isFa ? "روز " + dayNum : "Day " + dayNum) : "";

    ALARM_TYPES.forEach((t) => {
      if (!enabled[t.key]) return;
      const timeStr = row[t.col];
      if (!timeStr || timeStr === "—" || timeStr === null) return;
      const when = timeToDate(String(timeStr), targetDate || new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())), !targetDate, timeZone);
      if (!when) return;

      const title = isFa ? t.labelFa : t.labelEn;
      const body = isFa
        ? (placeName || "موقعیت شما") + (dayLabel ? " · " + dayLabel : "") + " · " + timeStr
        : (placeName || "Your location") + (dayLabel ? " · " + dayLabel : "") + " · " + timeStr;

      const dayKey = when.toISOString().slice(0, 10).replace(/-/g, "");
      const id = Math.abs((t.key + dayKey).split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0)) % 2000000000;

      const sound = (SE.sounds && SE.sounds.soundForNotification)
        ? SE.sounds.soundForNotification(t.key)
        : "default";
      const soundPref = SE.sounds && SE.sounds.getSoundPref ? SE.sounds.getSoundPref() : "default";
      const channelId = soundPref === "adhan"
        ? (t.key === "fajr" ? "prayer-adhan-fajr" : "prayer-adhan")
        : soundPref === "silent" ? "prayer-silent" : undefined;

      list.push({
        id, title, body,
        schedule: { at: when },
        extra: { type: t.key, time: timeStr, place: placeName, dayNumber: dayNum },
        sound: sound,
        channelId: channelId,
        smallIcon: "ic_stat_icon",
        actionTypeId: "OPEN_APP"
      });
    });
    return list;
  }

  async function scheduleForMonth(rows, placeName, lang, opts) {
    opts = opts || {};
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    const isNative = SE.platform && SE.platform.isNative && SE.platform.isNative();

    if (SE.notify && SE.notify.ensurePermission) {
      const status = await SE.notify.ensurePermission();
      if (status === "denied" || status === "unsupported") return { ok: false, reason: status };
    }

    const notifications = [];
    (rows || []).forEach((row) => {
      const dayNumber = Array.isArray(row) ? row[0] : null;
      let targetDate = null;
      if (opts.year != null && opts.month != null && dayNumber != null) {
        let gDate = null;
        if ((opts.calendar || "j") === "j" && SE.jalali && SE.jalali.jalaliToGregorian) {
          gDate = SE.jalali.jalaliToGregorian(opts.year, opts.month, dayNumber);
        } else {
          gDate = { year: opts.year, month: opts.month, day: dayNumber };
        }
        if (gDate) targetDate = new Date(Date.UTC(gDate.year, gDate.month - 1, gDate.day));
      }
      notifications.push(...buildNotifications(row, placeName, lang, dayNumber, targetDate, opts.timeZone));
    });

    if (!notifications.length) return { ok: true, count: 0 };

    try {
      if (isNative && p && p.schedule) {
        const prefs = SE.store && SE.store.prefs;
        const previous = prefs ? prefs.get("prayerNotificationIds", []) : [];
        if (previous.length && p.cancel) {
          try { await p.cancel({ notifications: previous.map((id) => ({ id })) }); } catch (e) {}
        }
        await p.schedule({ notifications });
        if (prefs) prefs.set("prayerNotificationIds", notifications.map((n) => n.id));
        return { ok: true, count: notifications.length, method: "native" };
      }

      let scheduled = 0;
      for (const n of notifications) {
        const delay = n.schedule.at.getTime() - Date.now();
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            if (SE.notify && SE.notify.show) SE.notify.show(n.title, n.body, n.extra && n.extra.type, true);
            if (SE.sounds && SE.sounds.onAlarmFire) SE.sounds.onAlarmFire(n.extra && n.extra.type, n.title, n.body);
          }, delay);
          scheduled++;
        }
      }
      return { ok: true, count: scheduled, method: "web" };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  async function scheduleForDay(row, placeName, lang, opts) {
    opts = opts || {};
    return scheduleForMonth([row], placeName, lang, opts);
  }

  async function cancelAll() {
    try {
      const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
      const prefs = SE.store && SE.store.prefs;
      const ids = prefs ? prefs.get("prayerNotificationIds", []) : [];
      if (p && p.cancel && ids.length) await p.cancel({ notifications: ids.map((id) => ({ id })) });
      if (prefs) prefs.set("prayerNotificationIds", []);
      return true;
    } catch (e) {
      return false;
    }
  }

  SE.alarms = {
    ALARM_TYPES, DEFAULT_ENABLED,
    getEnabled, setEnabled, toggle,
    buildNotifications, scheduleForDay, scheduleForMonth, cancelAll
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.alarms;
})(typeof globalThis !== "undefined" ? globalThis : this);
