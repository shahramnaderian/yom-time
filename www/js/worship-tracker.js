(function(g){
"use strict";
const SE=g.SE=g.SE||{};
const KEY="worshipTrackerDaily";
const PRAYERS=["fajr","dhuhr","asr","maghrib","isha"];
const LABELS={fajr:"صبح",dhuhr:"ظهر",asr:"عصر",maghrib:"مغرب",isha:"عشا"};
const POINTS={prayer:10,quranPage:2,dhikrPerTen:1,allPrayersBonus:20,quranTenPagesBonus:10};
const LEVELS=[{name:"شروع خوب",min:0,icon:"🌱"},{name:"رهرو",min:100,icon:"🌿"},{name:"پرتلاش",min:300,icon:"⭐"},{name:"درخشان",min:700,icon:"🌟"},{name:"قهرمان استمرار",min:1500,icon:"🏆"},{name:"ستارهٔ تابان",min:3000,icon:"👑"}];
const $=id=>g.document&&g.document.getElementById(id);
function dateKey(date){const d=date instanceof Date?date:new Date(date);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
function clampInt(v,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):0;}
function validRecord(value){const r=value&&typeof value==="object"?value:{};const prayers={};PRAYERS.forEach(k=>prayers[k]=!!(r.prayers&&r.prayers[k]));return {prayers,quranPages:clampInt(r.quranPages,0,1000),dhikrCount:clampInt(r.dhikrCount,0,1000000)};}
function readAll(){try{const v=SE.store&&SE.store.prefs?SE.store.prefs.get(KEY,{}):{};return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch(e){return {}}}
function loadDay(key){return validRecord(readAll()[key]);}
function saveDay(key,record){if(!/^\d{4}-\d{2}-\d{2}$/.test(key))return false;const all=readAll();all[key]=validRecord(record);if(SE.store&&SE.store.prefs)SE.store.prefs.set(KEY,all);return true;}
function dailyStars(record){const r=validRecord(record);const done=PRAYERS.filter(k=>r.prayers[k]).length;const quran=Math.min(r.quranPages,50);const dhikr=Math.min(Math.floor(r.dhikrCount/10),100);return done*POINTS.prayer+quran*POINTS.quranPage+dhikr*POINTS.dhikrPerTen+(done===5?POINTS.allPrayersBonus:0)+(r.quranPages>=10?POINTS.quranTenPagesBonus:0);}
function levelForStars(stars){let level=LEVELS[0],next=null;for(let i=0;i<LEVELS.length;i++){if(stars>=LEVELS[i].min)level=LEVELS[i];else{next=LEVELS[i];break;}}return {level,next,progress:next?Math.round((stars-level.min)/(next.min-level.min)*100):100,remaining:next?Math.max(0,next.min-stars):0};}
function summarize(records,dates){let prayersDone=0,quranPages=0,dhikrCount=0,daysWithActivity=0,stars=0;dates.forEach(key=>{const r=validRecord(records[key]);const done=PRAYERS.filter(k=>r.prayers[k]).length;prayersDone+=done;quranPages+=r.quranPages;dhikrCount+=r.dhikrCount;stars+=dailyStars(r);if(done||r.quranPages||r.dhikrCount)daysWithActivity++;});return {days:dates.length,prayersDone,prayersTotal:dates.length*PRAYERS.length,quranPages,dhikrCount,daysWithActivity,stars};}
function lastSevenKeys(today){const base=today instanceof Date?today:new Date(today);const out=[];for(let i=6;i>=0;i--){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()-i,12);out.push(dateKey(d));}return out;}
function currentStreak(records,today){const base=today instanceof Date?today:new Date(today);let streak=0;for(let i=0;i<3660;i++){const d=new Date(base.getFullYear(),base.getMonth(),base.getDate()-i,12);const key=dateKey(d);const r=validRecord(records[key]);const active=PRAYERS.some(k=>r.prayers[k])||r.quranPages>0||r.dhikrCount>0;if(!active){if(i===0)continue;break;}streak++;}return streak;}
function calculateWallet(records,today){const todayKey=dateKey(today||new Date());const keys=Object.keys(records).filter(k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&k<=todayKey);const earned=keys.reduce((sum,k)=>sum+dailyStars(records[k]),0);return {stars:earned,streak:currentStreak(records,today||new Date()),...levelForStars(earned)};}
function init(){
 const root=$("view-worship");if(!root||root.dataset.initialized)return;root.dataset.initialized="1";
 const date=$("worship-date"),prayerBox=$("worship-prayers"),pages=$("worship-quran-pages"),dhikr=$("worship-dhikr-count"),report=$("worship-weekly-report"),status=$("worship-status"),wallet=$("worship-wallet");
 if(!date||!prayerBox||!pages||!dhikr||!report)return;
 const today=new Date();date.value=dateKey(today);date.max=date.value;
 prayerBox.innerHTML=PRAYERS.map(k=>'<label class="worship-prayer"><input type="checkbox" data-prayer="'+k+'"><span>'+LABELS[k]+'</span><small>+۱۰ ⭐</small></label>').join("");
 function renderWallet(){
  if(!wallet)return;const all=readAll(),w=calculateWallet(all,today),next=w.next;
  wallet.innerHTML='<div class="worship-wallet-top"><div><span class="worship-wallet-caption">موجودی ستاره‌های تو</span><strong class="worship-star-count">⭐ '+w.stars.toLocaleString("fa-IR")+'</strong></div><div class="worship-level-icon">'+w.level.icon+'</div></div><div class="worship-level-row"><strong>سطح '+w.level.name+'</strong><span>🔥 '+w.streak.toLocaleString("fa-IR")+' روز پیوسته</span></div>'+(next?'<div class="worship-level-track"><span style="width:'+w.progress+'%"></span></div><small>'+w.remaining.toLocaleString("fa-IR")+' ستاره تا سطح '+next.name+'</small>':'<small>به بالاترین سطح فعلی رسیدی؛ آفرین!</small>');
 }
 function renderReport(){
  const keys=lastSevenKeys(new Date()),summary=summarize(readAll(),keys);
  const percent=Math.round(summary.prayersDone/summary.prayersTotal*100);
  report.innerHTML='<div class="worship-report-grid"><div><strong>'+summary.prayersDone+'/'+summary.prayersTotal+'</strong><span>نمازهای ثبت‌شده</span></div><div><strong>'+summary.quranPages.toLocaleString("fa-IR")+'</strong><span>صفحه قرآن</span></div><div><strong>'+summary.dhikrCount.toLocaleString("fa-IR")+'</strong><span>ذکر ثبت‌شده</span></div><div><strong>⭐ '+summary.stars.toLocaleString("fa-IR")+'</strong><span>ستاره‌های این هفته</span></div></div><div class="worship-progress"><span style="width:'+percent+'%"></span></div><small>درصد نمازهای ثبت‌شده در هفت روز اخیر: '+percent.toLocaleString("fa-IR")+'٪</small>';
 }
 function renderDay(){
  const r=loadDay(date.value||dateKey(new Date()));
  prayerBox.querySelectorAll("[data-prayer]").forEach(el=>el.checked=!!r.prayers[el.dataset.prayer]);
  pages.value=String(r.quranPages);dhikr.value=String(r.dhikrCount);
  if(status)status.textContent="با هر فعالیت ستاره می‌گیری؛ ستاره‌ها بر اساس ثبت‌های واقعی محاسبه می‌شوند.";
 }
 function persist(){
  const r={prayers:{},quranPages:pages.value,dhikrCount:dhikr.value};
  prayerBox.querySelectorAll("[data-prayer]").forEach(el=>r.prayers[el.dataset.prayer]=el.checked);
  saveDay(date.value||dateKey(new Date()),r);renderWallet();renderReport();
  if(status)status.textContent="ثبت شد! ستاره‌هایت به‌روز شد ⭐";
 }
 prayerBox.addEventListener("change",persist);pages.addEventListener("change",persist);dhikr.addEventListener("change",persist);
 date.addEventListener("change",renderDay);
 renderDay();renderWallet();renderReport();
}
SE.worshipTracker={PRAYERS,POINTS,LEVELS,dateKey,validRecord,loadDay,saveDay,dailyStars,levelForStars,summarize,lastSevenKeys,currentStreak,calculateWallet,init};
if(typeof module!=="undefined"&&module.exports)module.exports=SE.worshipTracker;
})(typeof globalThis!=="undefined"?globalThis:this);
