(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const live = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let running = null;
  const emit = (type, rec) => listeners.forEach((fn) => {
    try { fn(type, rec); } catch (e) {}
  });
  const statusOf = (r) => r.status || "done";
  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function on(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  async function enqueue(spec) {
    const c = spec.city;
    const rec = {
      id: newId(),
      createdAt: Date.now(),
      status: "queued",
      city: c.name,
      cityEn: c.en || c.name,
      country: c.country || "",
      countryName: c.countryName || "",
      lat: c.lat,
      lng: c.lng,
      exact: !!c.exact,
      manual: !!c.custom,
      placeEn: c.placeEn || c.en || c.name,
      placeless: !!c.placeless,
      lang: spec.lang === "en" ? "en" : "fa",
      cal: spec.cal === "g" ? "g" : "j",
      tz: c.tz || "Asia/Tehran",
      year: spec.year,
      month: spec.month,
      formats: spec.formats.slice(),
      source: spec.source || "local",
      validate: spec.validate !== false,
      rows: null,
      warnings: [],
      files: {},
      progress: { done: 0, total: 0 }
    };
    await SE.store.putRecord(rec);
    live.set(rec.id, rec);
    emit("added", rec);
    pump();
    return rec;
  }
  function pump() {
    if (running) return;
    const next = [...live.values()].filter((r) => r.status === "queued").sort((a, b) => a.createdAt - b.createdAt)[0];
    if (next) process(next);
  }
  async function process(rec) {
    running = rec.id;
    const ac = new AbortController();
    rec._abort = ac;
    try {
      const dates = SE.jalali.monthDates(rec.cal || "j", rec.year, rec.month);
      rec.status = "running";
      rec.error = null;
      rec.progress = { done: 0, total: dates.length };
      await SE.store.putRecord(strip(rec));
      emit("update", rec);
      let events;
      if (rec.source === "api") {
        events = await SE.solarApi.fetchMonth(rec.lat, rec.lng, dates, {
          tz: rec.tz,
          cache: SE.store.cache,
          signal: ac.signal,
          onProgress: (d, t) => {
            rec.progress = { done: d, total: t };
            emit("progress", rec);
          }
        });
      } else {
        events = SE.sunLocal.monthEvents(rec.lat, rec.lng, dates, rec.tz);
        rec.progress = { done: dates.length, total: dates.length };
        emit("progress", rec);
      }
      rec.validation = null;
      if (rec.validate && SE.usnoCheck) {
        try {
          rec.validation = await SE.usnoCheck.validate(rec.lat, rec.lng, dates, rec.tz, events, { cache: SE.store.cache, signal: ac.signal });
        } catch (e) {
          if (rec._abort && rec._abort.signal.aborted) throw e;
          rec.validation = null;
        }
      }
      const warnings = [];
      rec.rows = events.map((ev, i) => SE.formulas.buildRow(i + 1, ev, warnings));
      rec.warnings = warnings;
      rec.progress = { done: dates.length, total: dates.length, building: true };
      emit("progress", rec);
      await SE.builder.makeFiles(rec, rec.formats);
      if (rec._cancelled) {
        const ce = new Error("cancelled");
        ce.name = "AbortError";
        throw ce;
      }
      rec.status = "done";
      rec.finishedAt = Date.now();
      delete rec.progress;
      await SE.store.putRecord(strip(rec));
      live.delete(rec.id);
      emit("done", rec);
    } catch (e) {
      if (rec._cancelled) {
        await SE.store.deleteRecord(rec.id);
        live.delete(rec.id);
        emit("cancelled", rec);
      } else if (e && e.name === "AbortError") {
        rec.status = "queued";
        await SE.store.putRecord(strip(rec));
        emit("update", rec);
      } else {
        rec.status = "error";
        rec.error = { code: e && e.code || "ERROR", message: String(e && e.message || e), date: e && e.date };
        delete rec.progress;
        await SE.store.putRecord(strip(rec));
        live.delete(rec.id);
        emit("error", rec);
      }
    } finally {
      delete rec._abort;
      running = null;
      pump();
    }
  }
  function strip(rec) {
    const c = Object.assign({}, rec);
    delete c._abort;
    delete c._cancelled;
    return c;
  }
  async function cancel(id) {
    const rec = live.get(id);
    if (rec) {
      rec._cancelled = true;
      if (rec._abort) rec._abort.abort();
      else {
        await SE.store.deleteRecord(id);
        live.delete(id);
        emit("cancelled", rec);
      }
    }
  }
  async function retry(id) {
    const rec = await SE.store.getRecord(id);
    if (!rec) return;
    rec.status = "queued";
    rec.error = null;
    rec.progress = { done: 0, total: 0 };
    await SE.store.putRecord(strip(rec));
    live.set(rec.id, rec);
    emit("update", rec);
    pump();
  }
  async function remove(id) {
    if (live.has(id)) return cancel(id);
    await SE.store.deleteRecord(id);
    emit("removed", { id });
  }
  async function list() {
    const all = await SE.store.listRecords();
    return all.map((r) => live.get(r.id) || r);
  }
  const ongoing = () => [...live.values()].filter((r) => r.status === "queued" || r.status === "running").sort((a, b) => a.createdAt - b.createdAt);
  async function init() {
    const all = await SE.store.listRecords();
    for (const r of all) {
      if (r.status === "queued" || r.status === "running") {
        r.status = "queued";
        live.set(r.id, r);
      }
    }
    if (g.document) {
      document.addEventListener("visibilitychange", async () => {
        if (document.visibilityState !== "visible") return;
        const all2 = await SE.store.listRecords();
        for (const r of all2) {
          if (r.status === "error" && r.error && r.error.code === "FETCH_FAILED" && !r.autoRetried) {
            r.autoRetried = true;
            await SE.store.putRecord(r);
            await retry(r.id);
          }
        }
        pump();
      });
    }
    emit("init", null);
    pump();
  }
  SE.jobs = { on, enqueue, cancel, retry, remove, list, ongoing, init, statusOf };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.jobs;
})(typeof globalThis !== "undefined" ? globalThis : this);
