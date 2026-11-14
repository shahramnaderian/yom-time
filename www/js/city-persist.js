(function () {
  "use strict";
  var SE = window.SE = window.SE || {};
  var KEY = "homeCity";
  var KEY_BACKUP = "homeCityBackup";

  function prefs() {
    return SE.store && SE.store.prefs ? SE.store.prefs : null;
  }

  function isValidCity(c) {
    return c && Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng));
  }

  function normalize(c) {
    if (!isValidCity(c)) return null;
    return {
      lat: Number(c.lat),
      lng: Number(c.lng),
      tz: c.tz || "Asia/Tehran",
      city: c.city || c.name || c.cityEn || "",
      cityEn: c.cityEn || c.city || "",
      country: c.country || "",
      countryName: c.countryName || "",
      source: c.source || "saved",
      label: c.label || "",
      accuracy: c.accuracy
    };
  }

  function saveCity(city) {
    var n = normalize(city);
    if (!n) return false;
    var p = prefs();
    if (p) {
      p.set(KEY, n);
      p.set(KEY_BACKUP, n);
    } else {
      try {
        localStorage.setItem("se_pref_" + KEY, JSON.stringify(n));
        localStorage.setItem("se_pref_" + KEY_BACKUP, JSON.stringify(n));
      } catch (_) {}
    }
    SE.selectedCity = n;
    return true;
  }

  function loadCity() {
    var p = prefs();
    var c = null;
    if (p) {
      c = p.get(KEY, null) || p.get(KEY_BACKUP, null);
    }
    if (!isValidCity(c)) {
      try {
        var raw = localStorage.getItem("se_pref_" + KEY) || localStorage.getItem("se_pref_" + KEY_BACKUP);
        if (raw) c = JSON.parse(raw);
      } catch (_) {}
    }
    if (!isValidCity(c)) return null;
    return normalize(c);
  }

  function applyToUI(city) {
    if (!city) return;
    SE.selectedCity = city;
    try {
      if (typeof SE.setSelectedCity === "function") {
        if (SE.setSelectedCity._cityPersistWrapped) {
          SE.setSelectedCity._raw(city);
        } else {
          SE.setSelectedCity(city);
        }
      }
    } catch (_) {}
  }

  function wrapSetSelectedCity() {
    if (typeof SE.setSelectedCity !== "function" || SE.setSelectedCity._cityPersistWrapped) return;
    var raw = SE.setSelectedCity.bind(SE);
    function wrapped(city) {
      raw(city);
      saveCity(city);
    }
    wrapped._cityPersistWrapped = true;
    wrapped._raw = raw;
    SE.setSelectedCity = wrapped;
  }

  function restore() {
    var saved = loadCity();
    if (!saved) return;
    SE.selectedCity = saved;
    wrapSetSelectedCity();
    applyToUI(saved);
  }

  SE.cityPersist = {
    save: saveCity,
    load: loadCity,
    restore: restore
  };

  function boot() {
    wrapSetSelectedCity();
    restore();
    setTimeout(function () {
      wrapSetSelectedCity();
      var saved = loadCity();
      if (saved && !SE.selectedCity) SE.selectedCity = saved;
      if (saved && typeof SE.setSelectedCity === "function") {
        try { SE.setSelectedCity(saved); } catch (_) {}
      }
    }, 200);
    setTimeout(function () {
      wrapSetSelectedCity();
      var saved = loadCity();
      if (saved) {
        SE.selectedCity = saved;
        try {
          if (typeof SE.setSelectedCity === "function") SE.setSelectedCity(saved);
        } catch (_) {}
      }
    }, 800);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
