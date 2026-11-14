(async function () {
  "use strict";
  try {
    var urls = [
      "https://cdn.jsdelivr.net/gh/shahramnaderian/yom-time@3945235025abaedaad1b113562a77e8517c06f86/www/js/home-dashboard.js",
      "https://raw.githubusercontent.com/shahramnaderian/yom-time/3945235025abaedaad1b113562a77e8517c06f86/www/js/home-dashboard.js"
    ];
    var text = null;
    for (var i = 0; i < urls.length; i++) {
      try {
        var res = await fetch(urls[i], { cache: "no-store" });
        if (res.ok) { text = await res.text(); break; }
      } catch (_) {}
    }
    if (!text) throw new Error("failed to load home-dashboard.js");

    text = text.split('{enabled:false,minutes:5,sound:"system"}').join('{enabled:false,minutes:null,sound:"system"}');

    var selectNeedle = "اعلان قبل از زمان<select data-home-minutes=\"'+x.key+'\">'+[1,5,10,15,20,30,45,60,90,120,150,180,240].map(n=>'<option value=\"'+n+'\" '+(Number(p.minutes)===n?'selected':'')+'>'+fa(n)+' دقیقه قبل</option>').join('')+'</select>";
    var selectRepl =
      "اعلان قبل از زمان<span class=\"home-alarm-lead-value\" data-home-minutes-label=\"'+x.key+'\">'+(" +
      "(function(){var m=Number(p.minutes);return (Number.isFinite(m)&&m>=1&&m<=60)?(fa(Math.round(m))+\" دقیقه قبل\"):\"مدت را انتخاب کنید (۱ تا ۶۰)\";})()" +
      "+')</span><input type=\"range\" class=\"home-alarm-lead-range\" data-home-minutes=\"'+x.key+'\" min=\"1\" max=\"60\" step=\"1\" value=\"'+(" +
      "(function(){var m=Number(p.minutes);return (Number.isFinite(m)&&m>=1&&m<=60)?Math.round(m):15;})()" +
      "+')\" '+((Number.isFinite(Number(p.minutes))&&Number(p.minutes)>=1&&Number(p.minutes)<=60)?'':'data-unset=\"1\"')+'>"
    ;
    if (text.indexOf(selectNeedle) !== -1) text = text.split(selectNeedle).join(selectRepl);
    else console.warn("Yom Time: minutes select needle not found");

    var oldHandler = 'saveHomeAlarm(el.dataset.homeAlarm,{enabled});if(options)options.hidden=!enabled;';
    var newHandler = 'saveHomeAlarm(el.dataset.homeAlarm,{enabled});if(options){options.hidden=!enabled;if(enabled){options.hidden=false;options.removeAttribute("hidden");}}';
    text = text.split(oldHandler).join(newHandler);

    var oldMinHandler = '$("home-times").querySelectorAll("[data-home-minutes]").forEach(el=>el.addEventListener("change",()=>saveHomeAlarm(el.dataset.homeMinutes,{minutes:Number(el.value)})));';
    var newMinHandler =
      '$("home-times").querySelectorAll("[data-home-minutes]").forEach(el=>{' +
      'const key=el.dataset.homeMinutes;' +
      'const labelEl=document.querySelector(\'[data-home-minutes-label="\'+key+\'"]\');' +
      'const syncLabel=()=>{const v=Math.max(1,Math.min(60,Number(el.value)||1));el.value=String(v);if(labelEl)labelEl.textContent=fa(v)+" دقیقه قبل";};' +
      'const commit=()=>{el.removeAttribute("data-unset");syncLabel();saveHomeAlarm(key,{minutes:Math.max(1,Math.min(60,Number(el.value)||1))});};' +
      'el.addEventListener("input",syncLabel);' +
      'el.addEventListener("change",commit);' +
      'el.addEventListener("pointerup",commit);' +
      '});';
    if (text.indexOf(oldMinHandler) !== -1) text = text.split(oldMinHandler).join(newMinHandler);

    var oldPush = 'events.push({key,label,at:instantAt(y,m,d,hm[0],hm[1],tz),minutes:Number.isFinite(Number(p.minutes))?Math.max(0,Number(p.minutes)):5,sound:p.sound||"system"});';
    var newPush = 'const lead=Number(p.minutes);if(!Number.isFinite(lead)||lead<1||lead>60)continue;events.push({key,label,at:instantAt(y,m,d,hm[0],hm[1],tz),minutes:Math.max(1,Math.min(60,Math.round(lead))),sound:p.sound||"system"});';
    if (text.indexOf(oldPush) !== -1) text = text.split(oldPush).join(newPush);

    var styleNeedle = '";document.head.appendChild(st);render._homeAlarmStyle=true;';
    var styleExtra =
      '.home-alarm-lead-value{font-weight:600;color:#246f9e;font-size:.92rem;display:block;margin:4px 0}' +
      '.home-alarm-lead-range{width:100%;accent-color:#246f9e;height:2rem}' +
      styleNeedle;
    if (text.indexOf(styleNeedle) !== -1) text = text.split(styleNeedle).join(styleExtra);

    (0, eval)(text);
  } catch (e) {
    console.error("Yom Time home-dashboard bootstrap failed", e);
  }
})();
