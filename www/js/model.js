(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  if (!SE.i18n && typeof module !== "undefined" && typeof require === "function") require("./i18n.js");
  const I = () => SE.i18n;
  const FOOTNOTE = I().D.fa.foot;
  function titleFor(place, year, month, lang, cal) {
    lang = lang || "fa";
    cal = cal || I().calOf(lang);
    return I().t(lang === "en" && cal === "j" ? "title_tpl_j" : "title_tpl", { month: I().monthTitle(month, cal, lang), year: I().num(year, lang), place }, lang);
  }
  function build(place, year, month, rawRows, lang, cal) {
    lang = lang === "en" ? "en" : "fa";
    cal = cal || I().calOf(lang);
    const season = SE.seasons ? SE.seasons.ofMonth(month, cal) : null;
    return {
      title: titleFor(place, year, month, lang, cal),
      footnote: I().t("foot", null, lang),
      lang,
      rtl: lang === "fa",
      season: season ? season.id : "autumn",
      palette: season ? season.palette : void 0,
      sheetName: I().t("sheet_name", null, lang),
      heads: SE.formulas.COLUMNS.map((c) => lang === "en" && c.headEn ? c.headEn : c.head),
      rows: rawRows.map((r) => r.map((v, i) => i === 0 ? String(v) : SE.formulas.formatCell(v, lang)))
    };
  }
  SE.model = { build, titleFor, FOOTNOTE };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.model;
})(typeof globalThis !== "undefined" ? globalThis : this);
