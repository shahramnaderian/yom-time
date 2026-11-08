(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const FORMATS = {
    png: { label: "تصویر", ext: "png", mime: "image/png", icon: "image" },
    pdf: { label: "PDF", ext: "pdf", mime: "application/pdf", icon: "pdf" },
    xlsx: { label: "اکسل", ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", icon: "sheet" }
  };
  const FORMAT_ORDER = ["png", "pdf", "xlsx"];
  const LRE = "\u202A", PDF_ = "\u202C";
  const coordText = (lat, lng) => `${LRE}${Number(lat).toFixed(2)} ${Number(lng).toFixed(2)}${PDF_}`;
  function placeName(rec, lang, withCountry) {
    const en = lang === "en";
    const name = en ? rec.placeEn || rec.cityEn || rec.city : rec.city;
    if (!withCountry || rec.country === "IR") return name;
    const country = en ? SE.i18n.countryEn(rec.country, rec.countryName) : rec.countryName;
    return country ? `${name}${en ? ", " : "، "}${country}` : name;
  }
  function cityTitle(rec, lang, withCountry) {
    lang = lang || rec.lang || "fa";
    if (!rec.exact) return placeName(rec, lang, withCountry !== false);
    return rec.placeless ? coordText(rec.lat, rec.lng) : `${coordText(rec.lat, rec.lng)} (${placeName(rec, lang, withCountry !== false)})`;
  }
  const modelOf = (rec) => SE.model.build(cityTitle(rec), rec.year, rec.month, rec.rows, rec.lang || "fa", rec.cal || "j");
  async function makeFiles(rec, fmts) {
    const model = modelOf(rec);
    await SE.renderPng.ensureFonts();
    const canvas = SE.renderPng.render(model, { scale: 2 });
    rec.files = rec.files || {};
    for (const f of fmts) {
      let blob;
      if (f === "png") blob = await SE.renderPng.toBlob(canvas, "image/png");
      else if (f === "pdf") blob = new Blob([await SE.pdf.build(canvas, { title: model.title })], { type: "application/pdf" });
      else blob = new Blob([SE.xlsx.build(model)], { type: SE.xlsx.MIME });
      rec.files[f] = { blob, size: blob.size };
    }
    if (!rec.thumb) rec.thumb = await SE.renderPng.toBlob(SE.renderPng.thumbnail(canvas, 360), "image/jpeg", 0.85);
    return canvas;
  }
  async function previewBlob(rec) {
    if (rec.files && rec.files.png) return rec.files.png.blob;
    await SE.renderPng.ensureFonts();
    return SE.renderPng.toBlob(SE.renderPng.render(modelOf(rec), { scale: 1.5 }), "image/png");
  }
  SE.builder = { FORMATS, FORMAT_ORDER, makeFiles, previewBlob, modelOf, cityTitle, placeName, coordText };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.builder;
})(typeof globalThis !== "undefined" ? globalThis : this);
