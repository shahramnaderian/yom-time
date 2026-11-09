// Generate original, short alarm melodies as PCM WAV files for Android notification channels.
const fs = require("node:fs");
const path = require("node:path");
const rate = 22050;
const tracks = {
  alarm_chime: [[72,.18],[76,.18],[79,.24],[84,.38]],
  alarm_morning_bells: [[76,.24],[83,.24],[88,.30],[83,.24],[88,.42]],
  alarm_cheerful_piano: [[72,.20],[76,.20],[79,.20],[84,.20],[79,.34]],
  alarm_soft_marimba: [[67,.22],[72,.22],[76,.22],[79,.36]]
};
function midiHz(n){return 440*Math.pow(2,(n-69)/12);}
function render(notes){
  const gap=.045, duration=notes.reduce((s,n)=>s+n[1]+gap,0)+.12;
  const count=Math.ceil(duration*rate), samples=new Float32Array(count);
  let offset=0;
  for(const [midi,len] of notes){
    const hz=midiHz(midi), start=Math.floor(offset*rate), end=Math.min(count,Math.floor((offset+len)*rate));
    for(let i=start;i<end;i++){
      const t=(i-start)/rate, progress=t/len;
      const attack=Math.min(1,progress/.025), decay=Math.pow(Math.max(0,1-progress),1.35);
      const fundamental=Math.sin(2*Math.PI*hz*t);
      const harmonic=.24*Math.sin(2*Math.PI*hz*2.01*t);
      const overtone=.09*Math.sin(2*Math.PI*hz*3.98*t);
      samples[i]+=(fundamental+harmonic+overtone)*attack*decay*.24;
    }
    offset+=len+gap;
  }
  const data=Buffer.alloc(count*2);
  for(let i=0;i<count;i++){const v=Math.max(-1,Math.min(1,samples[i]));data.writeInt16LE(Math.round(v*32767),i*2);}
  const header=Buffer.alloc(44);
  header.write("RIFF",0);header.writeUInt32LE(36+data.length,4);header.write("WAVE",8);
  header.write("fmt ",12);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);
  header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);
  header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write("data",36);header.writeUInt32LE(data.length,40);
  return Buffer.concat([header,data]);
}
const out=path.join("android","app","src","main","res","raw");fs.mkdirSync(out,{recursive:true});
for(const [name,notes] of Object.entries(tracks)){const file=path.join(out,name+".wav");fs.writeFileSync(file,render(notes));console.log(file);}
