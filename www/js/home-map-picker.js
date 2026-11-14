(function () {
  "use strict";

  var initialized = false;
  var map = null;
  var marker = null;
  var selected = null;

  function byId(id) { return document.getElementById(id); }

  function loadCss() {
    if (document.querySelector('link[data-home-leaflet="1"]')) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.setAttribute("data-home-leaflet", "1");
    document.head.appendChild(link);
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (window.__homeLeafletLoading) return window.__homeLeafletLoading;
    loadCss();
    window.__homeLeafletLoading = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = resolve;
      script.onerror = function () { reject(new Error("بارگذاری نقشه ناموفق بود. اتصال اینترنت را بررسی کنید.")); };
      document.head.appendChild(script);
    });
    return window.__homeLeafletLoading;
  }

  function currentPlace() {
    try {
      if (window.SE && SE.cityPersist && SE.cityPersist.load) return SE.cityPersist.load();
      if (window.SE && SE.store && SE.store.prefs) return SE.store.prefs.get("homeCity", null);
    } catch (_) {}
    return null;
  }

  function updateSelection(latlng) {
    selected = { lat: Number(latlng.lat), lng: Number(latlng.lng) };
    byId("home-map-coords").textContent =
      selected.lat.toFixed(6) + ", " + selected.lng.toFixed(6);
    byId("home-map-confirm").disabled = false;
    if (!marker) {
      marker = window.L.marker(latlng, { draggable: true }).addTo(map);
      marker.on("dragend", function (event) { updateSelection(event.target.getLatLng()); });
    } else {
      marker.setLatLng(latlng);
    }
  }

  async function openMap() {
    var panel = byId("home-map-panel");
    var toggle = byId("home-map-toggle");
    panel.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "بستن نقشه";
    if (initialized) {
      setTimeout(function () { map.invalidateSize(); }, 80);
      return;
    }

    byId("home-map-coords").textContent = "در حال آماده‌سازی نقشه…";
    try {
      await loadLeaflet();
      var saved = currentPlace();
      var center = saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))
        ? [Number(saved.lat), Number(saved.lng)] : [32.5, 53.5];
      map = window.L.map("home-location-map").setView(center, saved ? 11 : 5);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
      map.on("click", function (event) { updateSelection(event.latlng); });
      if (saved) updateSelection({ lat: Number(saved.lat), lng: Number(saved.lng) });
      else byId("home-map-coords").textContent = "برای تعیین موقعیت، روی نقشه بزنید.";
      initialized = true;
      setTimeout(function () { map.invalidateSize(); }, 100);
    } catch (error) {
      byId("home-map-coords").textContent = error && error.message
        ? error.message : "نقشه در دسترس نیست.";
    }
  }

  function closeMap() {
    byId("home-map-panel").hidden = true;
    byId("home-map-toggle").setAttribute("aria-expanded", "false");
    byId("home-map-toggle").textContent = "📍 انتخاب نقطه روی نقشه";
  }

  function confirmPlace() {
    if (!selected || !window.SE || !SE.place || !SE.place.fromCoords) return;
    try {
      var place = SE.place.fromCoords(selected.lat, selected.lng, {
        source: "map-confirmed",
        label: "موقعیت انتخاب‌شده روی نقشه"
      });
      if (SE.cityPersist && SE.cityPersist.save) {
        SE.cityPersist.save(place);
      } else if (SE.store && SE.store.prefs) {
        SE.store.prefs.set("homeCity", place);
        SE.store.prefs.set("homeCityBackup", place);
      } else {
        throw new Error("ذخیره‌سازی موقعیت در دسترس نیست.");
      }
      SE.selectedCity = place;
      byId("home-map-coords").textContent = "موقعیت ذخیره شد؛ در حال به‌روزرسانی اوقات شرعی…";
      window.location.reload();
    } catch (error) {
      byId("home-map-coords").textContent = error && error.message
        ? error.message : "ثبت موقعیت انجام نشد.";
    }
  }

  function init() {
    var toggle = byId("home-map-toggle");
    if (!toggle || toggle.dataset.bound) return;
    toggle.dataset.bound = "1";
    toggle.addEventListener("click", function () {
      if (byId("home-map-panel").hidden) openMap();
      else closeMap();
    });
    byId("home-map-confirm").addEventListener("click", confirmPlace);
    byId("home-map-cancel").addEventListener("click", closeMap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
