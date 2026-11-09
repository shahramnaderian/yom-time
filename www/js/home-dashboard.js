(function(){
"use strict";
const SE=window.SE=window.SE||{};
const $=id=>document.getElementById(id);
const DEFAULT_CITY={lat:35.6892,lng:51.3890,tz:"Asia/Tehran",city:"تهران",cityEn:"Tehran",country:"IR",countryName:"ایران",source:"default"};
const names=[["fajr","نماز صبح"],["sunrise","طلوع خورشید"],["dhuhr","نماز ظهر"],["asr","نماز عصر"],["maghrib","نماز مغرب"],["isha","نماز عشا"],["nightEnd","پایان شب"],["night1","یک‌سوم شب"],["night2","دوسوم شب"]];
const nightKeys=["nightEnd","night1","night2"];
const nightLabels={nightEnd:"پایان شب",night1:"یک‌سوم شب",night2:"دوسوم شب"};
const DEFAULT_HOME_ALARMS=Object.fromEntries(names.map(([key])=>[key,{enabled:false,minutes:10,sound:"system"}]));
function homeAlarmPrefs(){
 const saved=SE.store&&SE.store.prefs?SE.store.prefs.get("homeEventAlarms",null):null;
 const legacy=SE.store&&SE.store.prefs?SE.store.prefs.get("nightEventAlarms",{}):{};
 const out=Object.assign({},DEFAULT_HOME_ALARMS,saved||{});
 nightKeys.forEach(k=>{if(!saved&&legacy[k])out[k]=Object.assign({},out[k],legacy[k]);});
 return out;
}
function saveHomeAlarm(key,patch){
 const p=homeAlarmPrefs();p[key]=Object.assign({enabled:false,minutes:10,sound:"system"},p[key]||{},patch);
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
function dateValue(y,m,d){return [y,String(m).padStart(2,"0"),String(d).padStart(2,"0")].join("-");}
function selectedDate(){const picker=$("home-date-native"),v=picker&&picker.value;if(!v){const t=todayAt(activeCity.tz);return {year:t.year,month:t.month,day:t.day}}const a=v.split("-").map(Number);return {year:a[0],month:a[1],day:a[2]};}
function syncJalaliDate(){const input=$("home-date"),picker=$("home-date-native");if(!input||!picker||!picker.value)return;const a=picker.value.split("-").map(Number),j=SE.jalali&&SE.jalali.gToJ?SE.jalali.gToJ(a[0],a[1],a[2]):null;input.value=j?fa(j.year)+"/"+fa(String(j.month).padStart(2,"0"))+"/"+fa(String(j.day).padStart(2,"0")):picker.value;}
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
 const t=todayAt(activeCity.tz||"Asia/Tehran");$("home-date-native").value=dateValue(t.year,t.month,t.day);syncJalaliDate();
 render();
 scheduleHomeAlarms();
}
let leafletPromise=null;
function loadLeaflet(){
 if(window.L)return Promise.resolve(window.L);
 if(leafletPromise)return leafletPromise;
 leafletPromise=new Promise((resolve,reject)=>{
  if(!document.querySelector("link[data-leaflet-css]")){const link=document.createElement("link");link.rel="stylesheet";link.href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";link.dataset.leafletCss="1";document.head.appendChild(link)}
  const script=document.createElement("script");script.src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";script.onload=()=>resolve(window.L);script.onerror=()=>{leafletPromise=null;reject(new Error("Leaflet load failed"))};document.head.appendChild(script);
 });
 return leafletPromise;
}
function injectPicker(){
 const card=document.querySelector(".home-date-card");if(!card||$("home-city-picker"))return;
 const wrap=document.createElement("div");wrap.id="home-city-picker";wrap.innerHTML='<label for="home-city-search">شهر محاسبهٔ اوقات شرعی</label><div class="home-city-control"><input id="home-city-search" type="search" autocomplete="off" placeholder="نام شهر را جست‌وجو کنید"><button id="home-city-gps" type="button">موقعیت من</button><button id="home-map-toggle" type="button">انتخاب روی نقشه</button></div><div id="home-city-label" class="home-city-current" aria-live="polite"></div><div id="home-city-results" class="home-city-results" role="listbox" hidden></div><div id="home-map-panel" class="home-map-panel" hidden><p>روی نقشه نقطهٔ دلخواه را لمس کنید یا نشانگر را جابه‌جا کنید.</p><div id="home-location-map" role="application" aria-label="نقشه انتخاب مکان"></div><div class="home-map-actions"><span id="home-map-coords"></span><button id="home-map-confirm" type="button">محاسبه اوقات این نقطه</button></div></div>';
 const dateLabel=card.querySelector('label[for="home-date"]');card.insertBefore(wrap,dateLabel);
 const style=document.createElement("style");style.textContent='#home-city-picker{margin:0 0 18px}#home-city-picker>label{display:block;color:#657384;font-size:.9rem;margin-bottom:8px}.home-city-control{display:flex;gap:8px}.home-city-control input{flex:1;min-width:0;padding:11px;border:1px solid #dce2e8;border-radius:12px;font:inherit}.home-city-control button{border:0;border-radius:12px;background:#eaf3fa;color:#236b9a;padding:8px 12px;font:inherit;white-space:nowrap}.home-city-current{font-size:.82rem;color:#718092;margin-top:6px}.home-map-panel{margin-top:12px;padding:10px;border:1px solid #dce5ec;border-radius:14px;background:#f8fbfd}.home-map-panel p{font-size:.85rem;color:#657384;margin:0 0 8px}#home-location-map{height:280px;border-radius:10px;z-index:1}.home-map-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:9px}.home-map-actions span{font-size:.75rem;color:#657384;direction:ltr}.home-map-actions button{border:0;border-radius:10px;background:#246f9e;color:#fff;padding:10px 12px;font:inherit;font-size:.85rem}.home-city-control #home-map-toggle{background:#e9f3ec;color:#287548}.home-city-results{position:relative;z-index:5;background:#fff;border:1px solid #e1e6ea;border-radius:12px;overflow:hidden;box-shadow:0 5px 16px #20304012}.home-city-results button{display:block;width:100%;padding:11px 13px;text-align:right;border:0;border-bottom:1px solid #edf0f2;background:#fff;font:inherit;color:#263746}.home-city-results button:last-child{border-bottom:0}';
 document.head.appendChild(style);
 let map=null,mapMarker=null,mapPoint=null;
 const mapPanel=$("home-map-panel"),mapToggle=$("home-map-toggle");
 async function showMap(){
  mapPanel.hidden=false;
  $("home-map-coords").textContent="در حال آماده‌سازی نقشه…";
  try{await loadLeaflet()}catch(e){$("home-map-coords").textContent="نقشه بارگذاری نشد؛ اتصال اینترنت را بررسی کنید.";return}
  if(!map){
   const start=activeCity||DEFAULT_CITY;
   map=L.map("home-location-map").setView([start.lat,start.lng],12);
   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"}).addTo(map);
   map.on("click",e=>setMapPoint(e.latlng.lat,e.latlng.lng));
   map.on("locationfound",e=>setMapPoint(e.latitude,e.longitude));
   map.on("locationerror",()=>{$("home-map-coords").textContent="موقعیت فعلی در دسترس نیست؛ نقطه را روی نقشه انتخاب کنید."});
  }
  const center=activeCity||DEFAULT_CITY;
  map.setView([center.lat,center.lng],Math.max(map.getZoom(),12));
  if(!mapPoint)setMapPoint(center.lat,center.lng);
  setTimeout(()=>map.invalidateSize(),100);
 }
 function setMapPoint(lat,lng){
  mapPoint={lat:Number(lat),lng:Number(lng)};
  if(mapMarker)mapMarker.setLatLng([lat,lng]);
  else mapMarker=L.marker([lat,lng],{draggable:true}).addTo(map).on("dragend",e=>{const p=e.target.getLatLng();setMapPoint(p.lat,p.lng)});
  $("home-map-coords").textContent=lat.toFixed(5)+", "+lng.toFixed(5);
 }
 mapToggle.addEventListener("click",()=>{if(mapPanel.hidden)showMap();else mapPanel.hidden=true});
 $("home-map-confirm").addEventListener("click",()=>{
  if(!mapPoint)return;
  const place=SE.place.fromCoords(mapPoint.lat,mapPoint.lng,{source:"map",label:"نقطهٔ انتخاب‌شده ("+mapPoint.lat.toFixed(4)+", "+mapPoint.lng.toFixed(4)+")"});
  setCity(place);mapPanel.hidden=true;mapPoint=null;
 });
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
 const nightTimes={nightEnd:ev.nauticalBegin,night1:ev.night1,night2:ev.night2};
 const list=names.map(([key,label])=>({key,label,time:nightKeys.includes(key)?nightTimes[key]:ev[key]})).filter(x=>x.time);
 $("home-times").innerHTML=list.map(x=>{
  const p=homeAlarmPrefs()[x.key]||{enabled:false,minutes:10,sound:"system"};
  const controls='<div class="home-alarm-controls"><label class="home-alarm-toggle" title="فعال‌سازی آلارم"><input type="checkbox" data-home-alarm="'+x.key+'" '+(p.enabled?'checked':'')+'><span>🔔</span></label>'+(p.enabled?'<div class="home-alarm-options"><label>اعلان قبل از زمان<select data-home-minutes="'+x.key+'">'+[1,5,10,15,20,30,45,60,90,120].map(n=>'<option value="'+n+'" '+(Number(p.minutes)===n?'selected':'')+'>'+fa(n)+' دقیقه قبل</option>').join('')+'</select></label><label>صدای آلارم<select data-home-sound="'+x.key+'"><option value="system" '+((p.sound||"system")==="system"?'selected':'')+'>زنگ گوشی</option><option value="adhan" '+(p.sound==="adhan"?'selected':'')+'>اذان</option></select></label></div>':'')+'</div>';
  return '<div class="home-prayer-row home-prayer-row-alarm"><div class="home-prayer-name">'+x.label+'</div><time>'+fa(x.time)+'</time>'+controls+'</div>';
 }).join("");
 $("home-times").querySelectorAll("[data-home-alarm]").forEach(el=>el.addEventListener("change",()=>{saveHomeAlarm(el.dataset.homeAlarm,{enabled:el.checked});render()}));
 $("home-times").querySelectorAll("[data-home-minutes]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeMinutes,{minutes:Number(el.value)})));
 $("home-times").querySelectorAll("[data-home-sound]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeSound,{sound:el.value})));
 if(!render._homeAlarmInteractions){const root=$("home-times");["pointerdown","touchstart","click"].forEach(type=>root.addEventListener(type,e=>{if(e.target.closest(".home-alarm-options"))e.stopPropagation()},true));render._homeAlarmInteractions=true;}
 if(!render._homeAlarmStyle){const st=document.createElement("style");st.textContent=".home-prayer-row-alarm{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px}.home-prayer-row-alarm .home-alarm-controls{grid-column:1/-1;display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;border-top:1px solid #edf0f2;padding-top:10px}.home-alarm-toggle{display:inline-flex;align-items:center;justify-content:center;min-width:46px;height:42px;border-radius:11px;background:#edf5fa;cursor:pointer}.home-alarm-toggle input{position:absolute;opacity:0}.home-alarm-toggle:has(input:checked){background:#dcefe2}.home-alarm-options{display:flex;flex:1;gap:10px;flex-wrap:wrap}.home-alarm-options label{display:flex;flex:1;min-width:135px;flex-direction:column;gap:5px;color:#657384;font-size:.8rem}.home-alarm-options select{width:100%;min-height:42px;border:1px solid #dce2e8;border-radius:10px;padding:8px;background:#fff;color:#35495a;font:inherit;font-size:.88rem}.home-alarm-toggle input:focus-visible+span{outline:2px solid #246f9e}";document.head.appendChild(st);render._homeAlarmStyle=true;}
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
async function scheduleHomeAlarms(){
 if(!activeCity||!SE.alarms||!SE.alarms.scheduleHomeEvents)return;
 try{
  const tz=activeCity.tz||"Asia/Tehran",now=todayAt(tz),events=[],prefs=homeAlarmPrefs();
  for(let offset=0;offset<3;offset++){
   const dt=new Date(Date.UTC(now.year,now.month-1,now.day+offset)),y=dt.getUTCFullYear(),m=dt.getUTCMonth()+1,d=dt.getUTCDate();
   const ev=SE.place.timesFor(activeCity,y,m,d,SE.methods&&SE.methods.getCurrentMethod?SE.methods.getCurrentMethod():"tehran");
   const nightTimes={nightEnd:ev.nauticalBegin,night1:ev.night1,night2:ev.night2};
   for(const [key,label] of names){
    const p=prefs[key]||{};if(!p.enabled)continue;
    const tm=nightKeys.includes(key)?nightTimes[key]:ev[key];if(!tm)continue;
    const hm=tm.split(":").map(Number);
    events.push({key,label,at:instantAt(y,m,d,hm[0],hm[1],tz),minutes:Number(p.minutes)||0,sound:p.sound||"system"});
   }
  }
  await SE.alarms.scheduleHomeEvents(events,cityLabel(activeCity));
 }catch(e){}
}
function init(){
 const input=$("home-date");if(!input)return;
 injectPicker();
 const saved=SE.store&&SE.store.prefs?SE.store.prefs.get("homeCity",null):null;
 const isOldDefault=saved&&(saved.source==="default"||saved.city==="مریوان"||saved.cityEn==="Marivan");
 setCity(saved&&saved.lat!=null&&!isOldDefault?saved:DEFAULT_CITY);
 const picker=$("home-date-native");
 input.addEventListener("click",()=>{try{if(picker.showPicker)picker.showPicker();else picker.click()}catch(e){picker.click()}});
 picker.addEventListener("change",()=>{syncJalaliDate();render()});
 $("home-today").addEventListener("click",()=>{const t=todayAt(activeCity.tz||"Asia/Tehran");picker.value=dateValue(t.year,t.month,t.day);syncJalaliDate();render()});
 const settingsButton=$("home-reminder-settings");
 if(settingsButton) settingsButton.addEventListener("click",()=>{
  location.hash="#/settings";
  if(window.SE_settingsUI&&window.SE_settingsUI.showView)window.SE_settingsUI.showView("settings");
  setTimeout(()=>{const target=$("view-settings");if(target)target.scrollIntoView({behavior:"smooth",block:"start"})},120);
 });
 setInterval(render,1000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();