(function () {
  "use strict";
  function move() {
    var card = document.getElementById("custom-reminder-card");
    var settings = document.getElementById("view-settings");
    if (!card || !settings) return;
    if (settings.contains(card)) return;
    var head = settings.querySelector(".settings-head");
    if (head && head.nextSibling) settings.insertBefore(card, head.nextSibling);
    else settings.insertBefore(card, settings.firstChild || null);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", move);
  else move();
  setTimeout(move, 0);
  setTimeout(move, 400);
})();
