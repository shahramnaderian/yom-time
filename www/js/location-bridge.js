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

  const TIME_COLUMNS = [1, 2, 3, 5, 6, 7, 8, 9, 10];
  const MAX_SEARCH_DAYS = 183;

  function shiftDate(date, offset) {
    const shifted = new Date(Date.UTC(date.year, date.month - 1, date.day + offset));
    return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() };
  }

  function minuteOf(value) {
    if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) return null;
    const parts = value.split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function relativeToNoon(value, noon) {
    const time = minuteOf(value), midday = minuteOf(noon);
    if (time == null || midday == null) return null;
    return ((time - midday + 720 + 1440) % 1440) - 720;
  }

  function formatMinute(value) {
    const minute = ((Math.round(value) % 1440) + 1440) % 1440;
    return String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
  }

  function monthRows(city, year, month, cal, methodId) {
    const place = toPlace(city);
    if (!place) throw new Error("مکان انتخاب نشده");
    const daysInMonth = SE.jalali && SE.jalali.daysInMonth
      ? SE.jalali.daysInMonth(year, month, cal || "j")
      : (month <= 6 ? 31 : month <= 11 ? 30 : 29);
    const rows = [];
    const dateCache = new Map();
    const method = methodId || (SE.methods && SE.methods.getCurrentMethod && SE.methods.getCurrentMethod()) || "tehran";

    function rawRow(date, dayNumber) {
      const key = date.year + "-" + date.month + "-" + date.day;
      if (dateCache.has(key)) return dateCache.get(key);
      let row;
      if (SE.methods && SE.methods.buildRowWithMethod) {
        row = SE.methods.buildRowWithMethod(dayNumber, place.lat, place.lng, date.year, date.month, date.day, place.tz || "Asia/Tehran", method);
      } else {
        const t = timesForSelection(place, date.year, date.month, date.day, method);
        row = [
          dayNumber, t.nauticalBegin || t.dayStart, t.fajr, t.sunrise,
          t.dhuhr || t.solarNoon, t.asr, t.maghrib || t.sunset,
          t.nauticalEnd, t.isha, t.night1, t.night2
        ];
      }
      dateCache.set(key, row);
      return row;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      let date = { year, month, day: d };
      if ((cal || "j") === "j" && SE.jalali && SE.jalali.jToG) {
        const gDate = SE.jalali.jToG(year, month, d);
        date = { year: gDate.year, month: gDate.month, day: gDate.day };
      }
      const row = rawRow(date, d).slice(0, 11);
      const approximated = [];

      TIME_COLUMNS.forEach(column => {
        if (row[column] != null || row[4] == null) return;
        let before = null, after = null;
        for (let distance = 1; distance <= MAX_SEARCH_DAYS && (!before || !after); distance++) {
          if (!before) {
            const candidate = rawRow(shiftDate(date, -distance), d);
            if (candidate[column] != null && candidate[4] != null) before = { row: candidate, distance };
          }
          if (!after) {
            const candidate = rawRow(shiftDate(date, distance), d);
            if (candidate[column] != null && candidate[4] != null) after = { row: candidate, distance };
          }
        }
        if (!before || !after) return;
        const a = relativeToNoon(before.row[column], before.row[4]);
        const b = relativeToNoon(after.row[column], after.row[4]);
        const targetNoon = minuteOf(row[4]);
        if (a == null || b == null || targetNoon == null) return;
        const fraction = before.distance / (before.distance + after.distance);
        row[column] = formatMinute(targetNoon + a + (b - a) * fraction);
        approximated.push(column);
      });

      row[11] = approximated;
      rows.push(row);
    }
    return rows;
  }

  SE.locationBridge = { toPlace, timesForSelection, monthRows };
  if (typeof module !== "undefined" && module.exports) module.exports = SE.locationBridge;
})(typeof globalThis !== "undefined" ? globalThis : this);
