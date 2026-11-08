(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};

  function toPlace(cityOrCoords) {
    if (!cityOrCoords) return SE.place ? SE.place.defaultPlace() : null;
    if (cityOrCoords.lat != null && cityOrCoords.lng != null) {
      if (SE.place && SE.place.fromCoords) {
        return SE.place.fromCoords(cityOrCoords.lat, cityOrCoords.lng, {
          source: cityOrCoords.loc || cityOrCoords.source || "manual",
          tz: cityOrCoords.tz,
          label: cityOrCoords.name || cityOrCoords.city
        });
      }
      return {
        lat: cityOrCoords.lat,
        lng: cityOrCoords.lng,
        tz: cityOrCoords.tz || "Asia/Tehran",
        city: cityOrCoords.name || cityOrCoords.city,
        cityEn: cityOrCoords.en || cityOrCoords.cityEn
      };
    }
    return null;
  }

  function timesForSelection(city, year, month, day, methodId) {
    const place = toPlace(city);
    if (!place) throw new Error("مکان انتخاب نشده");
    const method = methodId || (SE.methods && SE.methods.getCurrentMethod && SE.methods.getCurrentMethod()) || "tehran";
    if (SE.methods && SE.methods.computeDay) {
      return SE.methods.computeDay(place.lat, place.lng, year, month, day, place.tz || "Asia/Tehran", method);
    }
    if (SE.place && SE.place.timesFor) {
      return SE.place.timesFor(place, year, month, day, method);
    }
    throw new Error("موتور محاسبه در دسترس نیست");
  }

  function monthRows(city, year, month, cal, methodId) {
    const place = toPlace(city);
    if (!place) throw new Error("مکان انتخاب نشده");
    const daysInMonth = SE.jalali && SE.jalali.daysInMonth
      ? SE.jalali.daysInMonth(year, month, cal || "j")
      : (month <= 6 ? 31 : month <= 11 ? 30 : 29);
    const rows = [];
    for (let d = 1; d <= daysInMonth; d++) {
      let gy = year, gm = month, gd = d;
      if ((cal || "j") === "j" && SE.jalali && SE.jalali.jToG) {
        const g = SE.jalali.jToG(year, month, d);
        gy = g.year; gm = g.month; gd = g.day;
      }
      if (SE.methods && SE.methods.buildRowWithMethod) {
        rows.push(SE.methods.buildRowWithMethod(d, place.lat, place.lng, gy, gm, gd, place.tz || "Asia/Tehran", methodId));
      } else {
        const t = timesForSelection(city, gy, gm, gd, methodId);
        rows.push([
          d,
          t.nauticalBegin || t.dayStart,
          t.fajr,
          t.sunrise,
          t.dhuhr || t.solarNoon,
          t.asr,
          t.maghrib || t.sunset,
          t.nauticalEnd,
          t.isha,
          t.night1,
          t.night2
        ]);
      }
    }
    return rows;
  }

  SE.locationBridge = { toPlace, timesForSelection, monthRows };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.locationBridge;
})(typeof globalThis !== "undefined" ? globalThis : this);
