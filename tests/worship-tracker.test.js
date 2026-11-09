const test=require("node:test");
const assert=require("node:assert/strict");
const tracker=require("../www/js/worship-tracker.js");
test("normalizes daily worship values and prayer flags",()=>{
 const r=tracker.validRecord({prayers:{fajr:1,isha:true},quranPages:-4,dhikrCount:"12.9"});
 assert.equal(r.prayers.fajr,true);assert.equal(r.prayers.isha,true);assert.equal(r.prayers.dhuhr,false);
 assert.equal(r.quranPages,0);assert.equal(r.dhikrCount,12);
});
test("summarizes a seven-day record without counting missing days",()=>{
 const keys=["d1","d2","d3","d4","d5","d6","d7"];
 const s=tracker.summarize({d1:{prayers:{fajr:true,dhuhr:true},quranPages:4,dhikrCount:10},d2:{prayers:{isha:true},quranPages:2,dhikrCount:5}},keys);
 assert.equal(s.prayersDone,3);assert.equal(s.prayersTotal,35);assert.equal(s.quranPages,6);assert.equal(s.dhikrCount,15);assert.equal(s.daysWithActivity,2);
});
test("creates seven consecutive local calendar dates",()=>{
 const keys=tracker.lastSevenKeys(new Date(2026,10,9,12));
 assert.equal(keys.length,7);assert.equal(keys[0],"2026-11-03");assert.equal(keys[6],"2026-11-09");
});
