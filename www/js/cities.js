(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  function list() {
    if (SE.place && SE.place.allCities) {
      return SE.place.allCities().map((c) => ({
        name: c.city || c[0], en: c.cityEn || c[1],
        lat: c.lat != null ? c.lat : c[2], lng: c.lng != null ? c.lng : c[3],
        country: c.country || "", countryName: c.countryName || "",
        tz: c.tz || "Asia/Tehran"
      }));
    }
    return [];
  }
  function search(text, limit) {
    if (SE.place && SE.place.search) {
      return SE.place.search(text, limit || 15).map((c) => ({
        name: c.city, en: c.cityEn, lat: c.lat, lng: c.lng,
        country: c.country, countryName: c.countryName, tz: c.tz
      }));
    }
    return [];
  }
  function parseCoords(text) {
    const m = String(text || "").trim().match(/^(-?\d+\.?\d*)\s*[,،\s]\s*(-?\d+\.?\d*)$/);
    if (!m) return null;
    return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  }
  function kmBetween(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function nearby(lat, lng, limit) {
    return list().map((c) => Object.assign({}, c, { dist: kmBetween(lat, lng, c.lat, c.lng) }))
      .sort((a, b) => a.dist - b.dist).slice(0, limit || 20);
  }
  function nearest(lat, lng) { return nearby(lat, lng, 1)[0] || null; }
  function nearPlace(lat, lng) { return nearest(lat, lng); }
  function exactEntry(base, lat, lng, extra) {
    return Object.assign({}, base || {}, { lat, lng, exact: true, tz: (extra && extra.tz) || (base && base.tz) || "Asia/Tehran" }, extra || {});
  }
  function flag() { return ""; }
  SE.cities = { list, search, parseCoords, nearby, nearest, nearPlace, exactEntry, kmBetween, flag };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.cities;
})(typeof globalThis !== "undefined" ? globalThis : this);
