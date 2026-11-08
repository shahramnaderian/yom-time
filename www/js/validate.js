(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  /**
   * اعتبارسنجی اوقات برای هر مختصات جغرافیایی
   * - مقایسه محاسبه محلی با USNO و sunrise-sunset.org
   * - نمایش تفاوت به دقیقه
   * - پشتیبانی از شماره روز (جلالی یا میلادی)
   */

  const TOLERANCE_MIN = 2; // اختلاف قابل قبول (دقیقه)

  function mins(s) {
    if (!s || s === "—" || s === null) return null;
    const p = String(s).split(":");
    if (p.length < 2) return null;
    const h = +p[0], m = +p[1];
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  }

  function diffMin(a, b) {
    const ma = mins(a), mb = mins(b);
    if (ma == null || mb == null) return null;
    return Math.abs(ma - mb);
  }

  function formatDiff(d) {
    if (d == null) return "—";
    if (d === 0) return "۰";
    return d <= TOLERANCE_MIN ? `±${d}` : `⚠ ${d}`;
  }

  /**
   * اعتبارسنجی یک روز برای مختصات دلخواه
   * @param {number} lat
   * @param {number} lng
   * @param {string} dateStr - YYYY-MM-DD (میلادی)
   * @param {string} tz - مثل Asia/Tehran
   * @param {object} opts - { cache, signal, dayNumber, cal }
   */
  async function validateDay(lat, lng, dateStr, tz, opts) {
    opts = opts || {};
    const result = {
      lat, lng, date: dateStr, tz,
      dayNumber: opts.dayNumber != null ? opts.dayNumber : null,
      cal: opts.cal || "g",
      local: null,
      usno: null,
      api: null,
      diffs: {},
      ok: false,
      maxDiff: null,
      warnings: []
    };

    // ۱. محاسبه محلی
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      if (SE.sunLocal && SE.sunLocal.eventsForDay) {
        result.local = SE.sunLocal.eventsForDay(lat, lng, y, m, d, tz || "Asia/Tehran");
      }
    } catch (e) {
      result.warnings.push({ source: "local", message: e.message });
    }

    // ۲. USNO
    try {
      if (SE.usnoCheck && SE.usnoCheck.fetchDay) {
        result.usno = await SE.usnoCheck.fetchDay(lat, lng, dateStr, tz || "Asia/Tehran", {
          cache: opts.cache,
          signal: opts.signal
        });
      }
    } catch (e) {
      result.warnings.push({ source: "usno", message: e.message || "USNO unavailable" });
    }

    // ۳. sunrise-sunset.org
    try {
      if (SE.solarApi && SE.solarApi.fetchDay) {
        const r = await SE.solarApi.fetchDay(lat, lng, dateStr, {
          tz: tz || "Asia/Tehran",
          cache: opts.cache,
          signal: opts.signal
        });
        result.api = r.events;
      }
    } catch (e) {
      result.warnings.push({ source: "api", message: e.message });
    }

    // ۴. مقایسه
    const keys = ["civilBegin", "sunrise", "solarNoon", "sunset", "nauticalBegin", "nauticalEnd"];
    let maxDiff = 0;
    let hasCompare = false;

    keys.forEach(k => {
      const localV = result.local && result.local[k];
      const usnoV = result.usno && result.usno[k];
      const apiV = result.api && result.api[k];

      const dUsno = diffMin(localV, usnoV);
      const dApi = diffMin(localV, apiV);

      result.diffs[k] = {
        local: localV || null,
        usno: usnoV || null,
        api: apiV || null,
        vsUsno: dUsno,
        vsApi: dApi,
        labelUsno: formatDiff(dUsno),
        labelApi: formatDiff(dApi)
      };

      if (dUsno != null) { hasCompare = true; if (dUsno > maxDiff) maxDiff = dUsno; }
      if (dApi != null) { hasCompare = true; if (dApi > maxDiff) maxDiff = dApi; }
    });

    result.maxDiff = hasCompare ? maxDiff : null;
    result.ok = hasCompare ? maxDiff <= TOLERANCE_MIN : false;

    return result;
  }

  async function validateMonth(lat, lng, dates, tz, opts) {
    opts = opts || {};
    const results = [];
    const concurrency = opts.concurrency || 2;
    let next = 0;
    let failure = null;

    async function worker() {
      while (!failure && next < dates.length) {
        const i = next++;
        const dateStr = dates[i];
        try {
          const r = await validateDay(lat, lng, dateStr, tz, {
            ...opts,
            dayNumber: opts.dayNumbers ? opts.dayNumbers[i] : (i + 1)
          });
          results[i] = r;
          if (opts.onProgress) opts.onProgress(i + 1, dates.length, r);
        } catch (e) {
          failure = e;
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, dates.length) }, worker));
    if (failure) throw failure;

    return {
      total: results.length,
      ok: results.filter(r => r && r.ok).length,
      maxDiff: Math.max(0, ...results.map(r => r && r.maxDiff != null ? r.maxDiff : 0)),
      results
    };
  }

  function summaryText(result, lang) {
    const isFa = lang !== "en";
    if (!result) return isFa ? "نتیجه‌ای نیست" : "No result";

    const dayPart = result.dayNumber != null
      ? (isFa ? `روز ${result.dayNumber}` : `Day ${result.dayNumber}`)
      : result.date;

    if (result.maxDiff == null) {
      return isFa
        ? `${dayPart}: امکان مقایسه نبود`
        : `${dayPart}: comparison unavailable`;
    }

    if (result.ok) {
      return isFa
        ? `${dayPart}: معتبر (اختلاف حداکثر ${result.maxDiff} دقیقه)`
        : `${dayPart}: OK (max diff ${result.maxDiff} min)`;
    }

    return isFa
      ? `${dayPart}: اختلاف بیش از حد (حداکثر ${result.maxDiff} دقیقه)`
      : `${dayPart}: large difference (max ${result.maxDiff} min)`;
  }

  function dayNumberOf(rowOrDate) {
    if (Array.isArray(rowOrDate)) return rowOrDate[0];
    if (typeof rowOrDate === "number") return rowOrDate;
    return null;
  }

  SE.validate = {
    TOLERANCE_MIN,
    validateDay,
    validateMonth,
    summaryText,
    dayNumberOf,
    diffMin,
    formatDiff
  };

  if (typeof module !== "undefined" && module.exports) module.exports = SE.validate;
})(typeof globalThis !== "undefined" ? globalThis : this);
