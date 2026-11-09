const test = require("node:test");
const assert = require("node:assert/strict");

global.SE = {
  store: { prefs: { get(_key, fallback) { return fallback; }, set() {} } },
  notify: { async ensurePermission() { return "granted"; }, plugin() { return null; } },
  platform: { isNative: () => false },
  sabtReminder: {
    localDateTimeToTimestamp(year, month, day, hour, minute, timeZone) {
      const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone, calendar: "gregory", numberingSystem: "latn",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23"
      });
      const target = Date.UTC(year, month - 1, day, hour, minute);
      const wall = instant => {
        const parts = formatter.formatToParts(new Date(instant));
        const get = type => Number(parts.find(part => part.type === type).value);
        return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
      };
      const offsets = new Set();
      for (let delta = -48; delta <= 48; delta += 6) {
        const instant = target + delta * 3600000;
        offsets.add(wall(instant) - instant);
      }
      const candidates = [...offsets].map(offset => ({ instant: target - offset, wall: wall(target - offset) }));
      const exact = candidates.filter(item => item.wall === target).sort((x, y) => x.instant - y.instant);
      if (exact.length) return exact[0].instant;
      const after = candidates.filter(item => item.wall > target).sort((x, y) => x.wall - y.wall || x.instant - y.instant);
      if (after.length) return after[0].instant;
      throw new RangeError("Cannot resolve local time in " + timeZone);
    }
  }
};

const alarms = require("../www/js/alarms.js");

function wallParts(instant, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, calendar: "gregory", numberingSystem: "latn",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(instant);
  const value = type => parts.find(part => part.type === type).value;
  return ["year", "month", "day", "hour", "minute"].map(value);
}

test("prayer wall time uses selected city timezone, not device timezone", () => {
  const originalNow = Date.now;
  const now = Date.UTC(2026, 0, 1, 0, 0);
  Date.now = () => now;
  try {
    const target = new Date(Date.UTC(2026, 0, 1));
    const at = alarms.timeToDate("12:30", target, false, "Asia/Tehran");
    assert.deepEqual(wallParts(at, "Asia/Tehran"), ["2026", "01", "01", "12", "30"]);
    assert.equal(at.getTime(), Date.UTC(2026, 0, 1, 9, 0));
  } finally {
    Date.now = originalNow;
  }
});

test("city timezone conversion handles DST gaps and ambiguous times", () => {
  const gap = global.SE.sabtReminder.localDateTimeToTimestamp(2024, 3, 31, 2, 30, "Europe/Berlin");
  assert.deepEqual(wallParts(new Date(gap), "Europe/Berlin"), ["2024", "03", "31", "03", "30"]);
  const overlap = global.SE.sabtReminder.localDateTimeToTimestamp(2024, 10, 27, 2, 30, "Europe/Berlin");
  assert.equal(overlap, Date.UTC(2024, 9, 27, 0, 30));
});

test("invalid prayer time strings are ignored", () => {
  assert.equal(alarms.timeToDate("25:00", new Date(Date.UTC(2099, 0, 1)), false, "Asia/Tehran"), null);
  assert.equal(alarms.timeToDate("7:7", new Date(Date.UTC(2099, 0, 1)), false, "Asia/Tehran"), null);
});

test("monthly alarms stop when notification permission or exact-alarm access is unavailable", async () => {
  global.SE.notify.ensurePermission = async () => "exact_alarm_denied";
  const result = await alarms.scheduleForMonth([[1, "", "05:00"]], "Test", "fa", {
    year: 2099, month: 1, calendar: "g", timeZone: "Asia/Tehran"
  });
  assert.deepEqual(result, { ok: false, reason: "exact_alarm_denied" });
});
