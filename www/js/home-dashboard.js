(async function () {
  "use strict";
  try {
    var urls = [
      "https://cdn.jsdelivr.net/gh/shahramnaderian/yom-time@3945235025abaedaad1b113562a77e8517c06f86/www/js/home-dashboard.js",
      "https://raw.githubusercontent.com/shahramnaderian/yom-time/3945235025abaedaad1b113562a77e8517c06f86/www/js/home-dashboard.js"
    ];
    var text = null, i, res;
    for (i = 0; i < urls.length; i++) {
      try {
        res = await fetch(urls[i], { cache: "no-store" });
        if (res.ok) { text = await res.text(); break; }
      } catch (_) {}
    }
    if (!text) throw new Error("failed to load home-dashboard.js");
    // The main app bootstrap is asynchronous. Wait for its core modules before
    // evaluating the dashboard so today's prayer times render on first open.
    for (var wait = 0; wait < 100 && (!window.SE || !SE.place || !SE.place.timesFor || !SE.store || !SE.store.prefs); wait++) {
      await new Promise(function (resolve) { setTimeout(resolve, 100); });
    }
    if (!window.SE || !SE.place || !SE.place.timesFor || !SE.store || !SE.store.prefs) {
      throw new Error("Prayer-time modules did not finish loading");
    }

    text = text.split('{enabled:false,minutes:5,sound:"system"}').join('{enabled:false,minutes:null,sound:"system"}');

    text = text.split(
      'if(SE.store&&SE.store.prefs)SE.store.prefs.set("homeCity",activeCity);'
    ).join(
      'if(SE.store&&SE.store.prefs)SE.store.prefs.set("homeCity",Object.assign({},activeCity,{source:activeCity.source||"user"}));if(window.SE&&SE.cityPersist)SE.cityPersist.save(activeCity);SE.selectedCity=activeCity;'
    );
    text = text.split(
      'const isOldDefault=saved&&(saved.source==="default"||saved.city==="مریوان"||saved.cityEn==="Marivan");\n setCity(saved&&saved.lat!=null&&!isOldDefault?saved:DEFAULT_CITY);'
    ).join(
      'const preferred=(window.SE&&SE.cityPersist&&SE.cityPersist.load&&SE.cityPersist.load())||saved;\n setCity(preferred&&preferred.lat!=null?preferred:(saved&&saved.lat!=null?saved:DEFAULT_CITY));'
    );

    var selectNeedle = "اعلان قبل از زمان<select data-home-minutes=\"'+x.key+'\">'+[1,5,10,15,20,30,45,60,90,120,150,180,240].map(n=>'<option value=\"'+n+'\" '+(Number(p.minutes)===n?'selected':'')+'>'+fa(n)+' دقیقه قبل</option>').join('')+'</select>";
    var selectRepl =
      "اعلان قبل از زمان<span class=\"home-alarm-lead-value\" data-home-minutes-label=\"'+x.key+'\">'+(" +
      "(function(){var m=Number(p.minutes);return (Number.isFinite(m)&&m>=1&&m<=60)?(fa(Math.round(m))+\" دقیقه قبل\"):\"مدت را انتخاب کنید (۱ تا ۶۰)\";})()" +
      "+')</span><input type=\"range\" class=\"home-alarm-lead-range\" data-home-minutes=\"'+x.key+'\" min=\"1\" max=\"60\" step=\"1\" value=\"'+(" +
      "(function(){var m=Number(p.minutes);return (Number.isFinite(m)&&m>=1&&m<=60)?Math.round(m):15;})()" +
      "+')\" '+((Number.isFinite(Number(p.minutes))&&Number(p.minutes)>=1&&Number(p.minutes)<=60)?'':'data-unset=\"1\"')+'>"
    ;
    if (text.indexOf(selectNeedle) !== -1) text = text.split(selectNeedle).join(selectRepl);

    var soundNeedle = "صدای آلارم<select data-home-sound=\"'+x.key+'\"><option value=\"system\" '+((p.sound||\"system\")===\"system\"?'selected':'')+'>زنگ گوشی</option><option value=\"adhan\" '+(p.sound===\"adhan\"?'selected':'')+'>اذان</option></select>";
    var soundRepl =
      "صدای آلارم<select class=\"home-alarm-sound-select\" data-home-sound=\"'+x.key+'\">" +
      "<option value=\"system\" '+((p.sound||\"system\")===\"system\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Phone ringtone':'زنگ گوشی')+'</option>' +
      "<option value=\"adhan\" '+(p.sound===\"adhan\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Adhan':'اذان')+'</option>' +
      "<option value=\"happy-chime\" '+(p.sound===\"happy-chime\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Happy chime':'زنگ شاد')+'</option>' +
      "<option value=\"morning-bells\" '+(p.sound===\"morning-bells\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Morning bells':'ناقوس صبحگاهی')+'</option>' +
      "<option value=\"cheerful-piano\" '+(p.sound===\"cheerful-piano\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Cheerful piano':'پیانوی شاد')+'</option>' +
      "<option value=\"soft-marimba\" '+(p.sound===\"soft-marimba\"?'selected':'')+'>'+((document.documentElement.lang||'fa').toLowerCase().indexOf('en')===0?'Soft marimba':'ماریمبای ملایم')+'</option>' +
      "</select>";
    if (text.indexOf(soundNeedle) !== -1) text = text.split(soundNeedle).join(soundRepl);

    text = text.split(
      'saveHomeAlarm(el.dataset.homeAlarm,{enabled});if(options)options.hidden=!enabled;'
    ).join(
      'saveHomeAlarm(el.dataset.homeAlarm,{enabled});if(options){options.hidden=!enabled;if(enabled){options.hidden=false;options.removeAttribute("hidden");}}'
    );

    var oldMinHandler = '$("home-times").querySelectorAll("[data-home-minutes]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeMinutes,{minutes:Number(el.value)})));';
    var newMinHandler =
      '$("home-times").querySelectorAll("[data-home-minutes]").forEach(el=>{' +
      'const key=el.dataset.homeMinutes;' +
      'const labelEl=document.querySelector(\'[data-home-minutes-label="\'+key+\'"]\');' +
      'const syncLabel=()=>{const v=Math.max(1,Math.min(60,Number(el.value)||1));el.value=String(v);if(labelEl)labelEl.textContent=fa(v)+" دقیقه قبل";};' +
      'const commit=()=>{el.removeAttribute("data-unset");syncLabel();saveHomeAlarm(key,{minutes:Math.max(1,Math.min(60,Number(el.value)||1))});};' +
      'el.addEventListener("input",syncLabel);el.addEventListener("change",commit);el.addEventListener("pointerup",commit);' +
      '});';
    if (text.indexOf(oldMinHandler) !== -1) text = text.split(oldMinHandler).join(newMinHandler);

    var oldSoundHandler = '$("home-times").querySelectorAll("[data-home-sound]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeSound,{sound:el.value})));';
    var newSoundHandler =
      '$("home-times").querySelectorAll("[data-home-sound]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeSound,{sound:el.value})));';
    if (text.indexOf(oldSoundHandler) !== -1) text = text.split(oldSoundHandler).join(newSoundHandler);

    var oldPush = 'events.push({key,label,at:instantAt(y,m,d,hm[0],hm[1],tz),minutes:Number.isFinite(Number(p.minutes))?Math.max(0,Number(p.minutes)):5,sound:p.sound||"system"});';
    var newPush = 'const lead=Number(p.minutes);if(!Number.isFinite(lead)||lead<1||lead>60)continue;events.push({key,label,at:instantAt(y,m,d,hm[0],hm[1],tz),minutes:Math.max(1,Math.min(60,Math.round(lead))),sound:p.sound||"system"});';
    if (text.indexOf(oldPush) !== -1) text = text.split(oldPush).join(newPush);

    var styleNeedle = '";document.head.appendChild(st);render._homeAlarmStyle=true;';
    var styleExtra =
      '.home-alarm-lead-value{font-weight:600;color:#246f9e;font-size:.92rem;display:block;margin:4px 0}' +
      '.home-alarm-lead-range{width:100%;accent-color:#246f9e;height:2rem}' +
      '.home-sound-picks{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}' +
      '.home-sound-pick{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;min-width:70px}' +
      '.home-sound-pick input{position:absolute;opacity:0;width:1px;height:1px}' +
      '.home-sound-circle{width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.4rem;background:#edf5fa;border:2px solid #d5e3ec}' +
      '.home-sound-pick input:checked+.home-sound-circle{border-color:#246f9e;background:#dceef8;box-shadow:0 0 0 3px rgba(36,111,158,.2)}' +
      '.home-sound-txt{font-size:.75rem;color:#657384;text-align:center}' +
      '.home-sound-upload-wrap{margin-top:8px;display:flex;flex-direction:column;gap:6px;width:100%}' +
      '.home-sound-upload-wrap[hidden]{display:none!important}' +
      styleNeedle;
    if (text.indexOf(styleNeedle) !== -1) text = text.split(styleNeedle).join(styleExtra);

    // Repair the next-event countdown: compare absolute instants for all events today and tomorrow,
    // including night thirds, rather than comparing clock strings in a fixed array order.
    var countdownPatch = [
      ' const now=new Date(),local=todayAt(tz);',
      ' let next=list.find(x=>{const [h,m]=x.time.split(":").map(Number);return h*60+m>local.hour*60+local.minute});',
      ' let target={year:local.year,month:local.month,day:local.day};',
      ' if(!next){next=list[0];const tomorrow=new Date(Date.UTC(target.year,target.month-1,target.day+1));target={year:tomorrow.getUTCFullYear(),month:tomorrow.getUTCMonth()+1,day:tomorrow.getUTCDate()}}',
      ' if(next){',
      '  const [h,mi]=next.time.split(":").map(Number),targetInstant=instantAt(target.year,target.month,target.day,h,mi,tz),diff=Math.max(0,targetInstant-now),sec=Math.floor(diff/1000);',
      '  $("home-next-name").textContent="رویداد بعدی: "+next.label;',
      '  $("home-next-time").textContent=fa(next.time);',
      '  $("home-countdown").textContent=fa(String(Math.floor(sec/3600)).padStart(2,"0")+":"+String(Math.floor(sec%3600/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"));',
      ' }'
    ].join("\n");
    var countdownReplacement = [
      ' const now=new Date();',
      ' const candidates=[];',
      ' function collectUpcoming(y,m,d){',
      '  const dayEv=SE.place.timesFor(activeCity,y,m,d,"legacy");',
      '  const dayNight=nightPartsFor(activeCity,y,m,d,dayEv);',
      '  names.forEach(([key,label])=>{',
      '   const tm=nightKeys.includes(key)?dayNight[key]:dayEv[key];',
      '   if(!tm)return;',
      '   const hm=String(tm).split(":").map(Number);',
      '   if(hm.length!==2||!hm.every(Number.isFinite))return;',
      '   const at=instantAt(y,m,d,hm[0],hm[1],tz);',
      '   if(at>now)candidates.push({key,label,time:tm,at});',
      '  });',
      ' }',
      ' const today=todayAt(tz);',
      ' collectUpcoming(today.year,today.month,today.day);',
      ' const tomorrow=new Date(Date.UTC(today.year,today.month-1,today.day+1));',
      ' collectUpcoming(tomorrow.getUTCFullYear(),tomorrow.getUTCMonth()+1,tomorrow.getUTCDate());',
      ' candidates.sort((a,b)=>a.at-b.at);',
      ' const next=candidates[0];',
      ' if(next){',
      '  const diff=Math.max(0,next.at-now),sec=Math.floor(diff/1000);',
      '  $("home-next-name").textContent="رویداد بعدی: "+next.label;',
      '  $("home-next-time").textContent=fa(next.time);',
      '  $("home-countdown").textContent=fa(String(Math.floor(sec/3600)).padStart(2,"0")+":"+String(Math.floor(sec%3600/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"));',
      ' } else {',
      '  $("home-next-name").textContent="رویداد بعدی";',
      '  $("home-next-time").textContent="—";',
      '  $("home-countdown").textContent="۰۰:۰۰:۰۰";',
      ' }'
    ].join("\n");
    if (text.indexOf(countdownPatch) !== -1) text = text.split(countdownPatch).join(countdownReplacement);
    else console.warn("Next-event countdown patch target not found; keeping original countdown.");

    // Keep prayer calculations on the app's Legacy method and derive night thirds from sunset to the following Fajr.
    text = text.replaceAll('SE.methods&&SE.methods.getCurrentMethod?SE.methods.getCurrentMethod():"legacy"', '"legacy"');
    var nightHelper = 'function nightPartsFor(place,y,m,d,ev){const next=new Date(Date.UTC(y,m-1,d+1)),ny=next.getUTCFullYear(),nm=next.getUTCMonth()+1,nd=next.getUTCDate(),nextEv=SE.place.timesFor(place,ny,nm,nd,"legacy");const mins=s=>{if(!s)return null;const a=String(s).split(":").map(Number);return a.length===2&&a.every(Number.isFinite)?a[0]*60+a[1]:null;};const sunset=mins(ev.sunset),fajr=mins(nextEv.fajr);if(sunset===null||fajr===null)return {nightEnd:ev.fajr,night1:null,night2:null};const end=fajr<=sunset?fajr+1440:fajr,span=end-sunset;const fmt=n=>String(Math.floor(n/60)%24).padStart(2,"0")+":"+String(Math.floor(n%60)).padStart(2,"0");return {nightEnd:ev.fajr,night1:fmt((sunset+span/3)%1440),night2:fmt((sunset+span*2/3)%1440)};}';
    text = text.replace('let activeCity=null;', nightHelper+'\\nlet activeCity=null;');
    text = text.replace('const nightTimes={nightEnd:ev.nauticalBegin,night1:ev.night1,night2:ev.night2};','const nightTimes=nightPartsFor(activeCity,d.year,d.month,d.day,ev);');
    text = text.replace('const nightTimes={nightEnd:ev.nauticalBegin,night1:ev.night1,night2:ev.night2};','const nightTimes=nightPartsFor(activeCity,y,m,d,ev);');
    (0, eval)(text);
  } catch (e) {
    console.error("Yom Time home-dashboard bootstrap failed", e);
  }
})();
