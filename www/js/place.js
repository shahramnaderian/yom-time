(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  /**
   * مدیریت مکان برای هر نقطه از جهان
   * - مختصات دستی (lat, lng)
   * - GPS
   * - جستجوی شهر
   * - تشخیص خودکار منطقه زمانی
   */

  const SAMPLE_CITIES = [
    { city: "تهران", cityEn: "Tehran", lat: 35.6892, lng: 51.389, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مشهد", cityEn: "Mashhad", lat: 36.2605, lng: 59.6168, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اصفهان", cityEn: "Isfahan", lat: 32.6546, lng: 51.668, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کرج", cityEn: "Karaj", lat: 35.8327, lng: 50.9916, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "شیراز", cityEn: "Shiraz", lat: 29.5918, lng: 52.5837, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "تبریز", cityEn: "Tabriz", lat: 38.08, lng: 46.2919, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اهواز", cityEn: "Ahvaz", lat: 31.3183, lng: 48.6706, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "قم", cityEn: "Qom", lat: 34.6401, lng: 50.8764, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کرمانشاه", cityEn: "Kermanshah", lat: 34.3142, lng: 47.065, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ارومیه", cityEn: "Urmia", lat: 37.5527, lng: 45.076, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "رشت", cityEn: "Rasht", lat: 37.2808, lng: 49.5832, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "زاهدان", cityEn: "Zahedan", lat: 29.4963, lng: 60.8629, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "همدان", cityEn: "Hamadan", lat: 34.7992, lng: 48.5146, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کرمان", cityEn: "Kerman", lat: 30.2832, lng: 57.0788, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "یزد", cityEn: "Yazd", lat: 31.8972, lng: 54.3675, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اردبیل", cityEn: "Ardabil", lat: 38.2498, lng: 48.2933, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بندرعباس", cityEn: "Bandar Abbas", lat: 27.1865, lng: 56.2808, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اراک", cityEn: "Arak", lat: 34.0917, lng: 49.6892, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "زنجان", cityEn: "Zanjan", lat: 36.6764, lng: 48.4963, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "سنندج", cityEn: "Sanandaj", lat: 35.315, lng: 46.9988, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "قزوین", cityEn: "Qazvin", lat: 36.2688, lng: 50.0041, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "خرم‌آباد", cityEn: "Khorramabad", lat: 33.4878, lng: 48.3558, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "گرگان", cityEn: "Gorgan", lat: 36.8427, lng: 54.4439, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ساری", cityEn: "Sari", lat: 36.5633, lng: 53.0601, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بجنورد", cityEn: "Bojnurd", lat: 37.4747, lng: 57.329, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بیرجند", cityEn: "Birjand", lat: 32.8663, lng: 59.2211, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ایلام", cityEn: "Ilam", lat: 33.6374, lng: 46.4227, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بوشهر", cityEn: "Bushehr", lat: 28.9689, lng: 50.8366, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "شهرکرد", cityEn: "Shahr-e Kord", lat: 32.3252, lng: 50.8644, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "یاسوج", cityEn: "Yasuj", lat: 30.6682, lng: 51.588, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "سمنان", cityEn: "Semnan", lat: 35.5769, lng: 53.3921, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مریوان", cityEn: "Marivan", lat: 35.5269, lng: 46.176, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "سقز", cityEn: "Saqqez", lat: 36.2499, lng: 46.267, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بانه", cityEn: "Baneh", lat: 35.9975, lng: 45.8853, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "قروه", cityEn: "Qorveh", lat: 35.1672, lng: 47.8021, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بیجار", cityEn: "Bijar", lat: 35.8728, lng: 47.6025, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کامیاران", cityEn: "Kamyaran", lat: 34.7956, lng: 46.9356, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مهاباد", cityEn: "Mahabad", lat: 36.7631, lng: 45.7222, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بوکان", cityEn: "Bukan", lat: 36.5211, lng: 46.2089, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "خوی", cityEn: "Khoy", lat: 38.5503, lng: 44.9521, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "میاندوآب", cityEn: "Miandoab", lat: 36.9694, lng: 46.1097, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "پیرانشهر", cityEn: "Piranshahr", lat: 36.6944, lng: 45.1417, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مراغه", cityEn: "Maragheh", lat: 37.3892, lng: 46.2394, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مرند", cityEn: "Marand", lat: 38.4329, lng: 45.7749, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "نیشابور", cityEn: "Neyshabur", lat: 36.2133, lng: 58.7958, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "سبزوار", cityEn: "Sabzevar", lat: 36.2126, lng: 57.6819, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "تربت حیدریه", cityEn: "Torbat Heydariyeh", lat: 35.274, lng: 59.2195, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کاشان", cityEn: "Kashan", lat: 33.985, lng: 51.41, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "نجف‌آباد", cityEn: "Najafabad", lat: 32.6344, lng: 51.3668, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "خمینی‌شهر", cityEn: "Khomeyni Shahr", lat: 32.6856, lng: 51.5361, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "دزفول", cityEn: "Dezful", lat: 32.3831, lng: 48.4019, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "آبادان", cityEn: "Abadan", lat: 30.3392, lng: 48.3043, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "خرمشهر", cityEn: "Khorramshahr", lat: 30.4408, lng: 48.1843, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بروجرد", cityEn: "Borujerd", lat: 33.8973, lng: 48.7516, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ملایر", cityEn: "Malayer", lat: 34.3016, lng: 48.8217, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ساوه", cityEn: "Saveh", lat: 35.0213, lng: 50.3566, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "شاهرود", cityEn: "Shahrud", lat: 36.4182, lng: 54.9763, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بابل", cityEn: "Babol", lat: 36.5513, lng: 52.6789, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "آمل", cityEn: "Amol", lat: 36.4696, lng: 52.3507, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "قائم‌شهر", cityEn: "Qaem Shahr", lat: 36.4631, lng: 52.8603, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "گنبد کاووس", cityEn: "Gonbad-e Kavus", lat: 37.25, lng: 55.1672, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اسلام‌شهر", cityEn: "Eslamshahr", lat: 35.5446, lng: 51.23, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ورامین", cityEn: "Varamin", lat: 35.3242, lng: 51.6457, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "کازرون", cityEn: "Kazerun", lat: 29.6194, lng: 51.6542, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "جهرم", cityEn: "Jahrom", lat: 28.5, lng: 53.5606, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "لار", cityEn: "Lar", lat: 27.6833, lng: 54.3333, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "سیرجان", cityEn: "Sirjan", lat: 29.4514, lng: 55.6809, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "رفسنجان", cityEn: "Rafsanjan", lat: 30.4067, lng: 55.9939, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "جیرفت", cityEn: "Jiroft", lat: 28.6781, lng: 57.7406, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "ایرانشهر", cityEn: "Iranshahr", lat: 27.2025, lng: 60.6847, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "زابل", cityEn: "Zabol", lat: 31.0306, lng: 61.4947, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "چابهار", cityEn: "Chabahar", lat: 25.2919, lng: 60.643, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "بندر انزلی", cityEn: "Bandar Anzali", lat: 37.4724, lng: 49.4622, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "لاهیجان", cityEn: "Lahijan", lat: 37.2072, lng: 50.0039, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اسلام‌آباد غرب", cityEn: "Eslamabad-e Gharb", lat: 34.1097, lng: 46.5275, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "نهاوند", cityEn: "Nahavand", lat: 34.1883, lng: 48.3772, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "تویسرکان", cityEn: "Tuyserkan", lat: 34.5481, lng: 48.4478, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مکه", cityEn: "Makkah", lat: 21.4225, lng: 39.8262, country: "SA", countryName: "عربستان", tz: "Asia/Riyadh" },
    { city: "مدینه", cityEn: "Madinah", lat: 24.4672, lng: 39.6024, country: "SA", countryName: "عربستان", tz: "Asia/Riyadh" },
    { city: "استانبول", cityEn: "Istanbul", lat: 41.0082, lng: 28.9784, country: "TR", countryName: "ترکیه", tz: "Europe/Istanbul" },
    { city: "دبی", cityEn: "Dubai", lat: 25.2048, lng: 55.2708, country: "AE", countryName: "امارات", tz: "Asia/Dubai" },
    { city: "کابل", cityEn: "Kabul", lat: 34.5553, lng: 69.2075, country: "AF", countryName: "افغانستان", tz: "Asia/Kabul" },
    { city: "لندن", cityEn: "London", lat: 51.5074, lng: -0.1278, country: "GB", countryName: "بریتانیا", tz: "Europe/London" },
    { city: "پاریس", cityEn: "Paris", lat: 48.8566, lng: 2.3522, country: "FR", countryName: "فرانسه", tz: "Europe/Paris" },
    { city: "نیویورک", cityEn: "New York", lat: 40.7128, lng: -74.006, country: "US", countryName: "آمریکا", tz: "America/New_York" },
    { city: "قاهره", cityEn: "Cairo", lat: 30.0444, lng: 31.2357, country: "EG", countryName: "مصر", tz: "Africa/Cairo" },
    { city: "لاهور", cityEn: "Lahore", lat: 31.5204, lng: 74.3587, country: "PK", countryName: "پاکستان", tz: "Asia/Karachi" }
  ];

  function clampLat(lat) { return Math.max(-90, Math.min(90, Number(lat))); }
  function clampLng(lng) {
    let x = Number(lng);
    while (x > 180) x -= 360;
    while (x < -180) x += 360;
    return x;
  }

  function fromCoords(lat, lng, opts) {
    opts = opts || {};
    lat = clampLat(lat);
    lng = clampLng(lng);
    if (isNaN(lat) || isNaN(lng)) throw new Error("مختصات نامعتبر");

    const tz = opts.tz || detectTimezone(lat, lng);
    const nearest = findNearest(lat, lng, 50);

    return {
      lat, lng,
      exact: true,
      placeless: !nearest || nearest.distanceKm > 15,
      city: nearest && nearest.distanceKm <= 15 ? nearest.city : null,
      cityEn: nearest && nearest.distanceKm <= 15 ? nearest.cityEn : null,
      country: nearest ? nearest.country : null,
      countryName: nearest ? nearest.countryName : null,
      tz,
      source: opts.source || "manual",
      label: opts.label || null
    };
  }

  function detectTimezone(lat, lng) {
    try {
      if (typeof tzlookup === "function") return tzlookup(lat, lng);
      if (g.tzlookup) return g.tzlookup(lat, lng);
    } catch (e) {}
    const offsetHours = Math.round(lng / 15);
    const map = {
      3.5: "Asia/Tehran", 4: "Asia/Dubai", 5: "Asia/Karachi", 5.5: "Asia/Kolkata",
      8: "Asia/Shanghai", 9: "Asia/Tokyo", 0: "Europe/London", 1: "Europe/Paris",
      2: "Europe/Athens", 3: "Europe/Moscow", "-5": "America/New_York",
      "-8": "America/Los_Angeles", 10: "Australia/Sydney"
    };
    let best = "UTC", bestDiff = 99;
    Object.keys(map).forEach(k => {
      const d = Math.abs(Number(k) - offsetHours);
      if (d < bestDiff) { bestDiff = d; best = map[k]; }
    });
    return best;
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function allCities() {
    if (g.SE_WORLD && Array.isArray(g.SE_WORLD.cities)) return g.SE_WORLD.cities;
    return SAMPLE_CITIES.slice();
  }

  function findNearest(lat, lng, maxKm) {
    maxKm = maxKm == null ? 100 : maxKm;
    const cities = allCities();
    let best = null, bestD = Infinity;
    for (const c of cities) {
      const clat = c.lat != null ? c.lat : c[2];
      const clng = c.lng != null ? c.lng : c[3];
      if (clat == null || clng == null) continue;
      const d = haversineKm(lat, lng, clat, clng);
      if (d < bestD) {
        bestD = d;
        best = {
          city: c.city || c[0], cityEn: c.cityEn || c[1],
          lat: clat, lng: clng,
          country: c.country || null, countryName: c.countryName || null,
          tz: c.tz || detectTimezone(clat, clng),
          distanceKm: Math.round(d * 10) / 10
        };
      }
    }
    if (best && best.distanceKm <= maxKm) return best;
    return null;
  }

  function search(query, limit) {
    limit = limit || 15;
    const q = String(query || "").trim().toLowerCase();
    if (q.length < 1) return [];
    const cities = allCities();
    const results = [];
    for (const c of cities) {
      const nameFa = (c.city || c[0] || "").toLowerCase();
      const nameEn = (c.cityEn || c[1] || "").toLowerCase();
      if (nameFa.includes(q) || nameEn.includes(q)) {
        results.push({
          city: c.city || c[0], cityEn: c.cityEn || c[1],
          lat: c.lat != null ? c.lat : c[2],
          lng: c.lng != null ? c.lng : c[3],
          country: c.country || null, countryName: c.countryName || null,
          tz: c.tz || detectTimezone(c.lat != null ? c.lat : c[2], c.lng != null ? c.lng : c[3])
        });
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  function parseInput(text) {
    text = String(text || "").trim();
    const coordMatch = text.match(/^(-?\d+\.?\d*)\s*[,،\s]\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return fromCoords(parseFloat(coordMatch[1]), parseFloat(coordMatch[2]), { source: "manual" });
    }
    const found = search(text, 1);
    if (found.length) {
      const c = found[0];
      return {
        lat: c.lat, lng: c.lng, exact: false, placeless: false,
        city: c.city, cityEn: c.cityEn, country: c.country,
        countryName: c.countryName, tz: c.tz, source: "search"
      };
    }
    return null;
  }

  function timesFor(place, year, month, day, methodId) {
    if (!place || place.lat == null || place.lng == null) throw new Error("مکان مشخص نیست");
    const method = methodId || (SE.methods && SE.methods.getCurrentMethod ? SE.methods.getCurrentMethod() : "legacy");
    const tz = place.tz || detectTimezone(place.lat, place.lng);
    if (SE.methods && SE.methods.computeDay) {
      return SE.methods.computeDay(place.lat, place.lng, year, month, day, tz, method);
    }
    if (SE.sunLocal && SE.sunLocal.eventsForDay) {
      return SE.sunLocal.eventsForDay(place.lat, place.lng, year, month, day, tz);
    }
    throw new Error("موتور محاسبه در دسترس نیست");
  }

  function label(place, lang) {
    if (!place) return lang === "en" ? "Unknown" : "نامشخص";
    const isFa = lang !== "en";
    if (place.label) return place.label;
    if (place.city) {
      const name = isFa ? place.city : (place.cityEn || place.city);
      if (place.country && place.country !== "IR") {
        const cn = isFa ? (place.countryName || place.country) : place.country;
        return name + (isFa ? "، " : ", ") + cn;
      }
      return name;
    }
    return place.lat.toFixed(2) + ", " + place.lng.toFixed(2);
  }

  async function currentPosition() {
    if (SE.locate && SE.locate.gps) {
      const pos = await SE.locate.gps({ timeout: 15000 });
      return fromCoords(pos.lat, pos.lng, { source: "gps" });
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("GPS پشتیبانی نمی‌شود"));
      navigator.geolocation.getCurrentPosition(
        p => resolve(fromCoords(p.coords.latitude, p.coords.longitude, { source: "gps" })),
        e => reject(e),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  function defaultPlace() {
    return fromCoords(35.6892, 51.3890, { source: "default" });
  }

  SE.place = {
    fromCoords, parseInput, search, findNearest, detectTimezone,
    timesFor, label, currentPosition, defaultPlace, SAMPLE_CITIES, allCities
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.place;
})(typeof globalThis !== "undefined" ? globalThis : this);
