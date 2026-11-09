const test = require("node:test");
const assert = require("node:assert/strict");

const values = {};
global.SE = {
  store: {
    prefs: {
      get(key, fallback) { return Object.hasOwn(values, key) ? values[key] : fallback; },
      set(key, value) { values[key] = value; }
    }
  }
};
const sounds = require("../www/js/sounds.js");

test("four cheerful alarm tones are available as built-in options", () => {
  const ids = sounds.SOUND_OPTIONS.map(option => option.id);
  for (const id of ["happy-chime", "morning-bells", "cheerful-piano", "soft-marimba"]) {
    assert.ok(ids.includes(id), id + " should be selectable");
    assert.ok(sounds.TONES[id].file.endsWith(".wav"));
    assert.ok(sounds.TONES[id].channel.endsWith("-v3"));
  }
});

test("selected cheerful tone maps to its bundled Android notification sound and channel", () => {
  sounds.setSoundPref("happy-chime");
  assert.equal(sounds.soundForNotification("dhuhr"), "alarm_chime.wav");
  assert.equal(sounds.channelForNotification("dhuhr"), "prayer-happy-chime-v3");
});

test("adhan, silent, and invalid sound preferences retain expected behavior", () => {
  sounds.setSoundPref("adhan");
  assert.equal(sounds.soundForNotification("fajr"), "adhan_fajr.mp3");
  assert.equal(sounds.soundForNotification("dhuhr"), "adhan.mp3");
  sounds.setSoundPref("silent");
  assert.equal(sounds.soundForNotification("dhuhr"), null);
  assert.equal(sounds.channelForNotification("dhuhr"), "prayer-silent");
  assert.equal(sounds.setSoundPref("unknown-tone"), false);
});
