(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const DEFAULT_TZ = "Asia/Tehran";
  const fmtCache = /* @__PURE__ */ new Map();
  function formatter(tz) {
    if (!fmtCache.has(tz)) {
      fmtCache.set(tz, new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }));
    }
    return fmtCache.get(tz);
  }
  function utcToLocal(isoString, tz) {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) throw new Error("Bad time value from API: " + isoString);
    if (d.getUTCFullYear() < 1990) return null;
    let parts;
    try {
      parts = formatter(tz || DEFAULT_TZ).formatToParts(d);
    } catch (e) {
      parts = formatter(DEFAULT_TZ).formatToParts(d);
    }
    const h = parts.find((p) => p.type === "hour").value;
    const m = parts.find((p) => p.type === "minute").value;
    return (h === "24" ? "00" : h) + ":" + m;
  }
  const utcToIrst = (iso) => utcToLocal(iso, DEFAULT_TZ);
  function dayUrl(lat, lng, date) {
    return `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lng}&date=${date}&formatted=0`;
  }
  function parseResults(data, tz) {
    const r = data.results;
    return {
      nauticalBegin: utcToLocal(r.nautical_twilight_begin, tz),
      civilBegin: utcToLocal(r.civil_twilight_begin, tz),
      sunrise: utcToLocal(r.sunrise, tz),
      solarNoon: utcToLocal(r.solar_noon, tz),
      sunset: utcToLocal(r.sunset, tz),
      nauticalEnd: utcToLocal(r.nautical_twilight_end, tz)
    };
  }
  async function fetchDay(lat, lng, date, opts) {
    opts = opts || {};
    const tz = opts.tz || DEFAULT_TZ;
    const fetchImpl = opts.fetchImpl || g.fetch.bind(g);
    const cache = opts.cache;
    const retries = opts.retries == null ? 4 : opts.retries;
    const key = `sun2:${lat},${lng}:${tz}:${date}`;
    if (cache) {
      const hit = await cache.get(key);
      if (hit) return { events: hit, cached: true };
    }
    let lastErr;
    for (let attempt = 0; attempt < retries; attempt++) {
      if (opts.signal && opts.signal.aborted) throw new DOMException("Aborted", "AbortError");
      try {
        const res = await fetchImpl(dayUrl(lat, lng, date), { signal: opts.signal });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (data.status !== "OK") throw new Error("API status: " + data.status);
        const events = parseResults(data, tz);
        if (cache) await cache.set(key, events);
        return { events, cached: false };
      } catch (e) {
        if (e && e.name === "AbortError") throw e;
        lastErr = e;
        if (attempt < retries - 1) await sleep((opts.retryDelay == null ? 800 : opts.retryDelay) * Math.pow(2, attempt));
      }
    }
    const err = new Error(`Failed to fetch data for ${date}: ${lastErr && lastErr.message}`);
    err.code = "FETCH_FAILED";
    err.date = date;
    throw err;
  }
  async function fetchMonth(lat, lng, dates, opts) {
    opts = opts || {};
    const total = dates.length;
    const results = new Array(total);
    const concurrency = opts.concurrency || 3;
    const gap = opts.requestGap == null ? 120 : opts.requestGap;
    let next = 0, done = 0, failure = null;
    async function worker() {
      while (!failure) {
        const i = next++;
        if (i >= total) return;
        try {
          const { events, cached } = await fetchDay(lat, lng, dates[i], opts);
          results[i] = events;
          done++;
          if (opts.onProgress) opts.onProgress(done, total);
          if (!cached && gap) await sleep(gap);
        } catch (e) {
          failure = failure || e;
          return;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, worker));
    if (failure) throw failure;
    return results;
  }
  SE.solarApi = { utcToIrst, utcToLocal, fetchDay, fetchMonth, dayUrl, parseResults };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.solarApi;
})(typeof globalThis !== "undefined" ? globalThis : this);
