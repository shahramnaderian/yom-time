const test = require("node:test");
const assert = require("node:assert/strict");
const weekly = require("../www/js/weekly-sessions.js");

test("validates 24-hour meeting times", () => {
  assert.equal(weekly.validTime("09:05"), true);
  assert.equal(weekly.validTime("23:59"), true);
  assert.equal(weekly.validTime("24:00"), false);
  assert.equal(weekly.validTime("9:5"), false);
});

test("finds the next weekly meeting and subtracts reminder lead time", () => {
  const from = new Date(2026, 10, 9, 8, 0, 0);
  const result = weekly.nextOccurrence(1, "09:30", from, 15);
  assert.ok(result);
  assert.equal(result.meeting.getDay(), 1);
  assert.equal(result.meeting.getHours(), 9);
  assert.equal(result.meeting.getMinutes(), 30);
  assert.equal(result.alarm.getTime(), result.meeting.getTime() - 15 * 60000);
});

test("skips a meeting whose reminder time has already passed", () => {
  const from = new Date(2026, 10, 9, 9, 20, 0);
  const result = weekly.nextOccurrence(1, "09:30", from, 15);
  assert.ok(result);
  assert.equal(result.meeting.getDate(), 16);
});

test("rejects invalid day and time values", () => {
  assert.equal(weekly.nextOccurrence(7, "09:00", new Date(), 0), null);
  assert.equal(weekly.nextOccurrence(2, "25:00", new Date(), 0), null);
});
