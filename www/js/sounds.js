(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  const SOUND_OPTIONS = [
    { id: "adhan",    labelFa: "اذان",           labelEn: "Adhan",           icon: "🕌" },
    { id: "default",  labelFa: "صدای اعلان",     labelEn: "Notification",    icon: "🔔" },
    { id: "system",   labelFa: "زنگ گوشی",       labelEn: "Phone ringtone",  icon: "📱" },
    { id: "silent",   labelFa: "بی‌صدا",         labelEn: "Silent",          icon: "🔇" }
  ];

  const DEFAULT_SOUND = "adhan";

  const ADHAN_FILES = {
    fajr: ["sounds/adhan-fajr.mp3", "sounds/adhan.mp3"],
    default: ["sounds/adhan.mp3", "sounds/adhan-fajr.mp3"]
  };

  function getSoundPref() {
    try {
      return SE.store.prefs.get("alarmSound", DEFAULT_SOUND);
    } catch (e) {
      return DEFAULT_SOUND;
    }
  }

  function setSoundPref(id) {
    if (!SOUND_OPTIONS.some((o) => o.id === id)) return false;
    SE.store.prefs.set("alarmSound", id);
    return true;
  }

  function listOptions(lang) {
    const isFa = lang !== "en";
    const current = getSoundPref();
    return SOUND_OPTIONS.map((o) => ({
      id: o.id,
      label: isFa ? o.labelFa : o.labelEn,
      icon: o.icon,
      selected: o.id === current
    }));
  }

  function soundForNotification(alarmType) {
    const pref = getSoundPref();
    if (pref === "silent") return null;
    if (pref === "adhan") {
      return alarmType === "fajr" ? "adhan_fajr.mp3" : "adhan.mp3";
    }
    if (pref === "system") return "default";
    return "default";
  }

  let currentAudio = null;

  function stopAdhan() {
    try {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
      }
    } catch (e) {}
  }

  async function playAdhan(alarmType, opts) {
    opts = opts || {};
    stopAdhan();
    const candidates = alarmType === "fajr" ? ADHAN_FILES.fajr : ADHAN_FILES.default;
    const base = opts.baseUrl || "";

    for (const file of candidates) {
      try {
        const url = base + file;
        const audio = new Audio(url);
        audio.preload = "auto";
        currentAudio = audio;
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = () => resolve();
          audio.onerror = () => reject(new Error("load failed"));
          setTimeout(() => reject(new Error("timeout")), 8000);
        });
        await audio.play();
        return { ok: true, file };
      } catch (e) {
        currentAudio = null;
      }
    }
    return { ok: false, reason: "no_adhan_file" };
  }

  async function onAlarmFire(alarmType, title, body) {
    const pref = getSoundPref();
    if (pref === "silent") return;

    if (pref === "adhan") {
      const r = await playAdhan(alarmType);
      if (r.ok) return r;
    }

    try {
      const ctx = new (g.AudioContext || g.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = alarmType === "fajr" ? 520 : 660;
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => {
        try { osc.stop(); ctx.close(); } catch (e) {}
      }, 800);
    } catch (e) {}
  }

  async function preview(id) {
    const prev = getSoundPref();
    if (id) setSoundPref(id);
    const pref = getSoundPref();
    if (pref === "silent") {
      if (id) setSoundPref(prev);
      return { ok: true, silent: true };
    }
    if (pref === "adhan") {
      const r = await playAdhan("default");
      setTimeout(stopAdhan, 4000);
      if (id) setSoundPref(prev);
      return r;
    }
    await onAlarmFire("dhuhr");
    if (id) setSoundPref(prev);
    return { ok: true, beep: true };
  }

  SE.sounds = {
    SOUND_OPTIONS,
    DEFAULT_SOUND,
    ADHAN_FILES,
    getSoundPref,
    setSoundPref,
    listOptions,
    soundForNotification,
    playAdhan,
    stopAdhan,
    onAlarmFire,
    preview
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.sounds;
})(typeof globalThis !== "undefined" ? globalThis : this);
