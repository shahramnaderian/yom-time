(function () {
  "use strict";
  var SE = window.SE = window.SE || {};
  var KEY = "weeklyDayTasks_v1";
  var SLOTS = 3;
  var DAY_ORDER = [6, 0, 1, 2, 3, 4, 5];
  var DAY_FA = {
    0: "یکشنبه",
    1: "دوشنبه",
    2: "سه‌شنبه",
    3: "چهارشنبه",
    4: "پنجشنبه",
    5: "جمعه",
    6: "شنبه"
  };

  function emptyWeek() {
    var o = {};
    for (var d = 0; d <= 6; d++) o[d] = ["", "", ""];
    return o;
  }

  function load() {
    try {
      var raw = SE.store && SE.store.prefs ? SE.store.prefs.get(KEY, null) : null;
      if (!raw) {
        try {
          var s = localStorage.getItem("se_pref_" + KEY);
          if (s) raw = JSON.parse(s);
        } catch (_) {}
      }
      var base = emptyWeek();
      if (!raw || typeof raw !== "object") return base;
      for (var d = 0; d <= 6; d++) {
        var arr = raw[d] || raw[String(d)];
        if (!Array.isArray(arr)) arr = [];
        base[d] = [0, 1, 2].map(function (i) {
          return String(arr[i] == null ? "" : arr[i]).slice(0, 80);
        });
      }
      return base;
    } catch (_) {
      return emptyWeek();
    }
  }

  function save(data) {
    try {
      if (SE.store && SE.store.prefs) SE.store.prefs.set(KEY, data);
      else localStorage.setItem("se_pref_" + KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function ensureStyles() {
    if (document.getElementById("weekly-tasks-style")) return;
    var st = document.createElement("style");
    st.id = "weekly-tasks-style";
    st.textContent = [
      ".weekly-tasks-card{margin-bottom:14px}",
      ".weekly-tasks-intro{font-size:.88rem;color:#657384;margin:0 0 12px;line-height:1.5}",
      ".weekly-tasks-day{display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:14px;background:#fff;border:1px solid #e8eef3;box-shadow:0 1px 4px rgba(0,0,0,.04);margin-bottom:10px}",
      ".weekly-tasks-day.is-today{border-color:#246f9e;box-shadow:0 0 0 2px rgba(36,111,158,.15)}",
      ".weekly-tasks-day-head{display:flex;align-items:center;justify-content:space-between;gap:8px}",
      ".weekly-tasks-day-name{font-weight:700;color:#2B1A1A;font-size:.95rem}",
      ".weekly-tasks-day-badge{font-size:.72rem;color:#246f9e;background:#edf5fa;padding:2px 8px;border-radius:999px}",
      ".weekly-tasks-slots{display:flex;flex-direction:column;gap:6px}",
      ".weekly-tasks-slot{display:flex;align-items:center;gap:8px}",
      ".weekly-tasks-num{width:22px;height:22px;border-radius:50%;background:#edf5fa;color:#246f9e;font-size:.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}",
      ".weekly-tasks-slot input{flex:1;min-height:40px;border:1px solid #dce2e8;border-radius:10px;padding:8px 10px;font:inherit;font-size:.9rem;background:#fafbfc;color:#35495a}",
      ".weekly-tasks-slot input:focus{outline:2px solid #246f9e;outline-offset:1px;background:#fff}",
      ".weekly-tasks-foot{font-size:.8rem;color:#657384;margin-top:10px}"
    ].join("");
    document.head.appendChild(st);
  }

  function faDigits(s) {
    return String(s).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; });
  }

  function render() {
    ensureStyles();
    var view = document.getElementById("view-weekly");
    if (!view) return;

    var card = document.getElementById("weekly-tasks-card");
    if (!card) {
      card = document.createElement("div");
      card.className = "card weekly-tasks-card";
      card.id = "weekly-tasks-card";
      var head = view.querySelector(".settings-head");
      if (head && head.nextSibling) view.insertBefore(card, head.nextSibling);
      else view.insertBefore(card, view.firstChild);
    }

    var data = load();
    var today = new Date().getDay();
    var html = "";
    html += '<div class="card-title"><span class="settings-icon">📋</span> کارهای هفتگی</div>';
    html += '<p class="weekly-tasks-intro">برای هر روز هفته تا ۳ کار ثبت کنید. کارها ذخیره می‌مانند تا خودتان عوضشان کنید.</p>';
    html += '<div class="weekly-tasks-list">';

    DAY_ORDER.forEach(function (day) {
      var isToday = day === today;
      html += '<div class="weekly-tasks-day' + (isToday ? " is-today" : "") + '" data-day="' + day + '">';
      html += '<div class="weekly-tasks-day-head">';
      html += '<span class="weekly-tasks-day-name">' + DAY_FA[day] + "</span>";
      if (isToday) html += '<span class="weekly-tasks-day-badge">امروز</span>';
      html += "</div><div class=\"weekly-tasks-slots\">";
      for (var i = 0; i < SLOTS; i++) {
        var val = data[day][i] || "";
        html += '<div class="weekly-tasks-slot">';
        html += '<span class="weekly-tasks-num">' + faDigits(i + 1) + "</span>";
        html += '<input type="text" maxlength="80" data-day="' + day + '" data-slot="' + i + '" placeholder="کار ' + faDigits(i + 1) + '" value="' +
          String(val).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;") + '">';
        html += "</div>";
      }
      html += "</div></div>";
    });

    html += "</div>";
    html += '<p class="weekly-tasks-foot">تغییرات به‌صورت خودکار ذخیره می‌شوند.</p>';
    card.innerHTML = html;

    card.querySelectorAll("input[data-day]").forEach(function (input) {
      var commit = function () {
        var d = Number(input.getAttribute("data-day"));
        var s = Number(input.getAttribute("data-slot"));
        var cur = load();
        if (!cur[d]) cur[d] = ["", "", ""];
        cur[d][s] = String(input.value || "").trim().slice(0, 80);
        save(cur);
      };
      input.addEventListener("change", commit);
      input.addEventListener("blur", commit);
    });
  }

  function init() {
    render();
    window.addEventListener("hashchange", function () {
      if ((location.hash || "").indexOf("weekly") !== -1) render();
    });
  }

  SE.weeklyTasks = { load: load, save: save, render: render };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
  setTimeout(init, 400);
  setTimeout(init, 1200);
})();
