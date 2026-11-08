(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const KEY = "yom-time-prefs";
  function get(key, def) {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return def;
      const data = JSON.parse(raw);
      return data[key] !== undefined ? data[key] : def;
    } catch (e) {
      return def;
    }
  }
  function set(key, value) {
    try {
      const raw = localStorage.getItem(KEY);
      const data = raw ? JSON.parse(raw) : {};
      data[key] = value;
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {}
  }
  SE.store = {
    prefs: { get, set }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.store;
})(typeof globalThis !== "undefined" ? globalThis : this);
