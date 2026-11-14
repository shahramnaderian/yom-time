(function(){
"use strict";
const SE=window.SE=window.SE||{};
const $=id=>document.getElementById(id);
const DEFAULT_CITY={lat:35.6892,lng:51.3890,tz:"Asia/Tehran",city:"تهران",cityEn:"Tehran",country:"IR",countryName:"ایران",source:"default"};
const names=[["fajr","اذان صبح"],["sunrise","طلوع خورشید"],["dhuhr","نماز ظهر"],["asr","نماز عصر"],["maghrib","نماز مغرب"],["isha","نماز عشا"],["nightEnd","پایان شب شرعی"],["night1","یک‌سوم شب"],["night2","دوسوم شب"]];
const nightKeys=["nightEnd","night1","night2"];
const DEFAULT_HOME_ALARMS=Object.fromEntries(names.map(([key])=>[key,{enabled:false,minutes:null,sound:"system"}]));
function homeAlarmPrefs(){
 const saved=SE.store&&SE.store.prefs?SE.store.prefs.get("homeEventAlarms",null):null;
 const legacy=SE.store&&SE.store.prefs?SE.store.prefs.get("nightEventAlarms",{}):{};
 const base=Object.assign({},DEFAULT_HOME_ALARMS);
 if(saved&&typeof saved==="object")Object.keys(saved).forEach(k=>{if(base[k])base[k]=Object.assign({},base[k],saved[k]);});
 else if(legacy&&typeof legacy==="object")Object.keys(legacy).forEach(k=>{if(base[k])base[k]=Object.assign({},base[k],typeof legacy[k]==="object"?legacy[k]:{enabled:!!legacy[k]});});
 return base;
}
function saveHomeAlarm(key,patch){
 const p=homeAlarmPrefs();p[key]=Object.assign({enabled:false,minutes:null,sound:"system"},p[key]||{},patch);
 if(SE.store&&SE.store.prefs)SE.store.prefs.set("homeEventAlarms",p);
 scheduleHomeAlarms();
}
const fa=s=>String(s).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);
let activeCity=null;
function partsAt(date,tz){
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const o={};p.forEach(x=>{if(x.type!=="literal")o[x.type]=Number(x.value)});return o;
}
function todayAt(tz){const p=partsAt(new Date(),tz);return {year:p.year,month:p.month,day:p.day,hour:p.hour,minute:p.minute,second:p.second};}
function instantAt(y,m,d,h,mi,tz){
 let guess=Date.UTC(y,m-1,d,h,mi,0);
 for(let i=0;i<4;i++){const p=partsAt(new Date(guess),tz);const got=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);const want=Date.UTC(y,m-1,d,h,mi,0);guess+=want-got;}return new Date(guess);
}
function selectedDate(){const picker=$("home-date-native"),v=picker&&picker.value;if(!v){const t=todayAt(activeCity.tz);return {year:t.year,month:t.month,day:t.day};}const [y,m,d]=v.split("-").map(Number);return {year:y,month:m,day:d};}
function fmtDate(d){try{if(SE.dates&&SE.dates.formatTriple){const g=new Date(Date.UTC(d.year,d.month-1,d.day,12,0,0));return SE.dates.formatTriple(g,"fa");}}catch(_){}return fa(d.year+"/"+d.month+"/"+d.day);}
function cityLabel(c){if(!c)return "";if(SE.place&&SE.place.label)return SE.place.label(c,"fa");return c.city||c.cityEn||"";}
function setCity(c){
 if(!c||!Number.isFinite(Number(c.lat)))return;
 activeCity=Object.assign({},c,{lat:Number(c.lat),lng:Number(c.lng)});
 if(SE.selectedCity!==activeCity)SE.selectedCity=activeCity;
 const label=$("home-city-label");if(label)label.textContent=cityLabel(activeCity);
 scheduleHomeAlarms();
 render();
}
function ensureCity(){
 if(activeCity)return activeCity;
 let c=SE.selectedCity;
 if(!c&&SE.store&&SE.store.prefs)c=SE.store.prefs.get("homeCity",null);
 if(!c||!Number.isFinite(Number(c.lat)))c=DEFAULT_CITY;
 setCity(c);return activeCity;
}
/* NOTE: rest of file continues - this is incomplete */
})();
