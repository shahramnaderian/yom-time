(function () {
  "use strict";
  const SE = window.SE = window.SE || {};
  const KAABA = { lat: 21.422487, lng: 39.826206 };
  const $ = function (id) { return document.getElementById(id); };

  function isEnglish() { return (SE.i18n && SE.i18n.lang) === "en" || document.documentElement.lang === "en"; }
  function applyLanguage() {
    const en=isEnglish(), set=(id,fa,enText)=>{const el=$(id);if(el)el.textContent=en?enText:fa;};
    set("qibla-title","قبله‌نما","Qibla compass");
    set("qibla-distance","—","—");
    set("qibla-heading", "قطب‌نما غیرفعال — دکمه زیر را بزنید", "Compass inactive — tap the button below");
    set("qibla-status","زاویه قبله نسبت به شمال جغرافیایی محاسبه می‌شود.","Qibla bearing is measured from true north.");
    const gps=$("qibla-gps"),compass=$("qibla-compass"),city=$("qibla-use-city");
    if(gps)gps.textContent=en?"Use my location (GPS)":"موقعیت من (GPS)";
    if(compass)compass.textContent=en?"Enable compass":"فعال‌سازی قطب‌نما";
    if(city)city.textContent=en?"Use selected city":"استفاده از شهر انتخاب‌شده";
    const caption=document.querySelector(".qibla-kaaba-art figcaption");
    if(caption)caption.textContent=en?"The Holy Kaaba":"خانهٔ خدا · کعبهٔ شریف";
    const title=document.querySelector("#view-qibla .archive-head h2");
    if(title)title.textContent=en?"Qibla compass":"قبله‌نما";
    const note=document.querySelector("#qibla-card > .hint:last-child");
    if(note)note.textContent=en?"For accurate compass readings, keep the phone flat and away from metal or magnets.":"نکته: برای قطب‌نمای دقیق، گوشی را صاف و افقی نگه دارید و از تداخل فلز و آهن‌ربا دوری کنید.";
  }
  function toRad(d) { return d * Math.PI / 180; }
  function toDeg(r) { return r * 180 / Math.PI; }

  function bearingTo(lat1, lng1, lat2, lng2) {
    const φ1 = toRad(lat1), φ2 = toRad(lat2);
    const Δλ = toRad(lng2 - lng1);
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dφ = toRad(lat2 - lat1);
    const dλ = toRad(lng2 - lng1);
    const a = Math.sin(dφ / 2) * Math.sin(dφ / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dλ / 2) * Math.sin(dλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function faDigits(s) {
    return String(s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }

  function formatBearing(deg) {
    const d = Math.round((deg % 360 + 360) % 360);
    return (isEnglish()?String(d):faDigits(d)) + "°";
  }

  function getUserLocation() {
    if (SE.selectedCity && Number.isFinite(Number(SE.selectedCity.lat))) {
      return {
        lat: Number(SE.selectedCity.lat),
        lng: Number(SE.selectedCity.lng),
        label: SE.place && SE.place.label ? SE.place.label(SE.selectedCity, isEnglish()?"en":"fa") : (isEnglish()?(SE.selectedCity.cityEn || SE.selectedCity.city || "Selected location"):(SE.selectedCity.city || "موقعیت انتخاب‌شده")),
        source: "selected"
      };
    }
    try {
      const saved = SE.store && SE.store.prefs ? SE.store.prefs.get("homeCity", null) : null;
      if (saved && Number.isFinite(Number(saved.lat))) {
        return {
          lat: Number(saved.lat),
          lng: Number(saved.lng),
          label: SE.place && SE.place.label ? SE.place.label(saved, isEnglish()?"en":"fa") : (isEnglish()?(saved.cityEn || saved.city || "Saved city"):(saved.city || "شهر ذخیره‌شده")),
          source: "saved"
        };
      }
    } catch (_) {}
    return { lat: 35.6892, lng: 51.3890, label: isEnglish()?"Tehran (default)":"تهران (پیش‌فرض)", source: "default" };
  }

  let compassHeading = null;
  let orientationHandler = null;
  let watchId = null;
  let liveLoc = null;

  function normalizeHeading(alpha, absolute, webkitHeading) {
    if (typeof webkitHeading === "number" && !isNaN(webkitHeading)) {
      return (webkitHeading + 360) % 360;
    }
    if (typeof alpha === "number" && !isNaN(alpha)) {
      return (360 - alpha + 360) % 360;
    }
    return null;
  }

  function onOrientation(event) {
    const h = normalizeHeading(event.alpha, event.absolute, event.webkitCompassHeading);
    if (h == null) return;
    compassHeading = h;
    renderCompass();
  }

  function startCompass() {
    if (orientationHandler) return;
    orientationHandler = onOrientation;
    if (typeof DeviceOrientationEvent !== "undefined" &&
        typeof DeviceOrientationEvent.requestPermission === "function") {
      DeviceOrientationEvent.requestPermission().then(function (state) {
        if (state === "granted") {
          window.addEventListener("deviceorientation", orientationHandler, true);
          setStatus(isEnglish()?"Compass enabled. Keep your phone flat.":"قطب‌نما فعال شد. گوشی را افقی نگه دارید.");
        } else {
          setStatus(isEnglish()?"Compass permission denied. Showing the Qibla bearing only.":"اجازه دسترسی به قطب‌نما داده نشد. فقط زاویه قبله نمایش داده می‌شود.");
        }
      }).catch(function () {
        setStatus(isEnglish()?"Compass is unavailable in this browser. Showing the Qibla bearing only.":"قطب‌نما در این مرورگر در دسترس نیست. فقط زاویه قبله نمایش داده می‌شود.");
      });
    } else {
      window.addEventListener("deviceorientation", orientationHandler, true);
      window.addEventListener("deviceorientationabsolute", orientationHandler, true);
      setStatus(isEnglish()?"Reading compass… keep your phone flat.":"در حال خواندن قطب‌نما… گوشی را افقی نگه دارید.");
    }
  }

  function setStatus(msg) {
    const el = $("qibla-status");
    if (el) el.textContent = msg;
  }

  function renderCompass() {
    const loc = liveLoc || getUserLocation();
    const qibla = bearingTo(loc.lat, loc.lng, KAABA.lat, KAABA.lng);
    const dist = distanceKm(loc.lat, loc.lng, KAABA.lat, KAABA.lng);

    const angleEl = $("qibla-angle");
    const distEl = $("qibla-distance");
    const placeEl = $("qibla-place");
    const needle = $("qibla-needle");
    const deviceNeedle = $("qibla-device-marker");

    if (angleEl) angleEl.textContent = formatBearing(qibla);
    if (distEl) distEl.textContent = faDigits(dist.toFixed(0)) + (isEnglish()?" km to the Kaaba":" کیلومتر تا کعبه");
    if (placeEl) placeEl.textContent = loc.label + " · " + loc.lat.toFixed(4) + ", " + loc.lng.toFixed(4);

    if (needle) {
      let needleAngle = qibla;
      if (compassHeading != null) {
        needleAngle = (qibla - compassHeading + 360) % 360;
      }
      needle.style.transform = "rotate(" + needleAngle + "deg)";
    }
    if (deviceNeedle) {
      deviceNeedle.hidden = compassHeading == null;
    }

    const headingEl = $("qibla-heading");
    if (headingEl) {
      headingEl.textContent = compassHeading != null
        ? (isEnglish()?"Phone heading: ":"جهت گوشی: ") + formatBearing(compassHeading)
        : (isEnglish()?"Compass inactive — tap the button below":"قطب‌نما غیرفعال — دکمه زیر را بزنید");
    }
  }

  function requestGps() {
    setStatus(isEnglish()?"Getting your location…":"در حال دریافت موقعیت…");
    if (!navigator.geolocation) {
      setStatus(isEnglish()?"Location is not supported on this device.":"موقعیت‌یابی در این دستگاه پشتیبانی نمی‌شود.");
      renderCompass();
      return;
    }
    if (watchId != null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
    watchId = navigator.geolocation.watchPosition(
      function (pos) {
        liveLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: isEnglish()?"GPS location":"موقعیت GPS",
          source: "gps"
        };
        if (SE.place && SE.place.fromCoords) {
          try {
            const p = SE.place.fromCoords(liveLoc.lat, liveLoc.lng, { source: "qibla-gps" });
            liveLoc.label = SE.place.label ? SE.place.label(p, isEnglish()?"en":"fa") : liveLoc.label;
          } catch (_) {}
        }
        setStatus(isEnglish()?"GPS location updated · accuracy about "+Math.round(pos.coords.accuracy || 0)+" m":"موقعیت GPS به‌روز شد · دقت حدود " + faDigits(Math.round(pos.coords.accuracy || 0)) + " متر");
        renderCompass();
      },
      function (err) {
        setStatus((isEnglish()?"Could not access GPS: ":"دسترسی به GPS ممکن نشد: ") + (err && err.message ? err.message : (isEnglish()?"Error":"خطا")));
        renderCompass();
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
  }

  function buildUI() {
    const view = $("view-qibla");
    if (!view || $("qibla-card")) { applyLanguage(); return; }

    view.innerHTML =
      '<div class="archive-head"><h2>قبله‌نما</h2></div>' +
      '<div class="card" id="qibla-card">' +
      '  <p class="hint" id="qibla-place">—</p>' +
      '  <div class="qibla-dial-wrap">' +
      '    <div class="qibla-dial" id="qibla-dial" aria-hidden="true">' +
      '      <div class="qibla-ring">' +
      '        <span class="qibla-n">ش</span><span class="qibla-e">ق</span><span class="qibla-s">ج</span><span class="qibla-w">غ</span>' +
      '      </div>' +
      '      <div class="qibla-needle" id="qibla-needle">' +
      '        <div class="qibla-needle-arm"></div>' +
      '        <div class="qibla-kaaba">🕋</div>' +
      '      </div>' +
      '      <div class="qibla-device-marker" id="qibla-device-marker" hidden></div>' +
      '      <div class="qibla-center"></div>' +
      '    </div>' +
      '  </div>' +
      '  <figure class="qibla-kaaba-art"><img src="images/kaaba-illustration.svg" alt="تصویر کعبه" loading="lazy"><figcaption>خانهٔ خدا · کعبهٔ شریف</figcaption></figure>' +
      '  <div class="qibla-readout">' +
      '    <div class="qibla-angle" id="qibla-angle">—</div>' +
      '    <div class="qibla-distance" id="qibla-distance">—</div>' +
      '    <div class="hint" id="qibla-heading">—</div>' +
      '  </div>' +
      '  <p class="hint" id="qibla-status" role="status" aria-live="polite">زاویه قبله نسبت به شمال جغرافیایی محاسبه می‌شود.</p>' +
      '  <div class="qibla-actions">' +
      '    <button type="button" class="primary" id="qibla-gps">موقعیت من (GPS)</button>' +
      '    <button type="button" class="ghost" id="qibla-compass">فعال‌سازی قطب‌نما</button>' +
      '    <button type="button" class="ghost" id="qibla-use-city">استفاده از شهر انتخاب‌شده</button>' +
      '  </div>' +
      '  <p class="hint">نکته: برای قطب‌نمای دقیق، گوشی را صاف و افقی نگه دارید و از تداخل فلز و آهن‌ربا دوری کنید.</p>' +
      '</div>';

    injectStyles();

    $("qibla-gps").addEventListener("click", requestGps);
    $("qibla-compass").addEventListener("click", startCompass);
    $("qibla-use-city").addEventListener("click", function () {
      liveLoc = null;
      if (watchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setStatus(isEnglish()?"Using the city/location selected in the app.":"از شهر/موقعیت انتخاب‌شده در برنامه استفاده می‌شود.");
      renderCompass();
    });

    renderCompass();
  }

  function injectStyles() {
    if ($("qibla-styles")) return;
    const style = document.createElement("style");
    style.id = "qibla-styles";
    style.textContent = [
      ".qibla-dial-wrap{display:flex;justify-content:center;padding:12px 0 8px}",
      ".qibla-kaaba-art{margin:4px auto 14px;max-width:330px;text-align:center;border-radius:22px;overflow:hidden;background:linear-gradient(145deg,#f8f1df,#e6d4aa);box-shadow:0 8px 26px rgba(60,42,15,.12);border:1px solid #eadbb8}",
      ".qibla-kaaba-art img{display:block;width:100%;height:auto;max-height:280px;object-fit:contain}",
      ".qibla-kaaba-art figcaption{padding:7px 12px 10px;color:#725b2d;font-weight:700;font-size:.9rem}",
      ".qibla-dial{position:relative;width:min(72vw,280px);height:min(72vw,280px);border-radius:50%;background:radial-gradient(circle at 50% 45%,#fff 0%,var(--chip,#FCEAE6) 70%,#f0e0d8 100%);border:3px solid var(--brand,#C22928);box-shadow:0 8px 28px rgba(0,0,0,.08)}",
      ".qibla-ring{position:absolute;inset:10px;border-radius:50%;border:1px dashed var(--line,#F1DDD9)}",
      ".qibla-n,.qibla-e,.qibla-s,.qibla-w{position:absolute;font-weight:700;font-size:.85rem;color:var(--muted,#6F615E)}",
      ".qibla-n{top:6px;left:50%;transform:translateX(-50%)}",
      ".qibla-s{bottom:6px;left:50%;transform:translateX(-50%)}",
      ".qibla-e{right:10px;top:50%;transform:translateY(-50%)}",
      ".qibla-w{left:10px;top:50%;transform:translateY(-50%)}",
      ".qibla-needle{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:18%;transition:transform .25s ease-out;transform-origin:50% 50%}",
      ".qibla-needle-arm{position:absolute;top:18%;left:50%;width:4px;height:32%;background:linear-gradient(var(--brand,#C22928),#e4572e);transform:translateX(-50%);border-radius:4px;transform-origin:bottom center}",
      ".qibla-kaaba{position:relative;z-index:2;font-size:1.4rem;filter:drop-shadow(0 2px 4px rgba(0,0,0,.15))}",
      ".qibla-center{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--brand,#C22928);border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2)}",
      ".qibla-device-marker{position:absolute;left:50%;top:8px;width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid #2563B0;transform:translateX(-50%)}",
      ".qibla-readout{text-align:center;margin:8px 0 12px}",
      ".qibla-angle{font-size:2rem;font-weight:700;color:var(--brand,#C22928)}",
      ".qibla-distance{font-size:.95rem;color:var(--muted,#6F615E);margin-top:4px}",
      ".qibla-actions{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}",
      ".qibla-actions button{flex:1;min-width:140px}"
    ].join("");
    document.head.appendChild(style);
  }

  function onTabShow() {
    buildUI();
    renderCompass();
  }

  function bindTab() {
    const link = document.querySelector('.tabbar a[data-tab="qibla"]');
    if (link) {
      link.addEventListener("click", function () {
        setTimeout(onTabShow, 0);
      });
    }
    window.addEventListener("hashchange", function () {
      if (location.hash === "#/qibla") onTabShow();
    });
    if (location.hash === "#/qibla") onTabShow();
  }

  function init() {
    const langButton=$("lang");
    if(langButton&&!langButton.dataset.qiblaLangBound){
      langButton.dataset.qiblaLangBound="1";
      langButton.addEventListener("click",function(){setTimeout(function(){applyLanguage();renderCompass();},0);});
    }
    bindTab();
    if ($("view-qibla")) buildUI();
  }

  SE.qibla = {
    bearingTo: bearingTo,
    distanceKm: distanceKm,
    kaaba: KAABA,
    render: renderCompass,
    startCompass: startCompass
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
