(function () {
  "use strict";
  var SE = window.SE = window.SE || {};
  var months = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
  var weekdays = ["شنبه","یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنجشنبه","جمعه"];
  var digits = "۰۱۲۳۴۵۶۷۸۹";
  function fa(value) { return String(value).replace(/\d/g, function (d) { return digits[Number(d)]; }); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function currentJalali() {
    var native = document.getElementById("home-date-native");
    if (native && native.value && SE.jalali && SE.jalali.gToJ) {
      var a = native.value.split("-").map(Number);
      return SE.jalali.gToJ(a[0], a[1], a[2]);
    }
    return SE.jalali && SE.jalali.todayJalali ? SE.jalali.todayJalali() : {year:1405,month:1,day:1};
  }
  function addMonths(date, amount) {
    var total = date.year * 12 + date.month - 1 + amount;
    var year = Math.floor(total / 12), month = total % 12 + 1;
    if (month < 1) { month += 12; year--; }
    var max = SE.jalali.daysInMonth(year, month, "j");
    return {year:year, month:month, day:Math.min(date.day, max)};
  }
  function init() {
    var input = document.getElementById("home-date");
    var native = document.getElementById("home-date-native");
    if (!input || !native || !SE.jalali || !SE.jalali.jToG) return;
    input.dataset.jalaliPickerReady = "1";
    var style = document.createElement("style");
    style.textContent = [
      ".jalali-picker-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(13,28,24,.48);display:flex;align-items:center;justify-content:center;padding:18px}",
      ".jalali-picker{width:min(100%,380px);background:#fff;border-radius:22px;padding:18px;box-shadow:0 18px 60px rgba(0,0,0,.24);color:#263746;font-family:inherit;direction:rtl}",
      ".jalali-picker[hidden],.jalali-picker-backdrop[hidden]{display:none!important}",
      ".jalali-picker-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:16px}",
      ".jalali-picker-title{font-weight:700;color:#176348;text-align:center;flex:1}",
      ".jalali-picker-nav,.jalali-picker-today,.jalali-picker-close{border:0;border-radius:10px;background:#edf4ef;color:#176348;padding:9px 12px;font:inherit;cursor:pointer}",
      ".jalali-picker-week,.jalali-picker-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;text-align:center}",
      ".jalali-picker-week{font-size:.75rem;color:#718092;margin-bottom:8px}",
      ".jalali-picker-day{border:0;border-radius:10px;min-height:40px;background:#f5f7f5;color:#263746;font:inherit;cursor:pointer}",
      ".jalali-picker-day:disabled{visibility:hidden}",
      ".jalali-picker-day.is-selected{background:#176348;color:#fff;font-weight:700}",
      ".jalali-picker-day.is-today{outline:2px solid #d8b85c;outline-offset:-2px}",
      ".jalali-picker-actions{display:flex;justify-content:space-between;gap:8px;margin-top:16px}",
      ".jalali-picker-actions button{font:inherit;cursor:pointer}",
      "@media(max-width:380px){.jalali-picker{padding:13px}.jalali-picker-day{min-height:36px}}"
    ].join("");
    document.head.appendChild(style);

    var backdrop = document.createElement("div");
    backdrop.className = "jalali-picker-backdrop";
    backdrop.hidden = true;
    backdrop.innerHTML = '<section class="jalali-picker" role="dialog" aria-modal="true" aria-label="انتخاب تاریخ شمسی"><div class="jalali-picker-head"><button type="button" class="jalali-picker-nav" data-step="-1" aria-label="ماه قبل">‹</button><div class="jalali-picker-title"></div><button type="button" class="jalali-picker-nav" data-step="1" aria-label="ماه بعد">›</button></div><div class="jalali-picker-week"></div><div class="jalali-picker-days"></div><div class="jalali-picker-actions"><button type="button" class="jalali-picker-today">امروز</button><button type="button" class="jalali-picker-close">بستن</button></div></section>';
    document.body.appendChild(backdrop);
    var title = backdrop.querySelector(".jalali-picker-title");
    var week = backdrop.querySelector(".jalali-picker-week");
    var days = backdrop.querySelector(".jalali-picker-days");
    var shown = currentJalali();
    var selected = currentJalali();
    weekdays.forEach(function (name) {
      var cell = document.createElement("span");
      cell.textContent = name;
      week.appendChild(cell);
    });
    function same(a,b) { return a.year===b.year && a.month===b.month && a.day===b.day; }
    function render() {
      title.textContent = months[shown.month-1] + " " + fa(shown.year);
      days.replaceChildren();
      var first = SE.jalali.jToG(shown.year, shown.month, 1);
      var offset = (new Date(Date.UTC(first.year, first.month-1, first.day)).getUTCDay() + 1) % 7;
      var count = SE.jalali.daysInMonth(shown.year, shown.month, "j");
      for (var i=0; i<offset; i++) {
        var blank = document.createElement("button");
        blank.type = "button"; blank.disabled = true; blank.className = "jalali-picker-day";
        days.appendChild(blank);
      }
      for (var day=1; day<=count; day++) {
        var button = document.createElement("button");
        button.type = "button"; button.className = "jalali-picker-day";
        button.textContent = fa(day);
        var value = {year:shown.year,month:shown.month,day:day};
        if (same(value, selected)) button.classList.add("is-selected");
        if (same(value, currentJalali())) button.classList.add("is-today");
        button.addEventListener("click", function (v) { return function () { choose(v); }; }(value));
        days.appendChild(button);
      }
    }
    function open() {
      selected = currentJalali();
      shown = {year:selected.year,month:selected.month,day:1};
      render();
      backdrop.hidden = false;
      backdrop.querySelector(".jalali-picker-close").focus();
    }
    function close() { backdrop.hidden = true; input.focus(); }
    function choose(value) {
      var g = SE.jalali.jToG(value.year, value.month, value.day);
      native.value = g.year + "-" + pad(g.month) + "-" + pad(g.day);
      selected = value;
      native.dispatchEvent(new Event("change", {bubbles:true}));
      close();
    }
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) close();
      var step = event.target.closest("[data-step]");
      if (step) { shown = addMonths(shown, Number(step.dataset.step)); render(); }
    });
    backdrop.querySelector(".jalali-picker-today").addEventListener("click", function () {
      var todayButton = document.getElementById("home-today");
      if (todayButton) todayButton.click();
      close();
    });
    backdrop.querySelector(".jalali-picker-close").addEventListener("click", close);
    document.addEventListener("keydown", function (event) {
      if (!backdrop.hidden && event.key === "Escape") close();
    });
    input.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open();
    }, true);
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, {once:true});
  else init();
})();