(function(g){
"use strict";
const SE=g.SE=g.SE||{};
const KEY="worshipTrackerDaily";
const PRAYERS=["fajr","dhuhr","asr","maghrib","isha"];
const LABELS={fajr:"صبح",dhuhr:"ظهر",asr:"عصر",maghrib:"مغرب",isha:"عشا"};
const $=id=>g.document&&g.document.getElementById(id);
function dateKey(date){const d=date instanceof Date?date:new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function validRecord(value){const r=value&&typeof value==="object"?value:{};const prayers={};PRAYERS.forEach(k=>prayers[k]=!!(r.prayers&&r.prayers[k]));return {prayers,quranPages:clampInt(r.quranPages,0,1000),dhikrCount:clampInt(r.dhikrCount,0,1000000)};}
function clampInt(v,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):0;}
function readAll(){try{const v=SE.store&&SE.store.prefs?SE.store.prefs.get(KEY,{}):{};return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch(e){return {}}}
function loadDay(key){return validRecord(readAll()[key]);}
function saveDay(key,record){if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return false;const all=readAll();all[key]=validRecord(record);if(SE.store&&SE.store.prefs)SE.store.prefs.set(KEY,all);return true;}
function summarize(records,dates){let prayersDone=0,quranPages=0,dhikrCount=0,daysWithActivity=0;dates.forEach(key=>{const r=validRecord(records[key]);const done=PRAYERS.filter(k=>r.prayers[k]).length;prayersDone+=done;quranPages+=r.quranPages;dhikrCount+=r.dhikrCount;if(done||r.quranPages||r.dhikrCount)daysWithActivity++;});return {days:dates.length,prayersDone,prayersTotal:dates.length*PRAYERS.length,quranPages,dhikrCount,daysWithActivity};}
function lastSevenKeys(today){const base=today instanceof Date?today:new Date(today);const out=[];for(let i=6;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()-i,12);out.push(dateKey(d));}return out;}
function init(){
 const root=$("view-worship");if(!root||root.dataset.initialized)return;root.dataset.initialized="1";
 const date=$("worship-date"),prayerBox=$("worship-prayers"),pages=$("worship-quran-pages"),dhikr=$("worship-dhikr-count"),report=$("worship-weekly-report"),status=$("worship-status");
 if(!date||!prayerBox||!pages||!dhikr||!report)return;
 const today=new Date();date.value=dateKey(today);
 prayerBox.innerHTML=PRAYERS.map(k=>'<label class="worship-prayer"><input type="checkbox" data-prayer="'+k+'"><span>'+LABELS[k]+'</span></label>').join("");
 function renderReport(){
  const keys=lastSevenKeys(new Date()),summary=summarize(readAll(),keys);
  const percent=Math.round(summary.prayersDone/summary.prayersTotal*100);
  report.innerHTML='<div class="worship-report-grid"><div><strong>'+summary.prayersDone+'/'+summary.prayersTotal+'</strong><span>نمازهای ثبت‌شده</span></div><div><strong>'+summary.quranPages+'</strong><span>صفحه قرآن</span></div><div><strong>'+summary.dhikrCount.toLocaleString("fa-IR")+'</strong><span>ذکر ثبت‌شده</span></div><div><strong>'+summary.daysWithActivity+'/7</strong><span>روزهای دارای فعالیت</span></div></div><div class="worship-progress"><span style="width:'+percent+'%"></span></div><small>درصد نمازهای ثبت‌شده در هفت روز اخیر: '+percent+'٪</small>';
 }
 function renderDay(){
  const r=loadDay(date.value||dateKey(new Date()));
  prayerBox.querySelectorAll("[data-prayer]").forEach(el=>el.checked=!!r.prayers[el.dataset.prayer]);
  pages.value=String(r.quranPages);dhikr.value=String(r.dhikrCount);
  if(status)status.textContent="اطلاعات این روز به‌صورت خودکار روی همین دستگاه ذخیره می‌شود.";
 }
 function persist(){
  const r={prayers:{},quranPages:pages.value,dhikrCount:dhikr.value};
  prayerBox.querySelectorAll("[data-prayer]").forEach(el=>r.prayers[el.dataset.prayer]=el.checked);
  saveDay(date.value||dateKey(new Date()),r);renderReport();
  if(status)status.textContent="ثبت شد ✓";
 }
 prayerBox.addEventListener("change",persist);pages.addEventListener("change",persist);dhikr.addEventListener("change",persist);
 date.addEventListener("change",renderDay);
 renderDay();renderReport();
}
SE.worshipTracker={PRAYERS,dateKey,validRecord,loadDay,saveDay,summarize,lastSevenKeys,init};
if(typeof module!=="undefined"&&module.exports)module.exports=SE.worshipTracker;
})(typeof globalThis!=="undefined"?globalThis:this);
