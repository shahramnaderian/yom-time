(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const SEASONS = {
    spring: {
      id: "spring", themeColor: "#2A8A48",
      palette: { title: "#1F7A3F", head: "#247F42", headText: "#FFFFFF", date: "#1F7A3F", dateText: "#FFFFFF", rowA: "#A3D9B1", rowB: "#D1EED8", text: "#14231A", dash: "#365240" }
    },
    summer: {
      id: "summer", themeColor: "#F2B705",
      palette: { title: "#8A5C00", head: "#F2B705", headText: "#2B2000", date: "#D9A000", dateText: "#2B2000", rowA: "#FBE08A", rowB: "#FDF1C4", text: "#2A2100", dash: "#6B5410" }
    },
    autumn: {
      id: "autumn", themeColor: "#C22928",
      palette: { title: "#C0282D", head: "#C22928", headText: "#FFFFFF", date: "#C52326", dateText: "#FFFFFF", rowA: "#EDA0A0", rowB: "#F6D0CF", text: "#1F1B1B", dash: "#5C3030" }
    },
    winter: {
      id: "winter", themeColor: "#2563B0",
      palette: { title: "#1F5AA6", head: "#2563B0", headText: "#FFFFFF", date: "#1D56A0", dateText: "#FFFFFF", rowA: "#A6C6EE", rowB: "#D5E5F8", text: "#121E2E", dash: "#304A68" }
    }
  };
  function ofMonth(month, cal) {
    const m = Number(month);
    if (cal === "g") {
      if (m >= 3 && m <= 5) return SEASONS.spring;
      if (m >= 6 && m <= 8) return SEASONS.summer;
      if (m >= 9 && m <= 11) return SEASONS.autumn;
      return SEASONS.winter;
    }
    if (m <= 3) return SEASONS.spring;
    if (m <= 6) return SEASONS.summer;
    if (m <= 9) return SEASONS.autumn;
    return SEASONS.winter;
  }
  function luminance(hex) {
    const h = hex.replace("#", "");
    const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function contrast(a, b) {
    const la = luminance(a), lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  SE.seasons = { SEASONS, ofMonth, contrast, ALL: [SEASONS.spring, SEASONS.summer, SEASONS.autumn, SEASONS.winter] };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.seasons;
})(typeof globalThis !== "undefined" ? globalThis : this);
