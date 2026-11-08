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
  const plugin = () => {
    if (!GEO) GEO = SE.native && SE.native.plugin ? SE.native.plugin("Geolocation") : null;
    return GEO;
  };

  const err = (code, msg) => Object.assign(new Error(msg || code), { code });

  function precise(n, digits) {
    digits = digits == null ? 6 : digits;
    const x = Number(n);
    if (!Number.isFinite(x)) return null;
    const f = Math.pow(10, digits);
    return Math.round(x * f) / f;
  }

  function normalizeCoords(p) {
    const lat = precise(p.lat != null ? p.lat : p.latitude, 6);
    const lng = precise(p.lng != null ? p.lng : p.longitude, 6);
    if (lat == null || lng == null) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return {
      lat,
      lng,
      accuracy: p.accuracy != null ? Math.round(Number(p.accuracy)) : null,
      altitude: p.altitude != null && Number.isFinite(Number(p.altitude)) ? precise(p.altitude, 1) : null,
      altitudeAccuracy: p.altitudeAccuracy != null ? Math.round(Number(p.altitudeAccuracy)) : null,
      heading: p.heading != null && Number.isFinite(Number(p.heading)) ? precise(p.heading, 1) : null,
      speed: p.speed != null && Number.isFinite(Number(p.speed)) ? precise(p.speed, 2) : null,
      timestamp: p.timestamp || Date.now()
    };
  }

  async function permission() {
    try {
      if (native() && plugin()) {
        const r = await plugin().checkPermissions();
        const v = r.location === "granted" || r.coarseLocation === "granted" ? "granted" : r.location;
        return v === "denied" ? "denied" : v === "granted" ? "granted" : "prompt";
      }
      if (navigator.permissions && navigator.permissions.query) {
        return (await navigator.permissions.query({ name: "geolocation" })).state;
      }
    } catch (e) {}
    return "unknown";
  }

  function browserPosition(opts) {
    opts = opts || {};
    const timeout = opts.timeout || 20000;
    const high = opts.enableHighAccuracy !== false;
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(err("UNSUPPORTED"));
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const c = normalizeCoords({
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracy: p.coords.accuracy,
            altitude: p.coords.altitude,
            altitudeAccuracy: p.coords.altitudeAccuracy,
            heading: p.coords.heading,
            speed: p.coords.speed,
            timestamp: p.timestamp
          });
          if (!c) return reject(err("INVALID_COORDS"));
          resolve(c);
        },
        (e) => reject(err(
          e && e.code === 1 ? "DENIED" : e && e.code === 3 ? "TIMEOUT" : "UNAVAILABLE",
          e && e.message
        )),
        {
          enableHighAccuracy: high,
          timeout,
          maximumAge: opts.maximumAge != null ? opts.maximumAge : (high ? 0 : 60000)
        }
      );
    });
  }

  const online = () => !(g.navigator && g.navigator.onLine === false);

  function firstSuccess(list) {
    return new Promise((resolve, reject) => {
      let left = list.length;
      const errors = [];
      if (!left) return reject([err("EMPTY")]);
      list.forEach((p) => p.then(resolve, (e) => {
        errors.push(e);
        if (--left === 0) reject(errors);
      }));
    });
  }

  const classify = (errors) => {
    const text = (Array.isArray(errors) ? errors : [errors])
      .map((e) => String(e && e.message || e && e.code || e)).join(" | ");
    if (/not enabled|disabled|services|turn on|location is off|GPS is off/i.test(text)) return "GPS_OFF";
    if (/denied|permission/i.test(text)) return "DENIED";
    if (/time/i.test(text)) return "TIMEOUT";
    return "UNAVAILABLE";
  };

  async function gps(ask, timeout) {
    timeout = timeout || (online() ? 25000 : 45000);

    if (native() && plugin()) {
      let st = await permission();
      if (st !== "granted") {
        if (!ask) throw err("NO_PERMISSION");
        const r = await plugin().requestPermissions({ permissions: ["location", "coarseLocation"] });
        if (r.location !== "granted" && r.coarseLocation !== "granted") throw err("DENIED");
      }

      const one = (o) => Promise.resolve(plugin().getCurrentPosition(o)).then((p) => {
        const c = normalizeCoords({
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          altitude: p.coords.altitude,
          altitudeAccuracy: p.coords.altitudeAccuracy,
          heading: p.coords.heading,
          speed: p.coords.speed,
          timestamp: p.timestamp || Date.now()
        });
        if (!c) throw err("INVALID_COORDS");
        return c;
      });

      const attempts = [
        one({ enableHighAccuracy: true, timeout, maximumAge: 0 }),
        one({ enableHighAccuracy: true, timeout: Math.min(timeout, 12000), maximumAge: 30000 })
      ];
      if (online()) attempts.push(one({ enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }));

      try {
        return await firstSuccess(attempts);
      } catch (errors) {
        throw err(classify(errors), (Array.isArray(errors) ? errors : [errors]).map((e) => e && e.message).join(" | "));
      }
    }

    if (!ask) {
      const st = await permission();
      if (st !== "granted") throw err("NO_PERMISSION");
    }

    try {
      return await browserPosition({ enableHighAccuracy: true, timeout, maximumAge: 0 });
    } catch (e1) {
      try {
        return await browserPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      } catch (e2) {
        throw e1;
      }
    }
  }

  async function byIp(opts) {
    opts = opts || {};
    const f = opts.fetchImpl || g.fetch.bind(g);
    const tries = [
      ["https://get.geojs.io/v1/ip/geo.json", (j) => ({ lat: parseFloat(j.latitude), lng: parseFloat(j.longitude), city: j.city, country: j.country_code, accuracy: 25000 })],
      ["https://ipwho.is/", (j) => ({ lat: Number(j.latitude), lng: Number(j.longitude), city: j.city, country: j.country_code, accuracy: 25000 })],
      ["https://ipapi.co/json/", (j) => ({ lat: Number(j.latitude), lng: Number(j.longitude), city: j.city, country: j.country_code, accuracy: 25000 })]
    ];
    for (const [url, pick] of tries) {
      try {
        const ac = new AbortController();
        const t = setTimeout(() => ac.abort(), opts.timeout || 6000);
        const res = await f(url, { signal: ac.signal });
        clearTimeout(t);
        if (!res.ok) continue;
        const raw = pick(await res.json());
        const c = normalizeCoords(raw);
        if (c) {
          c.accuracy = raw.accuracy || 25000;
          c.city = raw.city || null;
          c.country = raw.country || null;
          return c;
        }
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

  async function preciseFix(opts) {
    opts = opts || {};
    const samples = opts.samples || 3;
    const intervalMs = opts.intervalMs || 1500;
    const results = [];
    for (let i = 0; i < samples; i++) {
      try {
        const p = await gps(i === 0 && opts.ask, opts.timeout || 20000);
        if (p && p.source !== "ip") results.push(Object.assign(p, { source: "gps" }));
        else if (p) results.push(p);
      } catch (e) {
        if (i === 0 && !results.length) {
          // continue to try more or fall through
        }
      }
      if (i < samples - 1) await new Promise((r) => setTimeout(r, intervalMs));
    }
    if (!results.length) {
      const one = await locate(opts);
      return one;
    }
    let wLat = 0, wLng = 0, wSum = 0, bestAcc = Infinity, altSum = 0, altN = 0;
    results.forEach((r) => {
      const w = r.accuracy && r.accuracy > 0 ? 1 / r.accuracy : 1;
      wLat += r.lat * w;
      wLng += r.lng * w;
      wSum += w;
      if (r.accuracy != null && r.accuracy < bestAcc) bestAcc = r.accuracy;
      if (r.altitude != null) { altSum += r.altitude; altN++; }
    });
    const avg = normalizeCoords({
      lat: wLat / wSum,
      lng: wLng / wSum,
      accuracy: bestAcc < Infinity ? bestAcc : null,
      altitude: altN ? altSum / altN : null,
      timestamp: Date.now()
    });
    return Object.assign(avg || results[0], { source: "gps", samples: results.length });
  }

  function formatCoords(lat, lng, digits) {
    digits = digits == null ? 5 : digits;
    const la = precise(lat, digits);
    const ln = precise(lng, digits);
    if (la == null || ln == null) return "";
    return la.toFixed(digits) + ", " + ln.toFixed(digits);
  }

  function accuracyLabel(meters, lang) {
    if (meters == null) return lang === "en" ? "unknown" : "نامشخص";
    if (meters < 20) return lang === "en" ? "excellent (±" + Math.round(meters) + " m)" : "عالی (±" + Math.round(meters) + " م)";
    if (meters < 50) return lang === "en" ? "good (±" + Math.round(meters) + " m)" : "خوب (±" + Math.round(meters) + " م)";
    if (meters < 200) return lang === "en" ? "fair (±" + Math.round(meters) + " m)" : "متوسط (±" + Math.round(meters) + " م)";
    return lang === "en" ? "approximate (±" + Math.round(meters / 100) / 10 + " km)" : "تقریبی (±" + Math.round(meters / 100) / 10 + " کم)";
  }

  SE.locate = {
    locate, gps, byIp, permission, native,
    preciseFix, precise, formatCoords, accuracyLabel, normalizeCoords
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.locate;
})(typeof globalThis !== "undefined" ? globalThis : this);
