(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const G_DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const J_DIM = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  function isLeapG(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function isLeapJ(y) {
    const a = (y - (y > 0 ? 474 : 473)) % 2820 + 474;
    return ((a + 38) * 682) % 2816 < 682;
  }
  function gToJ(gy, gm, gd) {
    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let gy2 = gm > 2 ? gy + 1 : gy;
    let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + 33 * Math.floor(days / 12053);
    days %= 12053;
    jy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      jy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let jm, jd;
    if (days < 186) {
      jm = 1 + Math.floor(days / 31);
      jd = 1 + (days % 31);
    } else {
      jm = 7 + Math.floor((days - 186) / 30);
      jd = 1 + ((days - 186) % 30);
    }
    return { year: jy, month: jm, day: jd };
  }
  function jToG(jy, jm, jd) {
    jy += 1595;
    let days = -355668 + 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4) + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;
    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }
    gy += 4 * Math.floor(days / 1461);
    days %= 1461;
    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }
    let gd = days + 1;
    const sal_a = [0, 31, (isLeapG(gy) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm;
    for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) gd -= sal_a[gm];
    return { year: gy, month: gm, day: gd };
  }
  function todayJalali() {
    const d = new Date();
    return gToJ(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  function daysInMonth(y, m, cal) {
    if (cal === "j") return m <= 6 ? 31 : m <= 11 ? 30 : (isLeapJ(y) ? 30 : 29);
    return m === 2 ? (isLeapG(y) ? 29 : 28) : G_DIM[m - 1];
  }
  SE.jalali = { gToJ, jToG, todayJalali, daysInMonth, isLeapJ, isLeapG };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.jalali;
})(typeof globalThis !== "undefined" ? globalThis : this);
