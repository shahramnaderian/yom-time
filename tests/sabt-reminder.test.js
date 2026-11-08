const test = require("node:test");
const assert = require("node:assert/strict");

global.SE = {
  store: {
    prefs: {
      value: {},
      get(key, fallback) { return this.value[key] || fallback; },
      set(key, value) { this.value[key] = value; }
    }
  },
  notify: {
    async ensurePermission() { return "granted"; },
    plugin() { return global.__notificationPlugin; },
    async show() {}
  },
  platform: { isNative: () => true }
};

const reminder = require("../www/js/sabt-reminder.js");

test("builds a Saturday reminder at the exact dayStart time", () => {
  const rows = [[3, "06:12"], [4, "06:14"], [10, "06:10"]];
  const entries = reminder.buildSaturdayEntries(rows, {
    year: 2099, month: 1, calendar: "g"
  });
  assert.equal(entries.length, 2);
  assert.equal(entries[0].key, "2099-01-03");
  assert.equal(entries[0].hour, 6);
  assert.equal(entries[0].minute, 12);
  assert.equal(new Date(entries[0].at).getHours(), 6);
  assert.equal(new Date(entries[0].at).getMinutes(), 12);
  assert.equal(entries[1].key, "2099-01-10");
});

test("ignores invalid times and non-Saturday rows", () => {
  const entries = reminder.buildSaturdayEntries(
    [[3, "24:00"], [4, "06:15"], [10, "06:60"], [18, "06:20"]],
    { year: 2099, month: 1, calendar: "g" }
  );
  assert.deepEqual(entries, []);
});

test("converts Jalali rows through the application's calendar converter", () => {
  const original = global.SE.jalali;
  global.SE.jalali = {
    jalaliToGregorian(year, month, day) {
      assert.deepEqual([year, month, day], [1405, 8, 17]);
      return { year: 2026, month: 11, day: 7 };
    }
  };
  try {
    const entries = reminder.buildSaturdayEntries([[17, "05:48"]], {
      year: 1405, month: 8, calendar: "j"
    });
    assert.equal(entries.length, 1);
    assert.equal(entries[0].key, "2026-11-07");
    assert.equal(entries[0].hour, 5);
    assert.equal(entries[0].minute, 48);
  } finally {
    global.SE.jalali = original;
  }
});

test("schedules native local notifications using table-derived time", async () => {
  let scheduled = [];
  global.__notificationPlugin = {
    async cancel() {},
    async schedule(payload) { scheduled = payload.notifications; }
  };
  reminder.setSettings({ enabled: true, upcoming: [], scheduledIds: [] });
  const result = await reminder.scheduleFromMonth([[3, "07:23"]], {
    year: 2099, month: 1, calendar: "g", lang: "fa"
  });
  assert.equal(result.ok, true);
  assert.equal(result.method, "native");
  assert.equal(result.count, 1);
  assert.equal(scheduled.length, 1);
  assert.equal(scheduled[0].schedule.at.getFullYear(), 2099);
  assert.equal(scheduled[0].schedule.at.getMonth(), 0);
  assert.equal(scheduled[0].schedule.at.getDate(), 3);
  assert.equal(scheduled[0].schedule.at.getHours(), 7);
  assert.equal(scheduled[0].schedule.at.getMinutes(), 23);
  assert.equal(scheduled[0].extra.dayStart, "07:23");
});

test("converts selected-city wall time to the correct instant independent of device time zone", () => {
  const entries = reminder.buildSaturdayEntries([[3, "06:12"]], {
    year: 2099, month: 1, calendar: "g", timeZone: "Asia/Tehran"
  });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].key, "2099-01-03");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).formatToParts(new Date(entries[0].at));
  const value = type => parts.find(part => part.type === type).value;
  assert.deepEqual(
    [value("year"), value("month"), value("day"), value("hour"), value("minute")],
    ["2099", "01", "03", "06", "12"]
  );
});

test("resolves a nonexistent spring-forward wall time by moving forward through the DST gap", () => {
  const at = reminder.localDateTimeToTimestamp(2024, 3, 31, 2, 30, "Europe/Berlin");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).formatToParts(new Date(at));
  const value = type => parts.find(part => part.type === type).value;
  assert.deepEqual(
    [value("year"), value("month"), value("day"), value("hour"), value("minute")],
    ["2024", "03", "31", "03", "30"]
  );
});

test("chooses the earlier occurrence for an ambiguous fall-back wall time", () => {
  const at = reminder.localDateTimeToTimestamp(2024, 10, 27, 2, 30, "Europe/Berlin");
  assert.equal(at, Date.UTC(2024, 9, 27, 0, 30));
});
