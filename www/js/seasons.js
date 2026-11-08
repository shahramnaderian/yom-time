(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const seasons = {
    spring: { id: "spring", themeColor: "#2E7D32", palette: { primary: "#2E7D32", bg: "#F1F8E9" } },
    summer: { id: "summer", themeColor: "#F57C00", palette: { primary: "#F57C00", bg: "#FFF8E1" } },
    autumn: { id: "autumn", themeColor: "#C22928", palette: { primary: "#C22928", bg: "#FFF7F4" } },
    winter: { id: "winter", themeColor: "#1565C0", palette: { primary: "#1565C0", bg: "#E3F2FD" } }
  };
  function ofMonth(month, cal) {
    // Jalali or Gregorian approximate season mapping
    if (cal === "j") {
      if (month >= 1 && month <= 3) return seasons.spring;
      if (month >= 4 && month <= 6) return seasons.summer;
      if (month >= 7 && month <= 9) return seasons.autumn;
      return seasons.winter;
    }
    if (month >= 3 && month <= 5) return seasons.spring;
    if (month >= 6 && month <= 8) return seasons.summer;
    if (month >= 9 && month <= 11) return seasons.autumn;
    return seasons.winter;
  }
  SE.seasons = { ofMonth, ...seasons };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.seasons;
})(typeof globalThis !== "undefined" ? globalThis : this);
