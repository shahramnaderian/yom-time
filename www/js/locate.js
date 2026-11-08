(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const cap = () => g.Capacitor;
  const native = () => {
    try {
      return !!(cap() && cap().isNativePlatform && cap().isNativePlatform());
    } catch (e) {
      return false;
    }
  };
  let GEO = null;
  const plugin = () => GEO = GEO || SE.native.plugin("Geolocation");
  const err = (code, msg) => Object.assign(new Error(msg || code), { code });
  async function permission() {
    try {
      if (native() && plugin()) {
        const r = await plugin().checkPermissions();
        const v = r.location === "granted" || r.coarseLocation === "granted" ? "granted" : r.location;
        return v === "denied" ? "denied" : v === "granted" ? "granted" : "prompt";
      }
      if (navigator.permissions && navigator.permissions.query) return (await navigator.permissions.query({ name: "geolocation" })).state;
    } catch (e) {}
    return "unknown";
  }
  function browserPosition(timeout) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(err("UNSUPPORTED"));
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
        (e) => reject(err(e && e.code === 1 ? "DENIED" : e && e.code === 3 ? "TIMEOUT" : "UNAVAILABLE", e && e.message)),
        { enableHighAccuracy: false, timeout, maximumAge: 10 * 60 * 1e3 }
      );
    });
  }
  const online = () => !(g.navigator && g.navigator.onLine === false);
  function firstSuccess(list) {
    return new Promise((resolve, reject) => {
      let left = list.length;
      const errors = [];
      list.forEach((p) => p.then(resolve, (e) => {
        errors.push(e);
        if (--left === 0) reject(errors);
      }));
    });
  }
  const classify = (errors) => {
    const text = errors.map((e) => String(e && e.message || e)).join(" | ");
    if (/not enabled|disabled|services|turn on|location is off|GPS is off/i.test(text)) return "GPS_OFF";
    if (/denied|permission/i.test(text)) return "DENIED";
    if (/time/i.test(text)) return "TIMEOUT";
    return "UNAVAILABLE";
  };
  async function gps(ask, timeout) {
    timeout = timeout || (online() ? 15e3 : 4e4);
    if (native() && plugin()) {
      let st = await permission();
      if (st !== "granted") {
        if (!ask) throw err("NO_PERMISSION");
        const r = await plugin().requestPermissions({ permissions: ["location", "coarseLocation"] });
        if (r.location !== "granted" && r.coarseLocation !== "granted") throw err("DENIED");
      }
      const one = (o) => Promise.resolve(plugin().getCurrentPosition(o)).then((p) => ({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }));
      const attempts = [one({ enableHighAccuracy: true, timeout, maximumAge: 10 * 60 * 1e3 })];
      if (online()) attempts.push(one({ enableHighAccuracy: false, timeout: 8e3, maximumAge: 10 * 60 * 1e3 }));
      try {
        return await firstSuccess(attempts);
      } catch (errors) {
        throw err(classify(errors), errors.map((e) => e && e.message).join(" | "));
      }
    }
    if (!ask && await permission() !== "granted") throw err("NO_PERMISSION");
    return browserPosition(timeout);
  }
  async function byIp(opts) {
    opts = opts || {};
    const f = opts.fetchImpl || g.fetch.bind(g);
    const tries = [
      ["https://get.geojs.io/v1/ip/geo.json", (j) => ({ lat: parseFloat(j.latitude), lng: parseFloat(j.longitude) })],
      ["https://ipwho.is/", (j) => ({ lat: Number(j.latitude), lng: Number(j.longitude) })],
      ["https://ipapi.co/json/", (j) => ({ lat: Number(j.latitude), lng: Number(j.longitude) })]
    ];
    for (const [url, pick] of tries) {
      try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), opts.timeout || 6e3);
        const res = await f(url, { signal: ac.signal });
        clearTimeout(t);
        if (!res.ok) continue;
        const p = pick(await res.json());
        if (Number.isFinite(p.lat) && Number.isFinite(p.lng) && (p.lat || p.lng)) return { lat: p.lat, lng: p.lng, accuracy: 25e3 };
      } catch (e) {}
    }
    throw err("OFFLINE");
  }
  async function locate(opts) {
    opts = opts || {};
    const say = (x) => { try { if (opts.onStatus) opts.onStatus(x); } catch (e) {} };
    let gpsErr = null;
    say("gps");
    try {
      const p = await gps(!!opts.ask, opts.timeout);
      return Object.assign(p, { source: "gps" });
    } catch (e) {
      gpsErr = e;
    }
    if (opts.ipFallback !== false && online()) {
      say("ip");
      try {
        const p = await byIp(opts);
        return Object.assign(p, { source: "ip", gpsError: gpsErr && gpsErr.code });
      } catch (e) {}
    }
    throw gpsErr || err("UNAVAILABLE");
  }
  SE.locate = { locate, gps, byIp, permission, native };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.locate;
})(typeof globalThis !== "undefined" ? globalThis : this);
