const test = require("node:test");
const assert = require("node:assert/strict");

global.SE = {
  store: { prefs: { get(key, fallback) {
    if (key === "alarms") return { fajr: true, sunrise: false, dhuhr: false, asr: false, maghrib: false, isha: false, night1: false, night2: false };
    return fallback;
  }, set() {} } },
  platform: { isNative: () => false }
};

require("../www/js/sabt-reminder.js");
const alarms = require("../www/js/alarms.js");

function localParts(timestamp, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, calendar: "gregory", numberingSystem: "latn",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date(timestamp));
  const value = type => parts.find(part => part.type === type).value;
  return [value("year"), value("month"), value("day"), value("hour"), value("minute")];
}

test("prayer alarm uses the selected city's wall-clock time", () => {
  const row = [3, "06:12", "06:12"];
  const notifications = alarms.buildNotifications(
    row, "Berlin", "en", 3, new Date(Date.UTC(2099, 0, 3)), "Europe/Berlin"
  );
  assert.equal(notifications.length, 1);
  assert.deepEqual(localParts(notifications[0].schedule.at.getTime(), "Europe/Berlin"),
    ["2099", "01", "03", "06", "12"]);
});

test("prayer alarm rejects malformed or out-of-range times", () => {
  for (const value of ["24:00", "12:60", "6:1", "noon"]) {
    const row = [3, "06:12", value];
    assert.deepEqual(alarms.buildNotifications(
      row, "Berlin", "en", 3, new Date(Date.UTC(2099, 0, 3)), "Europe/Berlin"
    ), []);
  }
});

test("prayer alarm resolves a DST-gap wall time consistently with city time", () => {
  const row = [31, "02:30", "02:30"];
  const notifications = alarms.buildNotifications(
    row, "Berlin", "en", 31, new Date(Date.UTC(2024, 2, 31)), "Europe/Berlin"
  );
  assert.equal(notifications.length, 1);
  assert.deepEqual(localParts(notifications[0].schedule.at.getTime(), "Europe/Berlin"),
    ["2024", "03", "31", "03", "30"]);
});
