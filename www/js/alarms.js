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

  function timeToDate(hhmm, baseDate) {
    if (!hhmm || typeof hhmm !== "string") return null;
    const parts = hhmm.split(":");
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0, 0);
    if (d.getTime() <= Date.now() - 60000) d.setDate(d.getDate() + 1);
    return d;
  }

  function buildNotifications(row, placeName, lang, dayNumber) {
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
      const when = timeToDate(String(timeStr), now);
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

      list.push({
        id, title, body,
        schedule: { at: when },
        extra: { type: t.key, time: timeStr, place: placeName, dayNumber: dayNum },
        sound: sound,
        smallIcon: "ic_stat_icon",
        actionTypeId: "OPEN_APP"
      });
    });
    return list;
  }

  async function scheduleForDay(row, placeName, lang, opts) {
    opts = opts || {};
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    const isNative = SE.platform && SE.platform.isNative && SE.platform.isNative();

    if (SE.notify && SE.notify.ensurePermission) {
      const status = await SE.notify.ensurePermission();
      if (status === "denied" || status === "unsupported") {
        return { ok: false, reason: status };
      }
    }

    const dayNumber = opts.dayNumber != null ? opts.dayNumber : (Array.isArray(row) ? row[0] : null);
    const notifications = buildNotifications(row, placeName, lang, dayNumber);
    if (!notifications.length) return { ok: true, count: 0 };

    try {
      if (isNative && p && p.schedule) {
        await p.schedule({ notifications });
        return { ok: true, count: notifications.length, method: "native", dayNumber };
      }

      let scheduled = 0;
      for (const n of notifications) {
        const delay = n.schedule.at.getTime() - Date.now();
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
          setTimeout(() => {
            if (SE.notify && SE.notify.show) {
              SE.notify.show(n.title, n.body, n.extra && n.extra.type, true);
            }
            if (SE.sounds && SE.sounds.onAlarmFire) {
              SE.sounds.onAlarmFire(n.extra && n.extra.type, n.title, n.body);
            }
          }, delay);
          scheduled++;
        }
      }
      return { ok: true, count: scheduled, method: "web", dayNumber };
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  async function cancelAll() {
    try {
      const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
      if (p && p.cancel && p.getPending) {
        const pending = await p.getPending();
        if (pending && pending.notifications && pending.notifications.length) {
          await p.cancel({ notifications: pending.notifications.map(n => ({ id: n.id })) });
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  SE.alarms = {
    ALARM_TYPES, DEFAULT_ENABLED,
    getEnabled, setEnabled, toggle,
    buildNotifications, scheduleForDay, cancelAll
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.alarms;
})(typeof globalThis !== "undefined" ? globalThis : this);
