(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const cap = () => g.Capacitor;
  function isNative() {
    try {
      return !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
    } catch (e) {
      return false;
    }
  }
  const cache = {};
  function plugin(name) {
    if (!isNative()) return null;
    if (cache[name]) return cache[name];
    const c = cap();
    let p = null;
    try {
      if (c.Plugins && c.Plugins[name]) p = c.Plugins[name];
    } catch (e) {
      p = null;
    }
    if (!p) {
      try {
        if (typeof c.registerPlugin === "function") p = c.registerPlugin(name);
      } catch (e) {
        p = null;
      }
    }
    if (p) cache[name] = p;
    return p;
  }
  function list() {
    try {
      const c = cap();
      const n = new Set(Object.keys(c.Plugins || {}));
      (c.PluginHeaders || []).forEach((h) => n.add(h.name));
      return [...n];
    } catch (e) {
      return [];
    }
  }
  SE.native = { isNative, plugin, list };
})(typeof globalThis !== "undefined" ? globalThis : this);
