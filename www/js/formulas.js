(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const HHMM = /^(\d{1,2}):(\d{2})$/;
  function toMinutes(s) {
    const m = HHMM.exec(String(s));
    if (!m) throw new Error("Both inputs must be valid time strings in 'HH:MM' format.");
    return Number(m[1]) * 60 + Number(m[2]);
  }
  function fromMinutes(total) {
    const h = Math.floor(total / 60) % 24, m = total % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }
  function blueHourStart(nauticalTwilightBegin, civilTwilightBegin) {
    const n = toMinutes(nauticalTwilightBegin);
    const c = toMinutes(civilTwilightBegin);
    if (c <= n) throw new Error("Civil twilight begin must occur after nautical twilight begin.");
    const seconds = n * 60 + (c - n) * 40;
    return fromMinutes(Math.floor(seconds / 60));
  }
  function asrTime(noon, sunset) {
    return fromMinutes(Math.floor((toMinutes(noon) + toMinutes(sunset) + 1) / 2));
  }
  const mod = (a, m) => (a % m + m) % m;
  function nightFraction(maghribEnd, dayStart, numerator, extraSeconds) {
    const x = toMinutes(maghribEnd), y = toMinutes(dayStart);
    const span = mod(y - x, 1440);
    const secs = mod(x * 60 + span * 60 * numerator / 3 + extraSeconds, 86400);
    return fromMinutes(Math.floor(secs / 60));
  }
  const oneThirdNight = (maghribEnd, dayStart) => nightFraction(maghribEnd, dayStart, 1, 0);
  const twoThirdsNight = (maghribEnd, dayStart) => nightFraction(maghribEnd, dayStart, 2, 1);
  const COLUMNS = [
    { key: "day", head: ["تاریخ"], headEn: ["Day"], status: "legacy" },
    { key: "dayStart", head: ["شروع", "روز"], headEn: ["Starting of", "the day"], status: "legacy", from: "nautical_twilight_begin" },
    { key: "fajr", head: ["نماز", "صبح"], headEn: ["Fajr", ""], status: "legacy", from: "nautical + (civil - nautical)/6*4" },
    { key: "sunrise", head: ["طلوع", "خورشید"], headEn: ["Sunrise", ""], status: "legacy", from: "sunrise" },
    { key: "dhuhr", head: ["نماز", "ظهر"], headEn: ["Dhuhr", ""], status: "legacy", from: "solar_noon" },
    { key: "asr", head: ["نماز", "عصر"], headEn: ["Asr", ""], status: "legacy-excel", from: "round((noon + sunset)/2)" },
    { key: "sunset", head: ["نماز", "مغرب"], headEn: ["Maghrib", ""], status: "legacy", from: "sunset" },
    { key: "maghribEnd", head: ["پایان", "روز"], headEn: ["End of", "the day"], status: "legacy", from: "nautical_twilight_end" },
    { key: "isha", head: ["نماز عشا"], headEn: ["Isha", ""], status: "legacy-placeholder", from: "solar_noon (placeholder in the old app)" },
    { key: "night1", head: ["یک سوم", "شب"], headEn: ["1/3 of", "night"], status: "legacy-excel", from: "end + (dayStart - end)/3" },
    { key: "night2", head: ["دو سوم", "شب"], headEn: ["2/3 of", "night"], status: "legacy-excel", from: "end + (dayStart - end)*2/3 + 1 s" }
  ];
  function buildRow(dayNumber, ev, warnings) {
    const safe = (column, fn) => {
      try {
        return fn();
      } catch (e) {
        if (warnings) warnings.push({ day: dayNumber, column, message: e.message });
        return null;
      }
    };
    const have = (v) => v === null || v === void 0 ? null : v;
    return [
      dayNumber,
      have(ev.nauticalBegin),
      safe("fajr", () => blueHourStart(ev.nauticalBegin, ev.civilBegin)),
      have(ev.sunrise),
      have(ev.solarNoon),
      safe("asr", () => asrTime(ev.solarNoon, ev.sunset)),
      have(ev.sunset),
      have(ev.nauticalEnd),
      have(ev.solarNoon),
      safe("night1", () => oneThirdNight(ev.nauticalEnd, ev.nauticalBegin)),
      safe("night2", () => twoThirdsNight(ev.nauticalEnd, ev.nauticalBegin))
    ];
  }
  function formatCell(v, lang) {
    if (v == null) return "—";
    if (lang === "fa") {
      return String(v).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
    }
    return String(v);
  }
  SE.formulas = { COLUMNS, buildRow, formatCell, blueHourStart, asrTime, oneThirdNight, twoThirdsNight, toMinutes, fromMinutes };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.formulas;
})(typeof globalThis !== "undefined" ? globalThis : this);
