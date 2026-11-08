(function(){
"use strict";
const SE=window.SE=window.SE||{};
const $=id=>document.getElementById(id);
const DEFAULT_CITY={lat:35.5219,lng:46.176,tz:"Asia/Tehran",city:"مریوان",cityEn:"Marivan",country:"IR",countryName:"ایران",source:"default"};
const names=[["fajr","نماز صبح"],["sunrise","طلوع خورشید"],["dhuhr","نماز ظهر"],["asr","نماز عصر"],["maghrib","نماز مغرب"],["isha","نماز عشا"]];
const fa=s=>String(s).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);
let activeCity=null;
function partsAt(date,tz){
 const p=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const o={};p.forEach(x=>{if(x.type!=="literal")o[x.type]=Number(x.value)});return o;
}
function todayAt(tz){const p=partsAt(new Date(),tz);return {year:p.year,month:p.month,day:p.day,hour:p.hour,minute:p.minute,second:p.second};}
function dateValue(y,m,d){return [y,String(m).padStart(2,"0"),String(d).padStart(2,"0")].join("-");}
function selectedDate(){const v=$("home-date").value;if(!v){const t=todayAt(activeCity.tz);return {year:t.year,month:t.month,day:t.day}}const a=v.split("-").map(Number);return {year:a[0],month:a[1],day:a[2]};}
function instantAt(y,m,d,h,mi,tz){
 const guess=Date.UTC(y,m-1,d,h,mi);
 const p=partsAt(new Date(guess),tz);
 const asUTC=Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second);
 return new Date(guess+(guess-asUTC));
}
function fmtDate(d){const noon=new Date(d.year,d.month-1,d.day,12);try{return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",year:"numeric",month:"long",day:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(d.year,d.month-1,d.day,12)))}catch(e){return noon.toLocaleDateString("fa-IR")}}
function cityLabel(c){return SE.place&&SE.place.label?SE.place.label(c,"fa"):(c.city||c.name||"مکان انتخاب‌شده")}
function setCity(city){
 activeCity=Object.assign({},city);
 if(SE.store&&SE.store.prefs)SE.store.prefs.set("homeCity",activeCity);
 const label=$("home-city-label");if(label)label.textContent=cityLabel(activeCity);
 const input=$("home-city-search");if(input)input.value=cityLabel(activeCity);
 const t=todayAt(activeCity.tz||"Asia/Tehran");$("home-date").value=dateValue(t.year,t.month,t.day);
 render();
}
function injectPicker(){
 const card=document.querySelector(".home-date-card");if(!card||$("home-city-picker"))return;
 const wrap=document.createElement("div");wrap.id="home-city-picker";wrap.innerHTML='<label for="home-city-search">شهر محاسبهٔ اوقات شرعی</label><div class="home-city-control"><input id="home-city-search" type="search" autocomplete="off" placeholder="نام شهر را جست‌وجو کنید"><button id="home-city-gps" type="button">موقعیت من</button></div><div id="home-city-label" class="home-city-current" aria-live="polite"></div><div id="home-city-results" class="home-city-results" role="listbox" hidden></div>';
 const dateLabel=card.querySelector('label[for="home-date"]');card.insertBefore(wrap,dateLabel);
 const style=document.createElement("style");style.textContent='#home-city-picker{margin:0 0 18px}#home-city-picker>label{display:block;color:#657384;font-size:.9rem;margin-bottom:8px}.home-city-control{display:flex;gap:8px}.home-city-control input{flex:1;min-width:0;padding:11px;border:1px solid #dce2e8;border-radius:12px;font:inherit}.home-city-control button{border:0;border-radius:12px;background:#eaf3fa;color:#236b9a;padding:8px 12px;font:inherit;white-space:nowrap}.home-city-current{font-size:.82rem;color:#718092;margin-top:6px}.home-city-results{position:relative;z-index:5;background:#fff;border:1px solid #e1e6ea;border-radius:12px;overflow:hidden;box-shadow:0 5px 16px #20304012}.home-city-results button{display:block;width:100%;padding:11px 13px;text-align:right;border:0;border-bottom:1px solid #edf0f2;background:#fff;font:inherit;color:#263746}.home-city-results button:last-child{border-bottom:0}';
 document.head.appendChild(style);
 const input=$("home-city-search"),results=$("home-city-results");
 input.addEventListener("input",()=>{
  const q=input.value.trim();if(q.length<1){results.hidden=true;return}
  let hits=SE.place&&SE.place.search?SE.place.search(q,15):[];
  if("مریوان".includes(q)||"marivan".includes(q.toLowerCase()))hits=[DEFAULT_CITY,...hits.filter(x=>x.city!=="مریوان")];
  if(!hits.length){results.hidden=true;return}
  results.innerHTML=hits.map((c,i)=>'<button type="button" role="option" data-index="'+i+'">'+cityLabel(c)+' <small>· '+c.tz+'</small></button>').join("");
  results.hidden=false;
  results.querySelectorAll("button").forEach((b,i)=>b.addEventListener("click",()=>{setCity(hits[i]);results.hidden=true}));
 });
 input.addEventListener("keydown",e=>{if(e.key==="Escape")results.hidden=true;if(e.key==="Enter"){const first=results.querySelector("button");if(first)first.click()}});
 $("home-city-gps").addEventListener("click",async()=>{
  const b=$("home-city-gps");b.disabled=true;const old=b.textContent;b.textContent="در حال یافتن…";
  try{const p=await SE.place.currentPosition();if(!p.city){p.city="موقعیت من";p.label="موقعیت من"}setCity(p)}
  catch(e){alert("دسترسی به موقعیت مکانی ممکن نیست. لطفاً مجوز مکان‌یابی را بررسی کنید.")}
  finally{b.disabled=false;b.textContent=old}
 });
}
function render(){
 if(!activeCity)return;
 const d=selectedDate(),tz=activeCity.tz||"Asia/Tehran";
 $("home-date-label").textContent=fmtDate(d);
 let ev;
 try{ev=SE.place.timesFor(activeCity,d.year,d.month,d.day,SE.methods&&SE.methods.getCurrentMethod?SE.methods.getCurrentMethod():"tehran")}
 catch(e){$("home-times").innerHTML="<p>محاسبهٔ اوقات در دسترس نیست.</p>";return}
 const list=names.map(([key,label])=>({key,label,time:ev[key]})).filter(x=>x.time);
 $("home-times").innerHTML=list.map(x=>'<div class="home-prayer-row"><div class="home-prayer-name">'+x.label+'</div><time>'+fa(x.time)+'</time></div>').join("");
 const now=new Date(),local=todayAt(tz);
 let next=list.find(x=>{const [h,m]=x.time.split(":").map(Number);return h*60+m>local.hour*60+local.minute});
 let target={year:local.year,month:local.month,day:local.day};
 if(!next){next=list[0];const tomorrow=new Date(Date.UTC(target.year,target.month-1,target.day+1));target={year:tomorrow.getUTCFullYear(),month:tomorrow.getUTCMonth()+1,day:tomorrow.getUTCDate()}}
 if(next){
  const [h,mi]=next.time.split(":").map(Number),targetInstant=instantAt(target.year,target.month,target.day,h,mi,tz),diff=Math.max(0,targetInstant-now),sec=Math.floor(diff/1000);
  $("home-next-name").textContent="رویداد بعدی: "+next.label;
  $("home-next-time").textContent=fa(next.time);
  $("home-countdown").textContent=fa(String(Math.floor(sec/3600)).padStart(2,"0")+":"+String(Math.floor(sec%3600/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"));
 }
}
function init(){
 const input=$("home-date");if(!input)return;
 injectPicker();
 const saved=SE.store&&SE.store.prefs?SE.store.prefs.get("homeCity",null):null;
 setCity(saved&&saved.lat!=null?saved:DEFAULT_CITY);
 input.addEventListener("change",render);
 $("home-today").addEventListener("click",()=>{const t=todayAt(activeCity.tz||"Asia/Tehran");input.value=dateValue(t.year,t.month,t.day);render()});
 const settingsButton=$("home-reminder-settings");
 if(settingsButton) settingsButton.addEventListener("click",()=>{
  location.hash="#/settings";
  if(window.SE_settingsUI&&window.SE_settingsUI.showView)window.SE_settingsUI.showView("settings");
  setTimeout(()=>{const target=$("view-settings");if(target)target.scrollIntoView({behavior:"smooth",block:"start"})},120);
 });
 setInterval(render,1000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,100));else setTimeout(init,100);
})();