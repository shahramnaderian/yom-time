(function(g) {
  "use strict";
  const SE = g.SE = g.SE || {};
  const SOUND_OPTIONS = [
    { id:"adhan", labelFa:"اذان", labelEn:"Adhan", icon:"🕌" },
    { id:"happy-chime", labelFa:"زنگ شاد", labelEn:"Happy chime", icon:"✨" },
    { id:"morning-bells", labelFa:"ناقوس صبحگاهی", labelEn:"Morning bells", icon:"🌞" },
    { id:"cheerful-piano", labelFa:"پیانوی شاد", labelEn:"Cheerful piano", icon:"🎹" },
    { id:"soft-marimba", labelFa:"ماریمبای ملایم", labelEn:"Soft marimba", icon:"🎵" },
    { id:"default", labelFa:"صدای اعلان", labelEn:"Notification", icon:"🔔" },
    { id:"system", labelFa:"صدای پیش‌فرض اعلان", labelEn:"Default notification", icon:"🔔" },
    { id:"custom-ringtone", labelFa:"زنگ دلخواه گوشی", labelEn:"Choose phone sound", icon:"📲" },
    { id:"silent", labelFa:"بی‌صدا", labelEn:"Silent", icon:"🔇" }
  ];
  const DEFAULT_SOUND = "adhan";
  const TONES = {
    "happy-chime": { file:"alarm_chime.wav", channel:"prayer-happy-chime-v3", notes:[{n:72,d:.16},{n:76,d:.16},{n:79,d:.22},{n:84,d:.34}] , wave:"sine" },
    "morning-bells": { file:"alarm_morning_bells.wav", channel:"prayer-morning-bells-v3", notes:[{n:76,d:.22},{n:83,d:.22},{n:88,d:.28},{n:83,d:.22},{n:88,d:.38}], wave:"sine" },
    "cheerful-piano": { file:"alarm_cheerful_piano.wav", channel:"prayer-cheerful-piano-v3", notes:[{n:72,d:.18},{n:76,d:.18},{n:79,d:.18},{n:84,d:.18},{n:79,d:.3}], wave:"triangle" },
    "soft-marimba": { file:"alarm_soft_marimba.wav", channel:"prayer-soft-marimba-v3", notes:[{n:67,d:.2},{n:72,d:.2},{n:76,d:.2},{n:79,d:.32}], wave:"sine" }
  };
  const ADHAN_FILES = {
    fajr:["sounds/adhan-fajr.mp3","sounds/adhan.mp3"],
    default:["sounds/adhan.mp3","sounds/adhan-fajr.mp3"]
  };
  function getSoundPref() {
    try { return SE.store.prefs.get("alarmSound", DEFAULT_SOUND); }
    catch(e) { return DEFAULT_SOUND; }
  }
  function setSoundPref(id) {
    if (!SOUND_OPTIONS.some(o=>o.id===id)) return false;
    SE.store.prefs.set("alarmSound",id);
    return true;
  }
  function listOptions(lang) {
    const isFa=lang!=="en", current=getSoundPref();
    return SOUND_OPTIONS.map(o=>({id:o.id,label:isFa?o.labelFa:o.labelEn,icon:o.icon,selected:o.id===current}));
  }
  function soundForNotification(alarmType) {
    const pref=getSoundPref();
    if(pref==="silent") return null;
    if(pref==="custom-ringtone") return undefined;
    if(pref==="adhan") return alarmType==="fajr"?"adhan_fajr.mp3":"adhan.mp3";
    return TONES[pref] ? TONES[pref].file : "default";
  }
  function channelForNotification(alarmType) {
    const pref=getSoundPref();
    if(pref==="silent") return "prayer-silent";
    if(pref==="custom-ringtone") return SE.store.prefs.get("customRingtoneChannelId", "prayer-ringtone-v2");
    if(pref==="adhan") return alarmType==="fajr"?"prayer-adhan-fajr-v2":"prayer-adhan-v2";
    return TONES[pref] ? TONES[pref].channel : "prayer-ringtone-v2";
  }
  let currentAudio=null, currentContext=null;
  function stopAdhan() {
    try { if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;currentAudio=null;} } catch(e) {}
    try { if(currentContext){currentContext.close();currentContext=null;} } catch(e) {}
  }
  async function playAdhan(alarmType,opts) {
    opts=opts||{}; stopAdhan();
    const base=opts.baseUrl||"";
    for(const file of (alarmType==="fajr"?ADHAN_FILES.fajr:ADHAN_FILES.default)) {
      try {
        const audio=new Audio(base+file); audio.preload="auto"; currentAudio=audio;
        await new Promise((resolve,reject)=>{
          audio.oncanplaythrough=resolve; audio.onerror=()=>reject(new Error("load failed"));
          setTimeout(()=>reject(new Error("timeout")),8000);
        });
        await audio.play(); return {ok:true,file};
      } catch(e) { currentAudio=null; }
    }
    return {ok:false,reason:"no_adhan_file"};
  }
  function playTone(id) {
    const tone=TONES[id], AudioCtx=g.AudioContext||g.webkitAudioContext;
    if(!tone||!AudioCtx) return Promise.resolve({ok:false,reason:"audio_unavailable"});
    stopAdhan();
    try {
      const ctx=new AudioCtx(); currentContext=ctx;
      const start=ctx.currentTime+.04;
      let offset=0;
      tone.notes.forEach((note,i)=>{
        const osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type=tone.wave; osc.frequency.value=440*Math.pow(2,(note.n-69)/12);
        gain.gain.setValueAtTime(.0001,start+offset);
        gain.gain.exponentialRampToValueAtTime(i===0?.19:.14,start+offset+.018);
        gain.gain.exponentialRampToValueAtTime(.0001,start+offset+note.d);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start+offset); osc.stop(start+offset+note.d+.025);
        offset+=note.d+.045;
      });
      return new Promise(resolve=>setTimeout(()=>{stopAdhan();resolve({ok:true,tone:id});},(offset+.15)*1000));
    } catch(e) { stopAdhan(); return Promise.resolve({ok:false,reason:String(e)}); }
  }
  async function onAlarmFire(alarmType,title,body,opts) {
    opts=opts||{};
    const pref=opts.soundMode==="adhan"||opts.soundMode==="system"||TONES[opts.soundMode]?opts.soundMode:getSoundPref();
    if(pref==="silent") return {ok:true,silent:true};
    if(pref==="custom-ringtone") return {ok:true,nativeChannel:true};
    if(pref==="adhan") { const r=await playAdhan(alarmType); if(r.ok)return r; }
    if(TONES[pref]) return playTone(pref);
    try {
      const ctx=new (g.AudioContext||g.webkitAudioContext)(), osc=ctx.createOscillator(), gain=ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value=alarmType==="fajr"?520:660;
      gain.gain.value=.15; osc.start(); setTimeout(()=>{try{osc.stop();ctx.close();}catch(e){}},800);
    } catch(e) {}
    return {ok:true};
  }
  async function preview(id) {
    const pref=id||getSoundPref();
    if(pref==="silent") return {ok:true,silent:true};
    if(pref==="custom-ringtone") return {ok:true,nativeChannel:true};
    if(pref==="adhan") {const r=await playAdhan("default");setTimeout(stopAdhan,4000);return r;}
    if(TONES[pref]) return playTone(pref);
    await onAlarmFire("dhuhr"); return {ok:true,beep:true};
  }
  SE.sounds={SOUND_OPTIONS,DEFAULT_SOUND,ADHAN_FILES,TONES,getSoundPref,setSoundPref,listOptions,soundForNotification,channelForNotification,playAdhan,playTone,stopAdhan,onAlarmFire,preview};
  if(typeof module!=="undefined"&&module.exports)module.exports=SE.sounds;
})(typeof globalThis!=="undefined"?globalThis:this);
