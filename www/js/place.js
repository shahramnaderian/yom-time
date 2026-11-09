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
    { city: "تهران", cityEn: "Tehran", lat: 35.6892, lng: 51.3890, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مشهد", cityEn: "Mashhad", lat: 36.2605, lng: 59.6168, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "اصفهان", cityEn: "Isfahan", lat: 32.6546, lng: 51.6680, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "شیراز", cityEn: "Shiraz", lat: 29.5918, lng: 52.5837, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "تبریز", cityEn: "Tabriz", lat: 38.0962, lng: 46.2738, country: "IR", countryName: "ایران", tz: "Asia/Tehran" },
    { city: "مکه", cityEn: "Makkah", lat: 21.4225, lng: 39.8262, country: "SA", countryName: "عربستان", tz: "Asia/Riyadh" },
    { city: "مدینه", cityEn: "Madinah", lat: 24.4672, lng: 39.6024, country: "SA", countryName: "عربستان", tz: "Asia/Riyadh" },
    { city: "استانبول", cityEn: "Istanbul", lat: 41.0082, lng: 28.9784, country: "TR", countryName: "ترکیه", tz: "Europe/Istanbul" },
    { city: "دبی", cityEn: "Dubai", lat: 25.2048, lng: 55.2708, country: "AE", countryName: "امارات", tz: "Asia/Dubai" },
    { city: "کابل", cityEn: "Kabul", lat: 34.5553, lng: 69.2075, country: "AF", countryName: "افغانستان", tz: "Asia/Kabul" },
    { city: "لندن", cityEn: "London", lat: 51.5074, lng: -0.1278, country: "GB", countryName: "بریتانیا", tz: "Europe/London" },
    { city: "پاریس", cityEn: "Paris", lat: 48.8566, lng: 2.3522, country: "FR", countryName: "فرانسه", tz: "Europe/Paris" },
    { city: "نیویورک", cityEn: "New York", lat: 40.7128, lng: -74.0060, country: "US", countryName: "آمریکا", tz: "America/New_York" },
    { city: "لس‌آنجلس", cityEn: "Los Angeles", lat: 34.0522, lng: -118.2437, country: "US", countryName: "آمریکا", tz: "America/Los_Angeles" },
    { city: "تورنتو", cityEn: "Toronto", lat: 43.6532, lng: -79.3832, country: "CA", countryName: "کانادا", tz: "America/Toronto" },
    { city: "سیدنی", cityEn: "Sydney", lat: -33.8688, lng: 151.2093, country: "AU", countryName: "استرالیا", tz: "Australia/Sydney" },
    { city: "توکیو", cityEn: "Tokyo", lat: 35.6762, lng: 139.6503, country: "JP", countryName: "ژاپن", tz: "Asia/Tokyo" },
    { city: "کوالالامپور", cityEn: "Kuala Lumpur", lat: 3.1390, lng: 101.6869, country: "MY", countryName: "مالزی", tz: "Asia/Kuala_Lumpur" },
    { city: "جاکارتا", cityEn: "Jakarta", lat: -6.2088, lng: 106.8456, country: "ID", countryName: "اندونزی", tz: "Asia/Jakarta" },
    { city: "قاهره", cityEn: "Cairo", lat: 30.0444, lng: 31.2357, country: "EG", countryName: "مصر", tz: "Africa/Cairo" },
    { city: "لاهور", cityEn: "Lahore", lat: 31.5204, lng: 74.3587, country: "PK", countryName: "پاکستان", tz: "Asia/Karachi" },
    { city: "کراچی", cityEn: "Karachi", lat: 24.8607, lng: 67.0011, country: "PK", countryName: "پاکستان", tz: "Asia/Karachi" },
    { city: "دهلی", cityEn: "Delhi", lat: 28.7041, lng: 77.1025, country: "IN", countryName: "هند", tz: "Asia/Kolkata" },
    { city: "مسکو", cityEn: "Moscow", lat: 55.7558, lng: 37.6173, country: "RU", countryName: "روسیه", tz: "Europe/Moscow" },
    { city: "برلین", cityEn: "Berlin", lat: 52.5200, lng: 13.4050, country: "DE", countryName: "آلمان", tz: "Europe/Berlin" }
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
    // SAMPLE_CITIES is the canonical local index; the helper module reads from it.
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
    const method = methodId || (SE.methods && SE.methods.getCurrentMethod ? SE.methods.getCurrentMethod() : "tehran");
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
