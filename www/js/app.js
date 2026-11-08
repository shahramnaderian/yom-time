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
    input.addEventListener("input", () => {
      const q = input.value.trim();
      state.city = null;
      if (!suggest) return;
      if (SE.place && SE.place.parseInput) {
        const coord = SE.place.parseInput(q);
        if (coord && coord.source === "manual") { setCity(coord); suggest.hidden = true; return; }
      }
      if (SE.place && SE.place.search && q.length >= 1) {
        const hits = SE.place.search(q, 12);
        if (!hits.length) { suggest.hidden = true; return; }
        suggest.hidden = false;
        suggest.innerHTML = hits.map((h, i) =>
          `<div class="suggest-item" role="option" data-i="${i}">${h.city}${h.countryName ? " · " + h.countryName : ""}</div>`
        ).join("");
        suggest.querySelectorAll("[data-i]").forEach((el) => {
          el.onclick = () => {
            const h = hits[+el.getAttribute("data-i")];
            setCity({ lat: h.lat, lng: h.lng, city: h.city, cityEn: h.cityEn, country: h.country, countryName: h.countryName, tz: h.tz, name: h.city });
            suggest.hidden = true;
          };
        });
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (SE.place && SE.place.parseInput) {
          const p = SE.place.parseInput(input.value);
          if (p) setCity(Object.assign({ name: p.city }, p));
        }
      }
    });
  }

  function bindLocate() {
    const btn = $("#locate");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const span = btn.querySelector("span") || btn;
      const prev = span.textContent;
      span.textContent = lang() === "en" ? "Locating…" : "در حال یافتن…";
      try {
        let fix;
        if (SE.locate && SE.locate.preciseFix) fix = await SE.locate.preciseFix({ ask: true, samples: 2 });
        else if (SE.locate && SE.locate.locate) fix = await SE.locate.locate({ ask: true });
        else throw new Error("no locate");
        const place = SE.place && SE.place.fromCoords
          ? SE.place.fromCoords(fix.lat, fix.lng, { source: fix.source || "gps", accuracy: fix.accuracy, altitude: fix.altitude })
          : { lat: fix.lat, lng: fix.lng, source: fix.source, accuracy: fix.accuracy };
        setCity(place);
        toast(lang() === "en" ? "Location found" : "موقعیت پیدا شد");
      } catch (e) {
        toast(lang() === "en" ? "Location failed" : "موقعیت‌یابی ناموفق");
      } finally {
        btn.disabled = false;
        span.textContent = prev;
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
      const method = SE.methods && SE.methods.getCurrentMethod ? SE.methods.getCurrentMethod() : "tehran";
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
            calendar: state.cal
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
    bindLocate();
    bindFormats();
    bindGo();
    bindTabs();
    bindLang();
    if (!state.city && SE.place && SE.place.defaultPlace) setCity(SE.place.defaultPlace());
    if (window.SE_refreshDateBar) SE_refreshDateBar();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
