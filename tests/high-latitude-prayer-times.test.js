const test = require("node:test");
const assert = require("node:assert/strict");

global.SE = {
  jalali: { daysInMonth: () => 31 },
  methods: {
    getCurrentMethod: () => "mwl",
    buildRowWithMethod(day, _lat, _lng, year, month, date) {
      const sunrise = date === 15 ? null : date === 14 ? "06:00" : date === 16 ? "06:02" : "06:01";
      return [
        day, "03:00", "04:00", sunrise, "12:00", "15:00",
        "18:00", "21:00", "19:00", "22:00", "23:00"
      ];
    }
  }
};

const bridge = require("../www/js/location-bridge.js");

test("missing event is interpolated from valid days on both sides and marked", () => {
  const rows = bridge.monthRows(
    { lat: 69.65, lng: 18.96, tz: "Europe/Oslo" },
    2026, 1, "g", "mwl"
  );
  const row = rows.find(item => item[0] === 15);
  assert.equal(row[3], "06:01");
  assert.deepEqual(row[11], [3]);
});

test("events without valid bracketing days remain unavailable", () => {
  global.SE.methods.buildRowWithMethod = day => [
    day, null, null, null, "12:00", null, null, null, null, null, null
  ];
  const rows = bridge.monthRows(
    { lat: 89.9, lng: 0, tz: "UTC" },
    2026, 1, "g", "mwl"
  );
  const row = rows.find(item => item[0] === 15);
  assert.equal(row[3], null);
  assert.deepEqual(row[11], []);
});
