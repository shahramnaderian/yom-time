(function () {
  "use strict";
  var SE = window.SE = window.SE || {};
  var KAABA = { lat: 21.422487, lng: 39.826206 };

  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }
  function fa(s) {
    return String(s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }
  function bearingTo(lat1, lng1, lat2, lng2) {
    if (SE.qibla && SE.qibla.bearingTo) return SE.qibla.bearingTo(lat1, lng1, lat2, lng2);
    var p1 = toRad(lat1), p2 = toRad(lat2), dl = toRad(lng2 - lng1);
    var y = Math.sin(dl) * Math.cos(p2);
    var x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }
  function distanceKm(lat1, lng1, lat2, lng2) {
    if (SE.qibla && SE.qibla.distanceKm) return SE.qibla.distanceKm(lat1, lng1, lat2, lng2);
    var R = 6371, dp = toRad(lat2 - lat1), dl = toRad(lng2 - lng1);
    var a = Math.sin(dp / 2) * Math.sin(dp / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  function loc() {
    var c = SE.selectedCity;
    if (c && Number.isFinite(Number(c.lat))) {
      return { lat: Number(c.lat), lng: Number(c.lng), label: (c.city || c.cityEn || "موقعیت انتخاب‌شده") };
    }
    try {
      var saved = SE.store && SE.store.prefs ? SE.store.prefs.get("homeCity", null) : null;
      if (saved && Number.isFinite(Number(saved.lat))) {
        return { lat: Number(saved.lat), lng: Number(saved.lng), label: saved.city || "شهر ذخیره‌شده" };
      }
    } catch (_) {}
    return { lat: 35.6892, lng: 51.3890, label: "تهران" };
  }

  function ensureStyles() {
    if (document.getElementById("home-qibla-styles")) return;
    var st = document.createElement("style");
    st.id = "home-qibla-styles";
    st.textContent = [
      ".home-qibla-card{margin:12px 4px;padding:14px 16px;border-radius:16px;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.06);display:flex;align-items:center;gap:14px;flex-wrap:wrap}",
      ".home-qibla-icon{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#edf5fa,#dceef8);display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0}.home-qibla-icon img{width:100%;height:100%;object-fit:cover;border-radius:50%}",
      ".home-qibla-body{flex:1;min-width:140px}",
      ".home-qibla-title{font-weight:700;font-size:.95rem;color:#2B1A1A;margin:0 0 4px}",
      ".home-qibla-meta{font-size:.85rem;color:#657384;margin:0}",
      ".home-qibla-angle{font-size:1.25rem;font-weight:700;color:#246f9e;margin:2px 0}",
      ".home-qibla-actions{display:flex;gap:8px;flex-wrap:wrap}",
      ".home-qibla-actions .primary,.home-qibla-actions .ghost{min-height:40px;padding:8px 14px;border-radius:12px;font:inherit;font-size:.85rem;cursor:pointer}",
      ".home-qibla-actions .primary{background:#246f9e;color:#fff;border:none}",
      ".home-qibla-actions .ghost{background:#edf5fa;color:#246f9e;border:1px solid #d5e3ec}"
    ].join("");
    document.head.appendChild(st);
  }

  function openQibla() {
    location.hash = "#/qibla";
    try { window.dispatchEvent(new Event("hashchange")); } catch (_) {}
    var tab = document.querySelector('.tabbar a[data-tab="qibla"]');
    if (tab) tab.click();
  }

  function renderCard() {
    ensureStyles();
    var home = document.getElementById("view-home");
    if (!home) return;
    var card = document.getElementById("home-qibla-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "home-qibla-card";
      card.className = "home-qibla-card";
      card.innerHTML =
        '<div class="home-qibla-icon" aria-hidden="true"><img src="images/kaaba-illustration.svg" alt="" loading="lazy"></div>' +
        '<div class="home-qibla-body">' +
        '  <p class="home-qibla-title">قبله‌نما</p>' +
        '  <p class="home-qibla-angle" id="home-qibla-angle">—</p>' +
        '  <p class="home-qibla-meta" id="home-qibla-meta">—</p>' +
        '</div>' +
        '<div class="home-qibla-actions">' +
        '  <button type="button" class="primary" id="home-qibla-open">باز کردن قبله‌نما</button>' +
        '</div>';
      var times = home.querySelector(".home-times-card");
      var next = home.querySelector(".home-next-card");
      if (times) home.insertBefore(card, times);
      else if (next && next.nextSibling) home.insertBefore(card, next.nextSibling);
      else home.appendChild(card);
      var btn = document.getElementById("home-qibla-open");
      if (btn && !btn.dataset.bound) {
        btn.dataset.bound = "1";
        btn.addEventListener("click", openQibla);
      }
    }
    var p = loc();
    var ang = bearingTo(p.lat, p.lng, KAABA.lat, KAABA.lng);
    var dist = distanceKm(p.lat, p.lng, KAABA.lat, KAABA.lng);
    var angleEl = document.getElementById("home-qibla-angle");
    var metaEl = document.getElementById("home-qibla-meta");
    if (angleEl) angleEl.textContent = fa(Math.round(ang)) + "° از شمال";
    if (metaEl) metaEl.textContent = p.label + " · حدود " + fa(Math.round(dist)) + " کیلومتر تا کعبه";
  }

  function init() {
    renderCard();
    window.addEventListener("hashchange", function () {
      if (location.hash === "#/home" || location.hash === "" || location.hash === "#/") renderCard();
    });
    setInterval(function () {
      if (!document.getElementById("view-home") || document.getElementById("view-home").hidden) return;
      renderCard();
    }, 15000);
  }

  SE.homeQiblaCard = { render: renderCard, open: openQibla };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
