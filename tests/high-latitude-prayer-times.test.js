const test = require("node:test");
const assert = require("node:assert/strict");

global.SE = {
  jalali: { daysInMonth: () => 3 },
  methods: {
    buildRowWithMethod(day, _lat, _lng, _year, _month, date) {
      const sunrise = date === 2 ? null : date === 1 ? "06:00" : "06:02";
      return [day, "03:00", "04:00", sunrise, "12:00", "15:00", "18:00", "21:00", "19:00", "22:00", "23:00"];
    }
  }
};

const bridge = require("../www/js/location-bridge.js");

test("missing high-latitude event is estimated and marked", () => {
  const rows = bridge.monthRows({ lat: 69.65, lng: 18.96, tz: "Europe/Oslo" }, 2026, 1, "g", "mwl");
  const row = rows.find(item => item[0] === 2);
  assert.equal(row[3], "06:01");
  assert.deepEqual(row[11], [3]);
});
