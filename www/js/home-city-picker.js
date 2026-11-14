(function () {
  "use strict";
  function init() {
    var input = document.getElementById("home-city-search");
    var results = document.getElementById("home-city-results");
    var label = document.getElementById("home-city-label");
    var apply = document.getElementById("home-city-apply");
    if (!input || !results || !window.SE || !SE.place) return;
    var chosen = null;
    var saved = SE.cityPersist && SE.cityPersist.load ? SE.cityPersist.load() :
      (SE.store && SE.store.prefs ? SE.store.prefs.get("homeCity", null) : null);
    if (saved) {
      label.textContent = "شهر فعلی: " + (SE.place.label ? SE.place.label(saved, "fa") : (saved.city || "انتخاب‌شده"));
      input.value = saved.city || saved.cityEn || "";
    }
    function render(items) {
      results.replaceChildren();
      items.forEach(function (city) {
        var button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "option");
        button.textContent = (city.city || city.cityEn || "شهر") +
          (city.countryName ? " · " + city.countryName : "");
        button.addEventListener("click", function () {
          chosen = city;
          input.value = city.city || city.cityEn || "";
          results.hidden = true;
          label.textContent = "انتخاب‌شده: " + (SE.place.label ? SE.place.label(city, "fa") : input.value);
        });
        results.appendChild(button);
      });
      results.hidden = items.length === 0;
    }
    input.addEventListener("input", function () {
      chosen = null;
      var q = input.value.trim();
      if (q.length < 2) { results.hidden = true; return; }
      render(SE.place.search(q, 20));
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        var first = results.querySelector("button");
        if (first) first.click();
      }
      if (event.key === "Escape") results.hidden = true;
    });
    apply.addEventListener("click", function () {
      if (!chosen) {
        label.textContent = "ابتدا یک شهر از فهرست نتایج انتخاب کنید.";
        return;
      }
      var city = Object.assign({}, chosen, { source: "user" });
      if (SE.cityPersist && SE.cityPersist.save) SE.cityPersist.save(city);
      else if (SE.store && SE.store.prefs) SE.store.prefs.set("homeCity", city);
      label.textContent = "شهر ذخیره شد؛ در حال به‌روزرسانی اوقات شرعی…";
      window.location.reload();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();