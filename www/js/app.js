(async function () {
  "use strict";
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = false;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("load failed: " + src)); };
      document.head.appendChild(s);
    });
  }
  try {
    try { await loadScript("js/archive-autosave.js"); } catch (e) { console.warn(e); }
    try { await loadScript("js/move-reminder.js"); } catch (e) { console.warn(e); }
    var urls = [
      "https://cdn.jsdelivr.net/gh/shahramnaderian/yom-time@3945235025abaedaad1b113562a77e8517c06f86/www/js/app.js",
      "https://raw.githubusercontent.com/shahramnaderian/yom-time/3945235025abaedaad1b113562a77e8517c06f86/www/js/app.js"
    ];
    var text = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (res.ok) { text = await res.text(); break; }
      } catch (_) {}
    }
    if (!text) throw new Error("failed to load app.js from archive commit");
    var needle = 'toast(lang() === "en" ? `Built ${rows.length} days` : `جدول ${rows.length} روز ساخته شد`);';
    var replacement = [
      "let archived = false;",
      "        try {",
      "          if (SE.monthlyArchive && SE.monthlyArchive.saveFromCreate) {",
      "            SE.monthlyArchive.saveFromCreate(state.city, state.year, state.month, rows, method);",
      "            archived = true;",
      "          }",
      "        } catch (archiveErr) { console.warn(\"Archive save failed\", archiveErr); }",
      "        toast(",
      "          lang() === \"en\"",
      "            ? (archived ? `Built ${rows.length} days · saved to archive` : `Built ${rows.length} days`)",
      "            : (archived ? `جدول ${rows.length} روز ساخته و در بایگانی ذخیره شد` : `جدول ${rows.length} روز ساخته شد`)",
      "        );"
    ].join("\n");
    if (text.indexOf(needle) !== -1) text = text.split(needle).join(replacement);
    else console.warn("Yom Time: autosave patch point not found; loading original app.js");
    (0, eval)(text);
    try { await loadScript("js/qibla.js"); } catch (qe) { console.warn(qe); }
    try { await loadScript("js/qibla-shell.js"); } catch (qe2) { console.warn(qe2); }
  } catch (e) {
    console.error("Yom Time app bootstrap failed", e);
  }
})();
