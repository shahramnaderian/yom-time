(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  function plugin(name) {
    try {
      const Cap = g.Capacitor;
      if (!Cap || !Cap.Plugins) return null;
      return Cap.Plugins[name] || null;
    } catch (e) {
      return null;
    }
  }
  SE.native = { plugin };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.native;
})(typeof globalThis !== "undefined" ? globalThis : this);
