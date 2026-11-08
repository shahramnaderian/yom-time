(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const TOLERANCE = 2;
  const REQUEST_TIMEOUT = 8e3, DEADLINE = 25e3;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const mins = (s) => {
    if (!s) return null;
    const p = String(s).split(":");
    return +p[0] * 60 + +p[1];
  };
  function url(lat, lng, date, tzHours) {
    return `https://aa.usno.navy.mil/api/rstt/oneday?date=${date}&coords=${lat},${lng}&tz=${tzHours}`;
  }
  function parse(data) {
    const list = (data && (data.properties && data.properties.data || data.data) || {}).sundata || [];
    const get = (phen) => {
      const x = list.find((e) => e.phen === phen);
      return x ? x.time.slice(0, 5) : null;
    };
    return { civilBegin: get("Begin Civil Twilight"), sunrise: get("Rise"), solarNoon: get("Upper Transit"), sunset: get("Set") };
  }
  async function fetchDay(lat, lng, date, tz, opts) {
    const [y, m, d] = date.split("-").map(Number);
    const off = SE.sunLocal.tzOffsetMinutes(y, m, d, tz, lng) / 60;
    const key = `usno:${lat},${lng}:${tz}:${date}`;
    if (opts.cache) {
      const hit = await opts.cache.get(key);
      if (hit) return hit;
    }
    let last;
    for (let a = 0; a < 2; a++) {
      if (opts.signal && opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
      try {
        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT);
        if (opts.signal) opts.signal.addEventListener("abort", () => ac.abort(), { once: true });
        let res;
        try {
          res = await (opts.fetchImpl || g.fetch.bind(g))(url(lat, lng, date, off), { signal: ac.signal });
        } finally {
          clearTimeout(timer);
        }
        if (!res.ok) throw new Error("HTTP " + res.status);
        const v = parse(await res.json());
        if (!v.sunrise && !v.sunset && !v.solarNoon) throw new Error("empty");
        if (opts.cache) await opts.cache.set(key, v);
        return v;
      } catch (e) {
        if (opts.signal && opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
        last = e;
        if (a === 0) await sleep(600);
      }
    }
    throw last || new Error("USNO failed");
  }
  function diff(a, b) {
    if (a == null || b == null) return null;
    return Math.abs(mins(a) - mins(b));
  }
  function compare(local, usno) {
    const keys = ["civilBegin", "sunrise", "solarNoon", "sunset"];
    const out = {};
    let max = 0;
    for (const k of keys) {
      const d = diff(local[k], usno[k]);
      out[k] = d;
      if (d != null && d > max) max = d;
    }
    out.ok = max <= TOLERANCE;
    out.maxDiff = max;
    return out;
  }
  SE.usnoCheck = { fetchDay, compare, TOLERANCE };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.usnoCheck;
})(typeof globalThis !== "undefined" ? globalThis : this);
