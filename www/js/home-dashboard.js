(function(){
"use strict";
const SE=window.SE=window.SE||{};
const $=id=>document.getElementById(id);
const marivan={lat:35.5219,lng:46.176,tz:"Asia/Tehran",city:"مریوان",cityEn:"Marivan",country:"IR",countryName:"ایران",source:"default"};
const names=[["fajr","نماز صبح"],["sunrise","طلوع خورشید"],["dhuhr","نماز ظهر"],["asr","نماز عصر"],["maghrib","نماز مغرب"],["isha","نماز عشا"]];
const fa=s=>String(s).replace(/\d/g,d=>"۰۱۲۳۴۵۶۷۸۹"[d]);
function selectedDate(){const v=$("home-date").value;if(!v)return new Date();const a=v.split("-").map(Number);return new Date(a[0],a[1]-1,a[2]);}
function fmtDate(d){try{return new Intl.DateTimeFormat("fa-IR-u-ca-persian",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(d)}catch(e){return d.toLocaleDateString("fa-IR")}}
function render(){
 const d=selectedDate(), y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate();
 $("home-date-label").textContent=fmtDate(d);
 let ev;
 try{ev=SE.place.timesFor(marivan,y,m,day,"tehran")}catch(e){$("home-times").innerHTML="<p>محاسبهٔ اوقات در دسترس نیست.</p>";return}
 const list=names.map(([key,label])=>({key,label,time:ev[key]})).filter(x=>x.time);
 $("home-times").innerHTML=list.map((x,i)=>'<div class="home-prayer-row"><div class="home-prayer-name">'+x.label+'</div><time>'+fa(x.time)+'</time></div>').join("");
 const now=new Date(); const currentMinutes=now.getHours()*60+now.getMinutes();
 let next=list.find(x=>{const [h,m]=x.time.split(":").map(Number);return h*60+m>currentMinutes});
 let targetDate=new Date(y,m-1,day);
 if(!next){next=list[0];targetDate.setDate(targetDate.getDate()+1)}
 if(next){const [h,mi]=next.time.split(":").map(Number);const target=new Date(targetDate.getFullYear(),targetDate.getMonth(),targetDate.getDate(),h,mi);const diff=Math.max(0,target-now);const sec=Math.floor(diff/1000);$("home-next-name").textContent="رویداد بعدی: "+next.label;$("home-next-time").textContent=fa(next.time);$("home-countdown").textContent=fa(String(Math.floor(sec/3600)).padStart(2,"0")+":"+String(Math.floor(sec%3600/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"))}
}
function init(){
 const input=$("home-date");if(!input)return;
 const n=new Date();input.value=[n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),String(n.getDate()).padStart(2,"0")].join("-");
 input.addEventListener("change",render);
 $("home-today").addEventListener("click",()=>{input.value=[n.getFullYear(),String(n.getMonth()+1).padStart(2,"0"),String(n.getDate()).padStart(2,"0")].join("-");render()});
 render();setInterval(render,30000);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,100));else setTimeout(init,100);
})();