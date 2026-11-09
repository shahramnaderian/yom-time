(function() {
  "use strict";
  const SE = window.SE = window.SE || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const state = {
    year: null, month: null, city: null,
    formats: { png: true, pdf: false, xlsx: false },
    cal: "j"
  };

  function toast(msg) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2500);
  }

  function lang() {
    return (SE.i18n && SE.i18n.lang) || document.documentElement.lang || "fa";
  }

  function initYearMonth() {
    let y, m;
    if (SE.dates && SE.dates.today) {
      const t = SE.dates.today();
      y = t.jalali.year; m = t.jalali.month;
    } else {
      const d = new Date();
      y = d.getFullYear(); m = d.getMonth() + 1;
    }
    state.year = y; state.month = m;
    const yi = $("#year");
    if (yi) yi.value = y;

    const months = $("#months");
    if (months && SE.dates) {
      const names = lang() === "en" ? SE.dates.JALALI_MONTHS_EN : SE.dates.JALALI_MONTHS_FA;
      months.innerHTML = names.map((n, i) =>
        `<button type="button" data-month="${i + 1}" ${i + 1 === m ? 'aria-checked="true" class="now"' : ""}>${n}</button>`
      ).join("");
      months.querySelectorAll("[data-month]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.month = +btn.getAttribute("data-month");
          months.querySelectorAll("button").forEach((b) => {
            b.classList.toggle("now", b === btn);
            b.setAttribute("aria-checked", b === btn ? "true" : "false");
          });
        });
      });
    }
    const dec = $("#year-dec"), inc = $("#year-inc");
    if (dec) dec.onclick = () => { state.year--; if (yi) yi.value = state.year; };
    if (inc) inc.onclick = () => { state.year++; if (yi) yi.value = state.year; };
    if (yi) yi.onchange = () => { state.year = parseInt(yi.value, 10) || state.year; };
  }

  function setCity(city) {
    state.city = city;
    SE.selectedCity = city;
    if (SE.store && SE.store.prefs) SE.store.prefs.set("homeCity", city);
    const input = $("#city");
    const picked = $("#picked");
    if (input) input.value = city.city || city.name || (city.lat + ", " + city.lng);
    if (picked) {
      const label = SE.place && SE.place.label ? SE.place.label(city, lang()) : (city.city || city.name || "");
      const coords = city.lat != null ? Number(city.lat).toFixed(4) + ", " + Number(city.lng).toFixed(4) : "";
      const acc = city.accuracy != null && SE.locate && SE.locate.accuracyLabel ? SE.locate.accuracyLabel(city.accuracy, lang()) : "";
      picked.innerHTML = `<b>${label}</b> <small class="muted">${coords}</small>` + (acc ? ` <em>${acc}</em>` : "");
    }
  }

  function bindCity() {
    const input = $("#city");
    const suggest = $("#suggest");
    if (!input) return;
    let timer = null, controller = null, latestHits = [];
    const showHits = (hits) => {
      latestHits = hits;
      if (!suggest) return;
      suggest.replaceChildren();
      hits.forEach((h, index) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "suggest-item";
        el.setAttribute("role", "option");
        el.textContent = (h.city || h.name || "مکان") + (h.countryName ? " · " + h.countryName : "");
        el.addEventListener("click", () => {
          setCity({ lat:h.lat, lng:h.lng, city:h.city || h.name, cityEn:h.cityEn || h.city,
            country:h.country, countryName:h.countryName, tz:h.tz, source:h.source || "search", label:h.label });
          suggest.hidden = true;
        });
        suggest.appendChild(el);
      });
      suggest.hidden = !hits.length;
    };
    const search = async (q) => {
      if (controller) controller.abort();
      controller = new AbortController();
      const local = SE.place && SE.place.search ? SE.place.search(q, 50) : [];
      showHits(local);
      const seen = new Set(local.map(c => Number(c.lat).toFixed(3) + "," + Number(c.lng).toFixed(3)));
      let remote = [];
      try {
        const searchLang = lang() === "en" ? "en" : "fa";
        const response = await fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(q) + "&limit=50&lang=" + searchLang,
          { signal:controller.signal, headers:{Accept:"application/json"} });
        if (response.ok) {
          const data = await response.json();
          if (input.value.trim() !== q) return;
          remote = (data.features || []).map(feature => {
            const p = feature.properties || {}, xy = feature.geometry && feature.geometry.coordinates || [];
            const lng = Number(xy[0]), lat = Number(xy[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            const city = p.city || p.name || p.locality || p.district || p.county || p.state || "مکان انتخاب‌شده";
            const key = lat.toFixed(3) + "," + lng.toFixed(3);
            if (seen.has(key)) return null;
            seen.add(key);
            return { lat,lng,city,cityEn:p.name || p.city || city,country:p.countrycode || p.country || null,
              countryName:p.country || "",tz:SE.place.detectTimezone(lat,lng),source:"geocoder",
              label:[city,p.state,p.country].filter(Boolean).join("، ") };
          }).filter(Boolean);
        }
      } catch (e) {
        if (e.name === "AbortError") return;
      }
      if (remote.length < 8) {
        try {
          const r2 = await fetch("https://geocoding-api.open-meteo.com/v1/search?name=" + encodeURIComponent(q) + "&count=20&language=fa&format=json",
            { signal:controller.signal, headers:{Accept:"application/json"} });
          if (r2.ok) {
            const data2 = await r2.json();
            if (input.value.trim() !== q) return;
            const extra = (data2.results || []).map(p => {
              const lat = Number(p.latitude), lng = Number(p.longitude);
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
              const key = lat.toFixed(3) + "," + lng.toFixed(3);
              if (seen.has(key)) return null;
              seen.add(key);
              const city = p.name || p.admin1 || "مکان انتخاب‌شده";
              return { lat,lng,city,cityEn:p.name||city,country:p.country_code||null,countryName:p.country||"",
                tz:p.timezone||SE.place.detectTimezone(lat,lng),source:"open-meteo",
                label:[city,p.admin1,p.country].filter(Boolean).join("، ") };
            }).filter(Boolean);
            remote = remote.concat(extra);
          }
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      if (input.value.trim() === q) showHits(local.concat(remote));
      else if (!local.length && !remote.length && suggest) suggest.hidden = true;
    };
    input.addEventListener("input", () => {
      const q = input.value.trim();
      state.city = null;
      if (q.length < 2) { if (controller) controller.abort(); if (suggest) suggest.hidden = true; return; }
      clearTimeout(timer);
      timer = setTimeout(() => search(q), 450);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && suggest) { suggest.hidden = true; if (controller) controller.abort(); }
      if (e.key === "Enter") {
        e.preventDefault();
        if (latestHits.length) { const h = latestHits[0]; setCity({lat:h.lat,lng:h.lng,city:h.city,cityEn:h.cityEn,country:h.country,countryName:h.countryName,tz:h.tz,source:h.source || "search",label:h.label}); if(suggest)suggest.hidden=true; return; }
        if (SE.place && SE.place.parseInput) {
          const p = SE.place.parseInput(input.value);
          if (p) setCity(Object.assign({ name:p.city }, p));
        }
      }
    });
  }

  function bindFormats() {
    const box = $("#formats");
    if (!box) return;
    if (!box.children.length) {
      box.innerHTML = ["png", "pdf", "xlsx"].map((f) =>
        `<button type="button" class="fmt" data-fmt="${f}" aria-pressed="${state.formats[f]}">${f.toUpperCase()}</button>`
      ).join("");
    }
    box.querySelectorAll("[data-fmt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.getAttribute("data-fmt");
        state.formats[f] = !state.formats[f];
        btn.setAttribute("aria-pressed", String(state.formats[f]));
      });
    });
  }

  function bindGo() {
    const go = $("#go");
    if (!go) return;
    go.addEventListener("click", async () => {
      if (!state.city || state.city.lat == null) {
        toast(lang() === "en" ? "Choose a city or location" : "شهر یا موقعیت را انتخاب کنید");
        return;
      }
      const method = SE.methods && SE.methods.getCurrentMethod ? SE.methods.getCurrentMethod() : "legacy";
      try {
        let rows;
        if (SE.locationBridge && SE.locationBridge.monthRows) {
          rows = SE.locationBridge.monthRows(state.city, state.year, state.month, state.cal, method);
        } else if (SE.methods && SE.methods.buildRowWithMethod) {
          rows = [];
          const days = state.month <= 6 ? 31 : state.month <= 11 ? 30 : 29;
          for (let d = 1; d <= days; d++) {
            let gy = state.year, gm = state.month, gd = d;
            if (state.cal === "j" && SE.jalali && SE.jalali.jalaliToGregorian) {
              const g = SE.jalali.jalaliToGregorian(state.year, state.month, d);
              gy = g.year; gm = g.month; gd = g.day;
            }
            rows.push(SE.methods.buildRowWithMethod(d, state.city.lat, state.city.lng, gy, gm, gd, state.city.tz || "Asia/Tehran", method));
          }
        } else {
          toast(lang() === "en" ? "Calculator not ready" : "موتور محاسبه آماده نیست");
          return;
        }
        if (SE.sabtReminder && rows.length && SE.sabtReminder.scheduleFromMonth) {
          await SE.sabtReminder.scheduleFromMonth(rows, {
            year: state.year, month: state.month, calendar: state.cal, timeZone: state.city.tz || null, lang: lang()
          });
        }
        if (SE.alarms && rows.length && SE.alarms.scheduleForMonth) {
          const placeName = SE.place ? SE.place.label(state.city, lang()) : "";
          const alarmResult = await SE.alarms.scheduleForMonth(rows, placeName, lang(), {
            year: state.year,
            month: state.month,
            calendar: state.cal,
            timeZone: state.city.tz || null
          });
          if (alarmResult && alarmResult.ok === false) {
            toast(lang() === "en" ? "Notification permission is required for prayer alarms" : "برای فعال‌سازی آلارم نماز، اجازه اعلان لازم است");
          }
        }
        const active = $("#active");
        if (active) {
          active.hidden = false;
          const sample = rows[0] || [];
          active.innerHTML = `<div class="card-title">${lang() === "en" ? "Sample day 1" : "نمونه روز ۱"}</div>` +
            `<pre style="font-size:12px;overflow:auto">${JSON.stringify({ fajr: sample[2], sunrise: sample[3], dhuhr: sample[4], asr: sample[5], maghrib: sample[6], isha: sample[8], night1: sample[9], night2: sample[10], days: rows.length, method }, null, 2)}</pre>`;
        }
        toast(lang() === "en" ? `Built ${rows.length} days` : `جدول ${rows.length} روز ساخته شد`);
      } catch (e) {
        toast(String(e.message || e));
      }
    });
  }

  function bindTabs() {
    $$(".tabbar a[data-tab]").forEach((a) => {
      a.addEventListener("click", (e) => {
        const tab = a.getAttribute("data-tab");
        if (tab === "settings") return;
        e.preventDefault();
        location.hash = "#/" + tab;
        $$(".view").forEach((v) => { v.hidden = v.id !== "view-" + tab; });
        $$(".tabbar a").forEach((x) => { x.classList.toggle("active", x.getAttribute("data-tab") === tab); });
      });
    });
  }

  function bindLang() {
    const btn = $("#lang");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const next = lang() === "fa" ? "en" : "fa";
      document.documentElement.lang = next;
      document.documentElement.dir = next === "fa" ? "rtl" : "ltr";
      if (SE.i18n && SE.i18n.setLang) SE.i18n.setLang(next);
      btn.textContent = next === "fa" ? "English" : "فارسی";
      if (window.SE_refreshDateBar) SE_refreshDateBar();
      initYearMonth();
    });
  }

  function init() {
    initYearMonth();
    bindCity();
    bindFormats();
    bindGo();
    bindTabs();
    bindLang();
    if (SE.weeklySessions) SE.weeklySessions.init({ toast });
    if (SE.worshipTracker) SE.worshipTracker.init();
    if (!state.city) {
      const savedCity = SE.store && SE.store.prefs ? SE.store.prefs.get("homeCity", null) : null;
      setCity(savedCity && Number.isFinite(Number(savedCity.lat)) && Number.isFinite(Number(savedCity.lng))
        ? savedCity
        : { lat: 35.6892, lng: 51.3890, tz: "Asia/Tehran", city: "تهران", cityEn: "Tehran", country: "IR", countryName: "ایران", source: "default" });
    }
    if (location.hash === "#/create") { $("#view-home").hidden = true; $("#view-create").hidden = false; }
    if (window.SE_refreshDateBar) SE_refreshDateBar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
