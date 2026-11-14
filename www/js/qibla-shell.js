(function () {
  "use strict";
  function ensure() {
    var main = document.querySelector("main");
    if (!document.getElementById("view-qibla") && main) {
      var sec = document.createElement("section");
      sec.id = "view-qibla";
      sec.className = "view";
      sec.hidden = true;
      var settings = document.getElementById("view-settings");
      if (settings) main.insertBefore(sec, settings);
      else main.appendChild(sec);
    }
    var tabbar = document.querySelector(".tabbar");
    if (tabbar && !document.querySelector('.tabbar a[data-tab="qibla"]')) {
      var a = document.createElement("a");
      a.href = "#/qibla";
      a.setAttribute("data-tab", "qibla");
      a.innerHTML = "<span>قبله</span>";
      var st = document.querySelector('.tabbar a[data-tab="settings"]');
      if (st) tabbar.insertBefore(a, st);
      else tabbar.appendChild(a);
    }
    var link = document.querySelector('.tabbar a[data-tab="qibla"]');
    if (link && !link.dataset.qiblaBound) {
      link.dataset.qiblaBound = "1";
      link.addEventListener("click", function (e) {
        e.preventDefault();
        ensure();
        document.querySelectorAll(".view").forEach(function (v) {
          v.hidden = v.id !== "view-qibla";
        });
        document.querySelectorAll(".tabbar a").forEach(function (x) {
          x.classList.toggle("active", x.getAttribute("data-tab") === "qibla");
        });
        location.hash = "#/qibla";
        try { window.dispatchEvent(new Event("hashchange")); } catch (_) {}
        setTimeout(function () {
          if (window.SE && SE.qibla && SE.qibla.render) SE.qibla.render();
        }, 50);
      });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ensure);
  else ensure();
  setTimeout(ensure, 400);
  setTimeout(ensure, 1200);
})();
