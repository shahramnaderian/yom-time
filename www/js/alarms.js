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

  function timeToDate(hhmm, baseDate, rollPast) {
    if (!hhmm || typeof hhmm !== "string") return null;
    const parts = hhmm.split(":");
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), h, m, 0, 0);
    if (d.getTime() <= Date.now() - 60000) {
      if (rollPast) d.setDate(d.getDate() + 1);
      else return null;
    }
    return d;
  }

  function buildNotifications(row, placeName, lang, dayNumber, targetDate) {
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
      const when = timeToDate(String(timeStr), targetDate || now, !targetDate);
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
        schedule: { at: when, allowWhileIdle: true },
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
        if (gDate) targetDate = new Date(gDate.year, gDate.month - 1, gDate.day, 0, 0, 0, 0);
      }
      notifications.push(...buildNotifications(row, placeName, lang, dayNumber, targetDate));
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

  async function scheduleHomeEvents(events, placeName) {
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    const native = SE.platform && SE.platform.isNative && SE.platform.isNative();
    const prefs = SE.store && SE.store.prefs;
    const previous = prefs ? prefs.get("homeNightNotificationIds", []) : [];
    const notifications = (events || []).filter(e => e.at && e.at.getTime() - (Number(e.minutes)||0)*60000 > Date.now()).map(e => {
      const when = new Date(e.at.getTime() - (Number(e.minutes)||0)*60000);
      const dayKey = when.toISOString().slice(0,10).replace(/-/g,"");
      const id = Math.abs((e.key + dayKey + "home").split("").reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0)) % 2000000000;
      const lead = Number(e.minutes)||0;
      const soundMode=e.sound==="adhan"?"adhan":"system";
      return {id,title:e.label,body:(placeName||"موقعیت شما")+" · "+e.label+" · "+(lead?lead+" دقیقه قبل":"اکنون"),schedule:{at:when,allowWhileIdle:true},extra:{type:e.key,homeEventAlarm:true,soundMode},channelId:soundMode==="adhan"?"home-event-adhan":"home-event-ringtone",sound:soundMode==="adhan"?"adhan.mp3":"default",smallIcon:"ic_stat_icon",actionTypeId:"OPEN_APP"};
    });
    if (notifications.length && SE.notify && SE.notify.ensurePermission) { const status = await SE.notify.ensurePermission(); if (status === "denied" || status === "unsupported") return {ok:false,reason:status}; }
    try {
      if (native && p && p.schedule) {
        if(previous.length && p.cancel) { try { await p.cancel({notifications:previous.map(id=>({id}))}); } catch(e) {} }
        if(notifications.length) await p.schedule({notifications});
        if(prefs) prefs.set("homeNightNotificationIds",notifications.map(n=>n.id));
        return {ok:true,count:notifications.length,method:"native"};
      }
      if(previous.length && native && p && p.cancel) { try { await p.cancel({notifications:previous.map(id=>({id}))}); } catch(e) {} }
      let count=0;
      notifications.forEach(n=>{const delay=n.schedule.at.getTime()-Date.now();if(delay>0&&delay<48*60*60*1000){setTimeout(()=>{if(SE.notify&&SE.notify.show)SE.notify.show(n.title,n.body,n.extra.type,true);if(SE.sounds&&SE.sounds.onAlarmFire)SE.sounds.onAlarmFire(n.extra.type,n.title,n.body,{soundMode:n.extra.soundMode});},delay);count++;}});
      if(prefs) prefs.set("homeNightNotificationIds",notifications.map(n=>n.id));
      return {ok:true,count,method:"web"};
    } catch(e) { return {ok:false,error:String(e.message||e)}; }
  }

  async function scheduleCustomReminder(settings) {
    settings = settings || {};
    const prefs = SE.store && SE.store.prefs;
    const p = SE.notify && SE.notify.plugin ? SE.notify.plugin() : null;
    const native = SE.platform && SE.platform.isNative && SE.platform.isNative();
    const previous = prefs ? prefs.get("customReminderNotificationIds", []) : [];
    try {
      if (native && p && p.cancel && previous.length) {
        try { await p.cancel({ notifications: previous.map(id => ({ id })) }); } catch (e) {}
      }
      if (!settings.enabled) {
        if (prefs) prefs.set("customReminderNotificationIds", []);
        return { ok: true, count: 0, disabled: true };
      }
      const time = String(settings.time || "09:00").split(":").map(Number);
      if (time.length !== 2 || !Number.isInteger(time[0]) || !Number.isInteger(time[1]) || time[0] < 0 || time[0] > 23 || time[1] < 0 || time[1] > 59) return { ok:false, reason:"invalid_time" };
      const title = String(settings.text || "یادآوری دلخواه").trim().slice(0,120) || "یادآوری دلخواه";
      const soundMode = settings.sound === "adhan" ? "adhan" : "system";
      const notifications = [];
      const base = new Date();
      for (let i=0;i<30;i++) {
        const when = new Date(base.getFullYear(),base.getMonth(),base.getDate()+i,time[0],time[1],0,0);
        if (when.getTime() <= Date.now()+15000) continue;
        const dayKey = when.getFullYear()*10000+(when.getMonth()+1)*100+when.getDate();
        const id = 300000000 + (dayKey % 1000000);
        notifications.push({id,title:"یادآوری دلخواه",body:title,schedule:{at:when,allowWhileIdle:true},extra:{type:"custom-reminder",soundMode},channelId:soundMode==="adhan"?"custom-reminder-adhan":"custom-reminder-ringtone",sound:soundMode==="adhan"?"adhan.mp3":"default",smallIcon:"ic_stat_icon",actionTypeId:"OPEN_APP"});
      }
      if (notifications.length && SE.notify && SE.notify.ensurePermission) {
        const status = await SE.notify.ensurePermission();
        if (status !== "granted") return {ok:false,reason:status};
      }
      if (native && p && p.schedule) {
        if (notifications.length) await p.schedule({notifications});
        if (prefs) prefs.set("customReminderNotificationIds",notifications.map(n=>n.id));
        return {ok:true,count:notifications.length,method:"native"};
      }
      if (prefs) prefs.set("customReminderNotificationIds",[]);
      return {ok:false,reason:"native_required"};
    } catch(e) { return {ok:false,error:String(e.message||e)}; }
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
    buildNotifications, scheduleForDay, scheduleForMonth, scheduleHomeEvents, scheduleCustomReminder, cancelAll
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.alarms;
})(typeof globalThis !== "undefined" ? globalThis : this);
