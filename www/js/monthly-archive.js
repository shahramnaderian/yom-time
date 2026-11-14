(async function () {
  "use strict";
  try {
    var urls = [
      "https://cdn.jsdelivr.net/gh/shahramnaderian/yom-time@3945235025abaedaad1b113562a77e8517c06f86/www/js/monthly-archive.js",
      "https://raw.githubusercontent.com/shahramnaderian/yom-time/3945235025abaedaad1b113562a77e8517c06f86/www/js/monthly-archive.js"
    ];
    var text = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (res.ok) { text = await res.text(); break; }
      } catch (_) {}
    }
    if (!text) throw new Error("failed to load monthly-archive.js from archive commit");
    (0, eval)(text);
  } catch (e) {
    console.error("Yom Time monthly-archive bootstrap failed", e);
  }
})();
