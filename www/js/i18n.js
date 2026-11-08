(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  let current = "fa";
  const dict = {
    fa: { locate: "موقعیت جغرافیایی من", go: "ثبت درخواست جدول", settings: "تنظیمات", archive: "بایگانی" },
    en: { locate: "My location", go: "Build table", settings: "Settings", archive: "Archive" }
  };
  function t(key) { return (dict[current] && dict[current][key]) || key; }
  function setLang(l) { current = l === "en" ? "en" : "fa"; }
  function monthName(m) {
    if (SE.dates) {
      const arr = current === "en" ? SE.dates.JALALI_MONTHS_EN : SE.dates.JALALI_MONTHS_FA;
      return arr[m - 1] || String(m);
    }
    return String(m);
  }
  SE.i18n = { get lang() { return current; }, t, setLang, monthName };
})(typeof globalThis !== "undefined" ? globalThis : this);
