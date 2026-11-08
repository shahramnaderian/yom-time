(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const RAD = Math.PI / 180;
  const HORIZON = -0.833, CIVIL = -6, NAUTICAL = -12;
  function sunPosition(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = (280.46646 + T * (36000.76983 + T * 3032e-7)) % 360;
    const M = 357.52911 + T * (35999.05029 - 1537e-7 * T);
    const e = 0.016708634 - T * (42037e-9 + 1267e-10 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (4817e-6 + 14e-6 * T)) + Math.sin(2 * M * RAD) * (0.019993 - 101e-6 * T) + Math.sin(3 * M * RAD) * 289e-6;
    const omega = (125.04 - 1934.136 * T) * RAD;
    const lambda = L0 + C - 569e-5 - 478e-5 * Math.sin(omega);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (59e-5 - T * 1813e-6))) / 60) / 60;
    const eps = eps0 + 256e-5 * Math.cos(omega);
    const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y = Math.tan(eps / 2 * RAD) ** 2;
    const eq = 4 / RAD * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD));
    return { dec, eq };
  }
  function tzOffsetMinutes(y, m, d, tz, lng) {
    try {
      const guess = Date.UTC(y, m - 1, d, 12, 0) - Math.round((lng || 0) * 4) * 6e4;
      const p = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }).formatToParts(new Date(guess));
      const v = (type) => Number(p.find((x) => x.type === type).value);
      return Math.round((Date.UTC(v("year"), v("month") - 1, v("day"), v("hour"), v("minute")) - guess) / 6e4);
    } catch (e) {
      return Math.round((lng || 0) / 15) * 60;
    }
  }
  const hhmm = (min) => {
    const t = Math.floor(min + 1e-9);
    const h = Math.floor(t / 60) % 24, m = t % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  };
  function julian(y, m, d) {
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function eventsForDay(lat, lng, y, m, d, tz) {
    const jd = julian(y, m, d);
    const { dec, eq } = sunPosition(jd);
    const latR = lat * RAD;
    const off = tzOffsetMinutes(y, m, d, tz, lng);
    const ha = (alt) => {
      const cosH = (Math.sin(alt * RAD) - Math.sin(latR) * Math.sin(dec * RAD)) / (Math.cos(latR) * Math.cos(dec * RAD));
      if (cosH < -1 || cosH > 1) return null;
      return Math.acos(cosH) / RAD;
    };
    const noon = 720 - 4 * lng - eq + off;
    const riseSet = (alt) => {
      const H = ha(alt);
      if (H == null) return { rise: null, set: null };
      return { rise: hhmm(noon - H * 4), set: hhmm(noon + H * 4) };
    };
    const h = riseSet(HORIZON);
    const c = riseSet(CIVIL);
    const n = riseSet(NAUTICAL);
    return {
      nauticalBegin: n.rise,
      civilBegin: c.rise,
      sunrise: h.rise,
      solarNoon: hhmm(noon),
      sunset: h.set,
      nauticalEnd: n.set
    };
  }
  SE.sunLocal = { eventsForDay, tzOffsetMinutes, sunPosition, julian };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.sunLocal;
})(typeof globalThis !== "undefined" ? globalThis : this);
