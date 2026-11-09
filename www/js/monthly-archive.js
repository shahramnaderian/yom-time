(function () {
  "use strict";
  const SE = window.SE = window.SE || {};
  const STORAGE_KEY = "yomtime_monthly_prayer_archive_v1";
  const $ = (id) => document.getElementById(id);
  const fa = (value) => SE.formulas && SE.formulas.formatCell ? SE.formulas.formatCell(value, "fa") : String(value == null ? "—" : value);
  const monthNames = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

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
  function getHomeCity() {
    const selected = SE.selectedCity;
    if (selected && Number.isFinite(Number(selected.lat)) && Number.isFinite(Number(selected.lng))) return selected;
    const saved = SE.store && SE.store.prefs ? SE.store.prefs.get("homeCity", null) : null;
    if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) return saved;
    return SE.place && SE.place.defaultPlace ? SE.place.defaultPlace() : {
      lat: 35.6892, lng: 51.389, tz: "Asia/Tehran", city: "تهران", cityEn: "Tehran"
    };
  }
  function recordId(year, month, city) { return "j-" + year + "-" + month + "-" + Number(city.lat).toFixed(3) + "-" + Number(city.lng).toFixed(3); }
  function cityName(city) {
    return SE.place && SE.place.label ? SE.place.label(city, "fa") : (city.city || city.label || "شهر انتخاب‌شده");
  }
  function make(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }
  function buildUI() {
    const view = $("view-archive");
    if (!view || $("monthly-archive-card")) return;
    const card = make("section", "card monthly-archive-card");
    card.id = "monthly-archive-card";
    const heading = make("div", "card-title", "📅 جدول ماهانه اوقات شرعی شهر من");
    const hint = make("p", "hint", "شهر را همین‌جا جستجو و انتخاب کنید؛ جدول با روش محاسبهٔ فعلی برنامه ساخته و فقط روی همین دستگاه ذخیره می‌شود.");
    const cityLabel = make("label", "weekly-field", "شهر محل محاسبه");
    const cityInput = make("input");
    cityInput.id = "monthly-archive-city";
    cityInput.type = "search";
    cityInput.autocomplete = "off";
    cityInput.placeholder = "نام شهر را جستجو کنید؛ مثلاً مشهد یا Berlin";
    const citySuggest = make("div", "monthly-archive-city-suggest");
    citySuggest.id = "monthly-archive-city-suggest";
    citySuggest.hidden = true;
    citySuggest.setAttribute("role", "listbox");
    cityLabel.append(cityInput, citySuggest);
    const coordLabel = make("label", "weekly-field", "یا مختصات دقیق هر نقطه از جهان (عرض جغرافیایی، طول جغرافیایی)");
    const coordRow = make("div", "monthly-archive-controls");
    const coordInput = make("input");
    coordInput.id = "monthly-archive-coordinates";
    coordInput.type = "text";
    coordInput.inputMode = "decimal";
    coordInput.placeholder = "مثلاً 52.5200, 13.4050";
    const coordButton = make("button", "ghost", "انتخاب این مختصات");
    coordButton.type = "button";
    coordRow.append(coordInput, coordButton);
    coordLabel.appendChild(coordRow);
    const controls = make("div", "monthly-archive-controls");
    const monthLabel = make("label", "weekly-field", "ماه شمسی");
    const month = make("select");
    month.id = "monthly-archive-month";
    monthNames.forEach((name, index) => {
      const option = make("option", "", name);
      option.value = String(index + 1);
      month.appendChild(option);
    });
    monthLabel.appendChild(month);
    const yearLabel = make("label", "weekly-field", "سال شمسی");
    const year = make("input");
    year.id = "monthly-archive-year";
    year.type = "number";
    year.min = "1200";
    year.max = "1600";
    yearLabel.appendChild(year);
    controls.append(monthLabel, yearLabel);
    const actions = make("div", "monthly-archive-actions");
    const generate = make("button", "primary", "ساخت و ذخیرهٔ جدول");
    generate.type = "button";
    generate.id = "monthly-archive-generate";
    const print = make("button", "ghost", "چاپ / ذخیره PDF");
    print.type = "button";
    print.id = "monthly-archive-print";
    actions.append(generate, print);
    const status = make("p", "hint");
    status.id = "monthly-archive-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const tableWrap = make("div", "monthly-archive-table-wrap");
    tableWrap.id = "monthly-archive-table";
    const savedHeading = make("h3", "", "جدول‌های ذخیره‌شده");
    const savedList = make("div", "monthly-archive-saved-list");
    savedList.id = "monthly-archive-saved-list";
    card.append(heading, hint, cityLabel, coordLabel, controls, actions, status, tableWrap, savedHeading, savedList);
    const archiveList = $("archive-list");
    view.insertBefore(card, archiveList || view.firstChild);

    const style = document.createElement("style");
    style.textContent = [
      ".monthly-archive-city-suggest{display:grid;gap:4px;max-height:220px;overflow:auto;margin-top:5px;border:1px solid var(--line,#dce2e8);border-radius:10px;background:var(--surface,#fff)}",
      ".monthly-archive-city-suggest button{padding:10px;border:0;border-bottom:1px solid var(--line,#e6e9ed);background:transparent;text-align:start;color:inherit;font:inherit}",
      ".monthly-archive-controls{display:flex;gap:12px;align-items:end;flex-wrap:wrap}",
      ".monthly-archive-controls label{flex:1;min-width:130px}",
      ".monthly-archive-controls select,.monthly-archive-controls input{width:100%;min-height:42px;border:1px solid var(--line,#dce2e8);border-radius:10px;padding:8px;background:var(--surface,#fff);font:inherit}",
      ".monthly-archive-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}",
      ".monthly-archive-actions button{flex:1;min-width:145px}",
      ".monthly-archive-table-wrap{overflow-x:auto;margin-top:14px}",
      ".monthly-archive-table{width:100%;border-collapse:collapse;min-width:650px;font-size:.82rem}",
      ".monthly-archive-table th,.monthly-archive-table td{padding:9px 7px;border-bottom:1px solid var(--line,#e6e9ed);text-align:center;white-space:nowrap}",
      ".monthly-archive-table th{background:var(--soft,#f4f7f8);font-weight:700}",
      ".monthly-archive-saved-list{display:grid;gap:8px;margin-top:10px}",
      ".monthly-archive-saved-item{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px;border:1px solid var(--line,#e6e9ed);border-radius:12px}",
      ".monthly-archive-saved-item button{border:0;background:transparent;color:var(--brand,#176348);font:inherit;text-align:start}",
      ".monthly-archive-card h3{font-size:.95rem;margin:18px 0 8px}",
      "@media print{body *{visibility:hidden!important}#monthly-archive-table,#monthly-archive-table *{visibility:visible!important}#monthly-archive-table{position:absolute;inset:0;width:100%}.monthly-archive-table{min-width:0;font-size:9pt}}"
    ].join("");
    document.head.appendChild(style);

    const today = SE.dates && SE.dates.today ? SE.dates.today().jalali : { year: new Date().getFullYear(), month: new Date().getMonth()+1 };
    month.value = String(today.month);
    year.value = String(today.year);
    const initialCity = getHomeCity();
    cityInput.value = cityName(initialCity);
    coordInput.value = Number(initialCity.lat).toFixed(4) + ", " + Number(initialCity.lng).toFixed(4);
    let citySearchController = null;
    coordButton.addEventListener("click", () => {
      const match = coordInput.value.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,، ]\s*(-?\d+(?:\.\d+)?)$/);
      if (!match) {
        status.textContent = "مختصات را به شکل عرض جغرافیایی، طول جغرافیایی وارد کنید؛ مانند 52.5200, 13.4050";
        return;
      }
      const lat = Number(match[1]), lng = Number(match[2]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        status.textContent = "مختصات معتبر نیست؛ عرض باید بین ۹۰- تا ۹۰ و طول بین ۱۸۰- تا ۱۸۰ باشد.";
        return;
      }
      const chosen = SE.place.fromCoords(lat, lng, { source: "archive-coordinates" });
      if (SE.setSelectedCity) SE.setSelectedCity(chosen);
      else {
        SE.selectedCity = chosen;
        if (SE.store && SE.store.prefs) SE.store.prefs.set("homeCity", chosen);
      }
      cityInput.value = cityName(chosen);
      coordInput.value = lat.toFixed(5) + ", " + lng.toFixed(5);
      citySuggest.hidden = true;
      generateMonth(false);
    });
    cityInput.addEventListener("input", () => {
      const query = cityInput.value.trim();
      if (citySearchController) citySearchController.abort();
      citySuggest.replaceChildren();
      if (query.length < 2) { citySuggest.hidden = true; return; }
      const localHits = SE.place && SE.place.search ? SE.place.search(query, 30) : [];
      const hits = localHits.slice();
      const renderHits = () => {
        citySuggest.replaceChildren();
        hits.slice(0, 30).forEach(place => {
          const option = make("button", "", cityName(place));
          option.type = "button";
          option.setAttribute("role", "option");
          option.addEventListener("click", () => {
            const chosen = SE.place.fromCoords(Number(place.lat), Number(place.lng), {
              source: place.source || "archive-search",
              tz: place.tz || null,
              label: place.label || [place.city || place.name, place.countryName || place.country].filter(Boolean).join("، ")
            });
            if (place.city || place.name) {
              chosen.city = place.city || place.name;
              chosen.cityEn = place.cityEn || place.name || place.city;
            }
            if (place.country) chosen.country = place.country;
            if (place.countryName) chosen.countryName = place.countryName;
            if (SE.setSelectedCity) SE.setSelectedCity(chosen);
            else {
              SE.selectedCity = chosen;
              if (SE.store && SE.store.prefs) SE.store.prefs.set("homeCity", chosen);
            }
            cityInput.value = cityName(chosen);
            citySuggest.hidden = true;
            generateMonth(false);
          });
          citySuggest.appendChild(option);
        });
        citySuggest.hidden = hits.length === 0;
      };
      renderHits();
      citySearchController = new AbortController();
      fetch("https://photon.komoot.io/api/?q=" + encodeURIComponent(query) + "&limit=30&lang=fa", {
        signal:citySearchController.signal, headers:{Accept:"application/json"}
      }).then(response => response.ok ? response.json() : null).then(data => {
        if (!data || cityInput.value.trim() !== query) return;
        const seen = new Set(hits.map(p => Number(p.lat).toFixed(3) + "," + Number(p.lng).toFixed(3)));
        (data.features || []).forEach(feature => {
          const props = feature.properties || {}, coords = feature.geometry && feature.geometry.coordinates || [];
          const lng = Number(coords[0]), lat = Number(coords[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const key = lat.toFixed(3) + "," + lng.toFixed(3);
          if (seen.has(key)) return;
          seen.add(key);
          const city = props.city || props.name || props.locality || props.district || props.state || "مکان انتخاب‌شده";
          hits.push({lat,lng,city,cityEn:props.name || city,country:props.countrycode || null,countryName:props.country || "",tz:SE.place.detectTimezone(lat,lng),label:[city,props.state,props.country].filter(Boolean).join("، "),source:"archive-geocoder"});
        });
        renderHits();
      }).catch(error => { if (error.name !== "AbortError") console.warn("Archive city search failed", error); });
    });
    cityInput.addEventListener("keydown", event => {
      if (event.key === "Escape") citySuggest.hidden = true;
      if (event.key === "Enter") {
        const first = citySuggest.querySelector("button");
        if (first) { event.preventDefault(); first.click(); }
      }
    });
    generate.addEventListener("click", () => generateMonth(false));
    print.addEventListener("click", () => {
      if (!tableWrap.querySelector("table")) {
        status.textContent = "ابتدا جدول ماه را بسازید.";
        return;
      }
      window.print();
    });
    renderSaved();
    const city = getHomeCity();
    if (!readArchive().some(item => item.id === recordId(today.year, today.month, city))) generateMonth(true);
  }
  function renderTable(record) {
    const wrap = $("monthly-archive-table");
    if (!wrap) return;
    wrap.replaceChildren();
    wrap.dataset.recordId = record.id;
    const caption = make("p", "hint", record.city + " · " + monthNames[record.month - 1] + " " + fa(record.year) + " · روش محاسبه: " + record.method);
    const table = make("table", "monthly-archive-table");
    const thead = document.createElement("thead");
    const header = document.createElement("tr");
    ["تاریخ","روز هفته","اذان صبح","طلوع آفتاب","اذان ظهر","اذان عصر","اذان مغرب","اذان عشا"].forEach(label => header.appendChild(make("th","",label)));
    thead.appendChild(header);
    const tbody = document.createElement("tbody");
    record.rows.forEach(row => {
      const gDate = SE.jalali.jToG(record.year, record.month, Number(row[0]));
      const weekday = SE.dates.formatWeekday(new Date(gDate.year, gDate.month - 1, gDate.day).getDay(), "fa");
      const tr = document.createElement("tr");
      [row[0], weekday, row[2], row[3], row[4], row[5], row[6], row[8]].forEach(value => tr.appendChild(make("td","",fa(value))));
      tbody.appendChild(tr);
    });
    table.append(thead, tbody);
    wrap.append(caption, table);
  }
  function renderSaved() {
    const list = $("monthly-archive-saved-list");
    if (!list) return;
    list.replaceChildren();
    const records = readArchive();
    const empty = $("archive-empty");
    if (empty) empty.hidden = records.length > 0;
    const count = $("archive-count");
    if (count) count.textContent = records.length ? fa(records.length) + " جدول ذخیره‌شده" : "";
    if (!records.length) {
      list.appendChild(make("p", "hint", "هنوز جدولی در بایگانی ذخیره نشده است."));
      return;
    }
    records.forEach(record => {
      const item = make("div", "monthly-archive-saved-item");
      const label = make("span", "", record.city + " · " + monthNames[record.month - 1] + " " + fa(record.year));
      const open = make("button", "", "مشاهده");
      open.type = "button";
      open.addEventListener("click", () => {
        $("monthly-archive-month").value = String(record.month);
        $("monthly-archive-year").value = String(record.year);
        renderTable(record);
        $("monthly-archive-status").textContent = "جدول ذخیره‌شده از بایگانی باز شد.";
      });
      item.append(label, open);
      list.appendChild(item);
    });
  }
  function generateMonth(silent) {
    const status = $("monthly-archive-status");
    try {
      const year = Number($("monthly-archive-year").value);
      const month = Number($("monthly-archive-month").value);
      if (!Number.isInteger(year) || year < 1200 || year > 1600 || month < 1 || month > 12) throw new Error("سال یا ماه واردشده معتبر نیست.");
      const city = getHomeCity();
      const method = SE.methods && SE.methods.getCurrentMethod ? SE.methods.getCurrentMethod() : "legacy";
      if (!SE.locationBridge || !SE.locationBridge.monthRows) throw new Error("موتور ساخت جدول در دسترس نیست.");
      const rows = SE.locationBridge.monthRows(city, year, month, "j", method);
      const record = {
        id: recordId(year, month, city),
        year, month, city: cityName(city), place: { lat: Number(city.lat), lng: Number(city.lng), tz: city.tz || "Asia/Tehran", city: city.city || city.name || "" },
        method, rows, createdAt: Date.now()
      };
      const records = readArchive().filter(item => item.id !== record.id);
      records.unshift(record);
      if (!writeArchive(records)) throw new Error("ذخیره‌سازی در حافظهٔ دستگاه ممکن نشد.");
      renderTable(record);
      renderSaved();
      if (status) status.textContent = (silent ? "جدول ماه جاری به‌صورت خودکار در بایگانی ذخیره شد: " : "جدول ساخته و در بایگانی ذخیره شد: ") + record.city;
    } catch (error) {
      if (status) status.textContent = error.message || "ساخت جدول انجام نشد.";
    }
  }
  function init() {
    buildUI();
    const archiveTab = document.querySelector('.tabbar a[data-tab="archive"]');
    if (archiveTab) archiveTab.addEventListener("click", () => {
      setTimeout(() => {
        const today = SE.dates.today().jalali;
        const city = getHomeCity();
        const currentId = recordId(today.year, today.month, city);
        if (!$("monthly-archive-table").querySelector("table") || $("monthly-archive-table").dataset.recordId !== currentId) {
          $("monthly-archive-month").value = String(today.month);
          $("monthly-archive-year").value = String(today.year);
          if (!readArchive().some(item => item.id === currentId)) generateMonth(true);
          else renderTable(readArchive().find(item => item.id === currentId));
        }
      }, 0);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
