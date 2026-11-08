(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  async function gps(opts) {
    opts = opts || {};
    const timeout = opts.timeout || 12000;
    if (SE.platform && SE.platform.isNative()) {
      const geo = SE.native.plugin("Geolocation");
      if (geo) {
        const r = await geo.getCurrentPosition({ enableHighAccuracy: true, timeout });
        return { lat: r.coords.latitude, lng: r.coords.longitude, accuracy: r.coords.accuracy, source: "gps" };
      }
    }
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("no geolocation"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, source: "gps" }),
        (e) => reject(e),
        { enableHighAccuracy: true, timeout, maximumAge: 6e4 }
      );
    });
  }
  async function ip() {
    try {
      const r = await fetch("https://ipapi.co/json/");
      const j = await r.json();
      if (j.latitude && j.longitude) return { lat: j.latitude, lng: j.longitude, city: j.city, country: j.country_code, source: "ip" };
    } catch (e) {}
    try {
      const r = await fetch("https://ipinfo.io/json");
      const j = await r.json();
      if (j.loc) {
        const [lat, lng] = j.loc.split(",").map(Number);
        return { lat, lng, city: j.city, country: j.country, source: "ip" };
      }
    } catch (e) {}
    throw new Error("ip locate failed");
  }
  SE.locate = { gps, ip };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.locate;
})(typeof globalThis !== "undefined" ? globalThis : this);
