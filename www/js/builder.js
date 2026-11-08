(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  function cityTitle(rec, lang, withCountry) {
    const isFa = lang !== "en";
    const name = isFa ? (rec.city || rec.cityEn) : (rec.cityEn || rec.city);
    if (!withCountry) return name || "";
    const cn = isFa ? (rec.countryName || rec.country) : (rec.country || rec.countryName);
    return cn ? name + (isFa ? "، " : ", ") + cn : name;
  }
  function coordText(lat, lng) {
    return Number(lat).toFixed(4) + ", " + Number(lng).toFixed(4);
  }
  async function makeFiles(rec, formats) {
    formats = formats || ["png"];
    const season = SE.seasons.ofMonth(rec.month, rec.cal || "j");
    const lang = rec.lang || "fa";
    if (formats.includes("png") && SE.renderPng) {
      const blob = await SE.renderPng.build(rec, { season, lang });
      rec.files = rec.files || {};
      rec.files.png = { blob, size: blob.size, mime: "image/png" };
    }
    if (formats.includes("pdf") && SE.pdf && SE.renderPng) {
      const canvas = await SE.renderPng.toCanvas(rec, { season, lang });
      const bytes = await SE.pdf.build(canvas, { title: cityTitle(rec, lang, true) });
      rec.files = rec.files || {};
      rec.files.pdf = { blob: new Blob([bytes], { type: "application/pdf" }), size: bytes.length, mime: "application/pdf" };
    }
    if (formats.includes("xlsx") && SE.xlsx) {
      const bytes = SE.xlsx.build(rec, { lang });
      rec.files = rec.files || {};
      rec.files.xlsx = { blob: new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), size: bytes.length, mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
    }
    return rec.files;
  }
  SE.builder = { cityTitle, coordText, makeFiles };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.builder;
})(typeof globalThis !== "undefined" ? globalThis : this);
