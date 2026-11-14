(function () {
  "use strict";
  const SE = window.SE = window.SE || {};
  const STORAGE_KEY = "yomtime_monthly_prayer_archive_v1";
  function readArchive() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  }
  function writeArchive(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 36))); return true; }
    catch (_) { return false; }
  }
  function recordId(year, month, city) {
    return "j-" + year + "-" + month + "-" + Number(city.lat).toFixed(3) + "-" + Number(city.lng).toFixed(3);
  }
  function cityName(city) {
    return SE.place && SE.place.label ? SE.place.label(city, "fa") : (city.city || city.label || "شهر انتخاب‌شده");
  }
  function saveRecord(city, year, month, rows, method, opts) {
    opts = opts || {};
    if (!city || !Number.isFinite(Number(city.lat)) || !Number.isFinite(Number(city.lng))) {
      throw new Error("مکان معتبر نیست.");
    }
    if (!Number.isInteger(year) || year < 1200 || year > 1600 || month < 1 || month > 12) {
      throw new Error("سال یا ماه واردشده معتبر نیست.");
    }
    if (!Array.isArray(rows) || !rows.length) {
      throw new Error("جدول خالی است.");
    }
    const record = {
      id: recordId(year, month, city),
      year: year,
      month: month,
      city: cityName(city),
      place: { lat: Number(city.lat), lng: Number(city.lng), tz: city.tz || "Asia/Tehran", city: city.city || city.name || "" },
      method: method || "legacy",
      rows: rows,
      approximateCount: rows.filter(function (row) { return Array.isArray(row[11]) && row[11].length; }).length,
      createdAt: Date.now(),
      source: opts.source || "archive"
    };
    const records = readArchive().filter(function (item) { return item.id !== record.id; });
    records.unshift(record);
    if (!writeArchive(records)) throw new Error("ذخیره‌سازی در حافظهٔ دستگاه ممکن نشد.");
    try {
      const badge = document.getElementById("badge");
      const countEl = document.getElementById("archive-count");
      const n = records.length;
      if (badge) { badge.hidden = n === 0; badge.textContent = n ? String(n) : ""; }
      if (countEl) countEl.textContent = n ? n + " جدول ذخیره‌شده" : "";
      const empty = document.getElementById("archive-empty");
      if (empty) empty.hidden = n > 0;
      if (window.SE && SE.monthlyArchive && typeof SE.monthlyArchive.refreshList === "function") {
        SE.monthlyArchive.refreshList();
      }
    } catch (_) {}
    return record;
  }
  SE.monthlyArchive = SE.monthlyArchive || {};
  SE.monthlyArchive.saveFromCreate = function (city, year, month, rows, method) {
    return saveRecord(city, year, month, rows, method, { source: "create", render: true });
  };
  SE.monthlyArchive.saveRecord = saveRecord;
  SE.monthlyArchive.read = readArchive;
})();
