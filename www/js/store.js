(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const mem = { records: new Map(), kv: new Map() };
  const prefs = {
    get(key, def) {
      try {
        const v = localStorage.getItem("se_pref_" + key);
        return v != null ? JSON.parse(v) : def;
      } catch (e) { return def; }
    },
    set(key, val) {
      try { localStorage.setItem("se_pref_" + key, JSON.stringify(val)); } catch (e) {}
    }
  };
  const cache = {
    async get(k) { return mem.kv.get(k); },
    async set(k, v) { mem.kv.set(k, v); }
  };
  async function putRecord(rec) { mem.records.set(rec.id, rec); }
  async function getRecord(id) { return mem.records.get(id) || null; }
  async function listRecords() { return Array.from(mem.records.values()).sort((a,b)=>b.createdAt-a.createdAt); }
  async function deleteRecord(id) { mem.records.delete(id); }
  SE.store = { prefs, cache, putRecord, getRecord, listRecords, deleteRecord };
})(typeof globalThis !== "undefined" ? globalThis : this);
