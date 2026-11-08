(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  /**
   * روش‌های استاندارد محاسبه اوقات شرعی
   *
   * هر روش شامل:
   * - fajrAngle: زاویه خورشید برای فجر (درجه زیر افق)
   * - ishaAngle: زاویه برای عشا (یا ishaInterval دقیقه بعد از مغرب)
   * - asrFactor: 1 = شافعی/مالکی/حنبلی ، 2 = حنفی
   * - maghribOffset: دقیقه بعد از غروب (معمولاً 0)
   * - midnight: 'standard' | 'jafari'
   */

  const METHODS = {
    legacy: {
      id: "legacy",
      nameFa: "روش قبلی اپ",
      nameEn: "Legacy (original app)",
      fajrAngle: null,
      ishaAngle: null,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard",
      note: "فرمول‌های اصلی اپ (فجر از ناتیкал/سیویل)"
    },
    mwl: {
      id: "mwl",
      nameFa: "اتحادیه جهانی اسلام",
      nameEn: "Muslim World League",
      fajrAngle: 18,
      ishaAngle: 17,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard"
    },
    isna: {
      id: "isna",
      nameFa: "انجمن اسلامی آمریکای شمالی",
      nameEn: "ISNA",
      fajrAngle: 15,
      ishaAngle: 15,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard"
    },
    egypt: {
      id: "egypt",
      nameFa: "مرجع نقشه‌برداری مصر",
      nameEn: "Egyptian General Authority",
      fajrAngle: 19.5,
      ishaAngle: 17.5,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard"
    },
    uqu: {
      id: "uqu",
      nameFa: "ام‌القری (مکه)",
      nameEn: "Umm al-Qura (Makkah)",
      fajrAngle: 18.5,
      ishaAngle: null,
      ishaInterval: 90,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard",
      note: "عشا = مغرب + ۹۰ دقیقه (رمضان +۱۲۰)"
    },
    karachi: {
      id: "karachi",
      nameFa: "دانشگاه علوم اسلامی کراچی",
      nameEn: "University of Islamic Sciences, Karachi",
      fajrAngle: 18,
      ishaAngle: 18,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard"
    },
    tehran: {
      id: "tehran",
      nameFa: "مؤسسه ژئوفیزیک تهران",
      nameEn: "Tehran (Institute of Geophysics)",
      fajrAngle: 17.7,
      ishaAngle: 14,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "jafari",
      note: "نیمه‌شب به روش جعفری (وسط غروب تا فجر)"
    },
    jafari: {
      id: "jafari",
      nameFa: "جعفری (شیعه)",
      nameEn: "Jafari (Shia)",
      fajrAngle: 16,
      ishaAngle: 14,
      ishaInterval: null,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "jafari"
    },
    gulf: {
      id: "gulf",
      nameFa: "خلیج فارس",
      nameEn: "Gulf Region",
      fajrAngle: 19.5,
      ishaAngle: null,
      ishaInterval: 90,
      asrFactor: 1,
      maghribOffset: 0,
      midnight: "standard"
    }
  };

  const METHOD_ORDER = ["tehran", "mwl", "isna", "egypt", "uqu", "karachi", "jafari", "gulf", "legacy"];

  function getMethod(id) {
    return METHODS[id] || METHODS.tehran;
  }

  function listMethods(lang) {
    const isFa = lang !== "en";
    return METHOD_ORDER.map(id => {
      const m = METHODS[id];
      return {
        id: m.id,
        name: isFa ? m.nameFa : m.nameEn,
        fajrAngle: m.fajrAngle,
        ishaAngle: m.ishaAngle,
        ishaInterval: m.ishaInterval,
        note: m.note || null
      };
    });
  }

  const RAD = Math.PI / 180;

  function sunPosition(jd) {
    const T = (jd - 2451545) / 36525;
    const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
    const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
    const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
    const C = Math.sin(M * RAD) * (1.914602 - T * (0.004817 + 0.000014 * T))
            + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * T)
            + Math.sin(3 * M * RAD) * 0.000289;
    const omega = (125.04 - 1934.136 * T) * RAD;
    const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega);
    const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
    const eps = eps0 + 0.00256 * Math.cos(omega);
    const dec = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    const y = Math.tan(eps / 2 * RAD) ** 2;
    const eq = 4 / RAD * (
      y * Math.sin(2 * L0 * RAD)
      - 2 * e * Math.sin(M * RAD)
      + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD)
      - 0.5 * y * y * Math.sin(4 * L0 * RAD)
      - 1.25 * e * e * Math.sin(2 * M * RAD)
    );
    return { dec, eq };
  }

  function julian(y, m, d) {
    if (m <= 2) { y--; m += 12; }
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }

  function hhmm(min) {
    if (min == null || isNaN(min)) return null;
    let t = Math.floor(min + 1e-9);
    t = ((t % 1440) + 1440) % 1440;
    const h = Math.floor(t / 60);
    const m = t % 60;
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  }

  function hourAngle(lat, dec, angle) {
    const latR = lat * RAD;
    const decR = dec * RAD;
    const altR = angle * RAD;
    const cosH = (Math.sin(altR) - Math.sin(latR) * Math.sin(decR)) / (Math.cos(latR) * Math.cos(decR));
    if (cosH < -1 || cosH > 1) return null;
    return Math.acos(cosH) / RAD;
  }

  function computeDay(lat, lng, y, m, d, tz, methodId, opts) {
    opts = opts || {};
    const method = getMethod(methodId || (SE.store && SE.store.prefs ? SE.store.prefs.get("method", "tehran") : "tehran"));
    const asrFactor = opts.asrFactor != null ? opts.asrFactor : method.asrFactor;

    let off = 0;
    if (SE.sunLocal && SE.sunLocal.tzOffsetMinutes) {
      off = SE.sunLocal.tzOffsetMinutes(y, m, d, tz || "Asia/Tehran", lng);
    } else {
      off = Math.round((lng || 0) / 15) * 60;
    }

    const jd = julian(y, m, d);
    const { dec, eq } = sunPosition(jd);
    const noon = 720 - 4 * lng - eq + off;

    const H_horizon = hourAngle(lat, dec, -0.833);
    const sunrise = H_horizon != null ? noon - H_horizon * 4 : null;
    const sunset  = H_horizon != null ? noon + H_horizon * 4 : null;

    let fajr = null;
    if (method.fajrAngle != null) {
      const H = hourAngle(lat, dec, -method.fajrAngle);
      if (H != null) fajr = noon - H * 4;
    }

    let isha = null;
    if (method.ishaAngle != null) {
      const H = hourAngle(lat, dec, -method.ishaAngle);
      if (H != null) isha = noon + H * 4;
    } else if (method.ishaInterval != null && sunset != null) {
      isha = sunset + method.ishaInterval;
    }

    let asr = null;
    if (sunrise != null && sunset != null) {
      const absLatDec = Math.abs(lat - dec);
      const angle = Math.atan(1 / (asrFactor + Math.tan(absLatDec * RAD))) / RAD;
      const H = hourAngle(lat, dec, angle);
      if (H != null) asr = noon + H * 4;
    }

    const maghrib = sunset != null ? sunset + (method.maghribOffset || 0) : null;

    const H_naut = hourAngle(lat, dec, -12);
    const nauticalBegin = H_naut != null ? noon - H_naut * 4 : null;
    const nauticalEnd   = H_naut != null ? noon + H_naut * 4 : null;

    const H_civil = hourAngle(lat, dec, -6);
    const civilBegin = H_civil != null ? noon - H_civil * 4 : null;

    if (method.id === "legacy" && SE.formulas) {
      const ev = {
        nauticalBegin: hhmm(nauticalBegin),
        civilBegin: hhmm(civilBegin),
        sunrise: hhmm(sunrise),
        solarNoon: hhmm(noon),
        sunset: hhmm(sunset),
        nauticalEnd: hhmm(nauticalEnd)
      };
      try { fajr = SE.formulas.toMinutes(SE.formulas.blueHourStart(ev.nauticalBegin, ev.civilBegin)); } catch (e) {}
      try { asr = SE.formulas.toMinutes(SE.formulas.asrTime(ev.solarNoon, ev.sunset)); } catch (e) {}
      isha = noon;
    }

    let night1 = null, night2 = null;
    if (nauticalEnd != null && nauticalBegin != null) {
      const span = ((nauticalBegin + 1440) - nauticalEnd) % 1440;
      night1 = nauticalEnd + span / 3;
      night2 = nauticalEnd + (span * 2) / 3 + 1 / 60;
    }

    return {
      method: method.id,
      fajr: hhmm(fajr),
      sunrise: hhmm(sunrise),
      dhuhr: hhmm(noon),
      asr: hhmm(asr),
      maghrib: hhmm(maghrib),
      isha: hhmm(isha),
      night1: hhmm(night1),
      night2: hhmm(night2),
      nauticalBegin: hhmm(nauticalBegin),
      civilBegin: hhmm(civilBegin),
      solarNoon: hhmm(noon),
      sunset: hhmm(sunset),
      nauticalEnd: hhmm(nauticalEnd)
    };
  }

  function buildRowWithMethod(dayNumber, lat, lng, y, m, d, tz, methodId, opts) {
    const ev = computeDay(lat, lng, y, m, d, tz, methodId, opts);
    return [
      dayNumber,
      ev.nauticalBegin,
      ev.fajr,
      ev.sunrise,
      ev.dhuhr,
      ev.asr,
      ev.maghrib,
      ev.nauticalEnd,
      ev.isha,
      ev.night1,
      ev.night2
    ];
  }

  function getCurrentMethod() {
    return SE.store && SE.store.prefs ? SE.store.prefs.get("method", "tehran") : "tehran";
  }

  function setCurrentMethod(id) {
    if (METHODS[id] && SE.store && SE.store.prefs) {
      SE.store.prefs.set("method", id);
      return true;
    }
    return false;
  }

  SE.methods = {
    METHODS,
    METHOD_ORDER,
    getMethod,
    listMethods,
    computeDay,
    buildRowWithMethod,
    getCurrentMethod,
    setCurrentMethod
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.methods;
})(typeof globalThis !== "undefined" ? globalThis : this);
