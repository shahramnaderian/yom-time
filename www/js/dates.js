(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  const JALALI_MONTHS_FA = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const JALALI_MONTHS_EN = ["Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar", "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand"];
  const GREGORIAN_MONTHS_FA = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];
  const GREGORIAN_MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const HIJRI_MONTHS_FA = ["محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول", "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"];
  const HIJRI_MONTHS_EN = ["Muharram", "Safar", "Rabiʻ I", "Rabiʻ II", "Jumada I", "Jumada II", "Rajab", "Shaʻban", "Ramadan", "Shawwal", "Dhuʻl-Qiʻdah", "Dhuʻl-Hijjah"];
  const WEEKDAYS_FA = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
  const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function toFaDigits(s) {
    return String(s).replace(/\d/g, d => "۰۱۲۳۴۵۶۷۸۹"[d]);
  }

  function g2j(gy, gm, gd) {
    if (SE.jalali && SE.jalali.gToJ) return SE.jalali.gToJ(gy, gm, gd);
    if (SE.jalali && SE.jalali.gregorianToJalali) return SE.jalali.gregorianToJalali(gy, gm, gd);
    const G_DIM = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const J_DIM = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    const div = (a, b) => Math.floor(a / b);
    const isLeap = y => y % 4 === 0 && y % 100 !== 0 || y % 400 === 0;
    const gy2 = gy - 1600, gm2 = gm - 1, gd2 = gd - 1;
    let gDayNo = 365 * gy2 + div(gy2 + 3, 4) - div(gy2 + 99, 100) + div(gy2 + 399, 400);
    for (let i = 0; i < gm2; i++) gDayNo += G_DIM[i];
    if (gm2 > 1 && isLeap(gy)) gDayNo++;
    gDayNo += gd2;
    let jDayNo = gDayNo - 79;
    const jNp = div(jDayNo, 12053);
    jDayNo -= 12053 * jNp;
    let jy = 979 + 33 * jNp + 4 * div(jDayNo, 1461);
    jDayNo %= 1461;
    if (jDayNo >= 366) { jy += div(jDayNo - 1, 365); jDayNo = (jDayNo - 1) % 365; }
    let i = 0;
    for (; i < 11 && jDayNo >= J_DIM[i]; i++) jDayNo -= J_DIM[i];
    return { year: jy, month: i + 1, day: jDayNo + 1 };
  }

  function j2g(jy, jm, jd) {
    if (SE.jalali && SE.jalali.jToG) return SE.jalali.jToG(jy, jm, jd);
    if (SE.jalali && SE.jalali.jalaliToGregorian) return SE.jalali.jalaliToGregorian(jy, jm, jd);
    return null;
  }

  function gregorianToJulian(gy, gm, gd) {
    if (gm <= 2) { gy--; gm += 12; }
    const A = Math.floor(gy / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (gy + 4716)) + Math.floor(30.6001 * (gm + 1)) + gd + B - 1524.5;
  }

  function julianToHijri(jd) {
    const l = Math.floor(jd - 1948439.5) + 10632;
    const n = Math.floor((l - 1) / 10631);
    const l2 = l - 10631 * n + 354;
    const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
              Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
    const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
               Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
    const m = Math.floor((24 * l3) / 709);
    const d = l3 - Math.floor((709 * m) / 24);
    const y = 30 * n + j - 30;
    return { year: y, month: m, day: d };
  }

  function g2h(gy, gm, gd) {
    return julianToHijri(gregorianToJulian(gy, gm, gd));
  }

  function ofGregorian(gy, gm, gd) {
    const j = g2j(gy, gm, gd);
    const h = g2h(gy, gm, gd);
    const dt = new Date(gy, gm - 1, gd);
    return { gregorian: { year: gy, month: gm, day: gd }, jalali: j, hijri: h, weekday: dt.getDay() };
  }

  function ofJalali(jy, jm, jd) {
    const g = j2g(jy, jm, jd);
    if (!g) throw new Error("تبدیل جلالی ناموفق");
    return ofGregorian(g.year, g.month, g.day);
  }

  function today() {
    const d = new Date();
    return ofGregorian(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }

  function formatJalali(j, lang) {
    const isFa = lang !== "en";
    const months = isFa ? JALALI_MONTHS_FA : JALALI_MONTHS_EN;
    const day = isFa ? toFaDigits(j.day) : j.day;
    const year = isFa ? toFaDigits(j.year) : j.year;
    return day + " " + months[j.month - 1] + " " + year;
  }

  function formatGregorian(g, lang) {
    const isFa = lang !== "en";
    const months = isFa ? GREGORIAN_MONTHS_FA : GREGORIAN_MONTHS_EN;
    const day = isFa ? toFaDigits(g.day) : g.day;
    const year = isFa ? toFaDigits(g.year) : g.year;
    return day + " " + months[g.month - 1] + " " + year;
  }

  function formatHijri(h, lang) {
    const isFa = lang !== "en";
    const months = isFa ? HIJRI_MONTHS_FA : HIJRI_MONTHS_EN;
    const day = isFa ? toFaDigits(h.day) : h.day;
    const year = isFa ? toFaDigits(h.year) : h.year;
    return day + " " + months[h.month - 1] + " " + year;
  }

  function formatWeekday(weekday, lang) {
    return lang !== "en" ? WEEKDAYS_FA[weekday] : WEEKDAYS_EN[weekday];
  }

  function display(dateObj, lang) {
    lang = lang || "fa";
    const isFa = lang !== "en";
    const d = dateObj || today();
    const weekday = formatWeekday(d.weekday, lang);
    const jalali = formatJalali(d.jalali, lang);
    const gregorian = formatGregorian(d.gregorian, lang);
    const hijri = formatHijri(d.hijri, lang);
    return {
      weekday, jalali, gregorian, hijri,
      line: isFa ? weekday + " " + jalali + " · " + gregorian + " · " + hijri
                 : weekday + ", " + jalali + " · " + gregorian + " · " + hijri,
      short: isFa ? weekday + " " + jalali : weekday + ", " + jalali,
      raw: d
    };
  }

  function displayToday(lang) {
    return display(today(), lang);
  }

  function dayNumberJalali(dateObj) {
    return (dateObj || today()).jalali.day;
  }

  SE.dates = {
    today, ofGregorian, ofJalali, g2j, g2h, j2g,
    formatJalali, formatGregorian, formatHijri, formatWeekday,
    display, displayToday, dayNumberJalali, toFaDigits,
    JALALI_MONTHS_FA, JALALI_MONTHS_EN,
    GREGORIAN_MONTHS_FA, GREGORIAN_MONTHS_EN,
    HIJRI_MONTHS_FA, HIJRI_MONTHS_EN,
    WEEKDAYS_FA, WEEKDAYS_EN
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.dates;
})(typeof globalThis !== "undefined" ? globalThis : this);
