(() => {
'use strict';
const D=window.TheaterPigments,$=id=>document.getElementById(id),canvas=$('art'),ctx=canvas.getContext('2d');
canvas.width=D.width;canvas.height=D.height;
const W=D.width,H=D.height,paper=document.createElement('canvas'),paint=document.createElement('canvas'),resolution=Math.max(1,Math.min(4,Number(new URLSearchParams(location.search).get('resolution'))||4));
for(const c of [paper,paint]){c.width=W;c.height=H;}
const pc=paper.getContext('2d'),cc=paint.getContext('2d');
paint.width=W*resolution;paint.height=H*resolution;cc.scale(resolution,resolution);
const defaults={lineWidth:1,ink:1,jitter:.65,retrace:.35,wash:1.12,edge:1,whiteSpace:18,grain:1,water:.6,speed:1,reflection:1,people:120,duration:90};
const settings={...defaults},names=['天空 · 濕染與雲層','樓群 · 窗格與燈火','遠景','劇院 · 曲面、窗光與積色','街景 · 人物與樹木','水池 · 倒影與碎光'];
let seed=4827,elapsed=0,last=null,paused=false,events=[],index=0,timer;
const hash=n=>{let x=Math.imul(n+seed,374761393);x=Math.imul(x^(x>>>13),1274126177);return ((x^(x>>>16))>>>0)/4294967295;};
function build(){
 events=[];
 // Retain the short, independently deposited pen segments selected earlier.
 const inkPaths=D.ink.map(path=>{const x=path.reduce((s,p)=>s+p[0],0)/path.length,y=path.reduce((s,p)=>s+p[1],0)/path.length;return{path,region:y>=590?5:y>=495?4:x<462?1:3};}).sort((a,b)=>a.region-b.region||b.path.length-a.path.length);
 for(const {path} of inkPaths)for(let j=1;j<path.length;j++){
  const a=path[j-1],b=path[j],length=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(length/7);
  for(let k=0;k<steps;k++){const u=k/steps,v=(k+1)/steps;events.push({kind:'ink',a:[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],b:[a[0]+(b[0]-a[0])*v,a[1]+(b[1]-a[1])*v],end:0});}
 }
 const inkCount=events.length;events.forEach((e,i)=>e.end=.18*(i+1)/inkCount);
 D.layers.forEach((layer,li)=>{
  const start=li===0?.18:.4,span=li===0?.22:.6;
  const weights=layer.marks.map(m=>Math.max(1,Math.sqrt(m[4]))),total=weights.reduce((a,b)=>a+b,0);let sum=0;
  layer.marks.forEach((m,i)=>{
   const [color,region,x,y,area,d,w,h]=m,p=new Path2D(d),weight=weights[i];
   const count=area>1000?Math.min(48,Math.ceil(Math.max(w,h)/24)):1;
   const vertical=region===1||region===3,horizontal=region===5;
   for(let s=0;s<count;s++)events.push({kind:'pigment',p,color:layer.palette[color],region,x,y,area,w,h,s,count,vertical:vertical&&!horizontal,stroke:layer.stroke,layer:li,id:i,end:start+span*(sum+weight*(s+1)/count)/total});
   sum+=weight;
  });
 });
}
function draw(e,n){
 cc.save();
 if(e.kind==='ink'){
  const offset=(hash(n)-.5)*1.3*settings.jitter;
  cc.strokeStyle='#292b2e';cc.globalAlpha=.45*settings.ink;cc.lineWidth=.7*settings.lineWidth*(.65+hash(n+3)*.55);cc.lineCap='round';
  cc.beginPath();cc.moveTo(e.a[0]+offset,e.a[1]-offset);cc.lineTo(e.b[0]+offset,e.b[1]-offset);cc.stroke();
  cc.restore();return;
 }
 const deviation=settings.wash/defaults.wash;
 let alpha=Math.min(1,deviation);
 if(e.region===5)alpha*=Math.min(1,settings.reflection);
 if(e.layer===1&&e.area<20&&e.region===4&&hash(e.id)>settings.people/120){cc.restore();return;}
 if(e.layer===1&&e.area<15&&hash(e.id+9)<Math.max(0,settings.whiteSpace-18)/130){cc.restore();return;}
 cc.globalAlpha=alpha;
 const rgb=e.color.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)),lum=rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
 const inkShape=e.layer===1&&lum<100&&e.area<2500;
 let color=e.color;
 if(inkShape){
  const strength=Math.max(.15,settings.ink+(settings.retrace-.35)*.12),channels=rgb.map(v=>Math.round(Math.max(0,Math.min(255,strength<=1?v+(255-v)*(1-strength):v/strength))));
  color=`rgb(${channels.join(',')})`;
  const jitter=(settings.jitter-.65)*(hash(e.id)-.5)*.65;cc.translate(jitter,-jitter);
 }
 cc.fillStyle=color;cc.strokeStyle=color;cc.lineWidth=e.stroke*(inkShape?settings.lineWidth:Math.max(.5,settings.edge));
 if(e.layer===0)cc.lineWidth+=Math.max(0,settings.water-.6)*4;
 if(e.layer===1&&!inkShape)cc.lineWidth=Math.max(.03,cc.lineWidth+(settings.water-.6)*.4);
 // Broad connected washes are deposited in contiguous brush sweeps, not faded in.
 if(e.count>1){
  cc.beginPath();const full=e.vertical?e.h:e.w,size=full/e.count;
  if(e.vertical)cc.rect(e.x-e.w/2-2,e.y-e.h/2+e.s*size-1,e.w+4,size+2);
  else cc.rect(e.x-e.w/2+e.s*size-1,e.y-e.h/2-2,size+2,e.h+4);
  cc.clip();
 }
 const variation=(seed===4827?0:(hash(e.id)-.5)*.3)+Math.max(0,settings.edge-1)*.2;
 if(variation)cc.translate(Math.sin(e.id)*variation,Math.cos(e.id)*variation);
 if(settings.water<.6&&e.layer===1&&e.area<3)cc.globalAlpha*=1-(.6-settings.water)*.2;
 cc.fill(e.p,'evenodd');cc.stroke(e.p);
 if(deviation>1){cc.globalCompositeOperation='multiply';cc.globalAlpha=Math.min(.5,(deviation-1)*.3);cc.fill(e.p,'evenodd');}
 cc.restore();
}
function makePaper(){pc.fillStyle='#faf8ee';pc.fillRect(0,0,W,H);}
function render(){
 ctx.clearRect(0,0,W,H);ctx.drawImage(paper,0,0);ctx.save();if(settings.grain<1)ctx.filter=`blur(${(1-settings.grain)*.35}px)`;ctx.drawImage(paint,0,0,W,H);ctx.restore();
 const delta=settings.grain-1;
 if(delta>0){ctx.fillStyle=`rgba(83,65,45,${delta*.035})`;for(let n=0;n<16000;n++)ctx.fillRect(hash(n)*W,hash(n+17000)*H,.7,.7);}
 const t=Math.min(1,elapsed/settings.duration);$('seek').value=Math.round(t*1000);$('progress').value=Math.round(t*100)+'%';
 const e=events[Math.max(0,index-1)];$('status').textContent=index===events.length?'重建繪製完成':e?.kind==='ink'?'逐筆墨線 · 建築與人物':names[e?.region??0];
}
function advance(t){while(index<events.length&&events[index].end<=t){draw(events[index],index);index++;}render();}
function reset(){cc.clearRect(0,0,W,H);makePaper();index=0;elapsed=0;last=null;render();}
function values(){for(const key of Object.keys(settings)){$(key).value=settings[key];$(key+'-value').value=settings[key]+(key==='whiteSpace'?'%':key==='duration'?' 秒':key==='people'?'':'×');}}
function redraw(t,p){reset();elapsed=t*settings.duration;advance(t);paused=p;$('pause').textContent=p?'繼續':'暫停';}
for(const key of Object.keys(settings))$(key).oninput=e=>{const t=elapsed/settings.duration;settings[key]=+e.target.value;values();if(key==='duration'){elapsed=t*settings.duration;return;}if(key==='speed')return;clearTimeout(timer);timer=setTimeout(()=>redraw(t,paused),100);};
$('seek').oninput=e=>{clearTimeout(timer);redraw(+e.target.value/1000,paused);};
$('replay').onclick=()=>{clearTimeout(timer);reset();paused=false;$('pause').textContent='暫停';};
$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'繼續':'暫停';};
$('finish').onclick=()=>{clearTimeout(timer);elapsed=settings.duration;advance(1);};
$('new').onclick=()=>{seed=Math.floor(Math.random()*10000000);reset();paused=false;};
$('reset').onclick=()=>{clearTimeout(timer);const t=elapsed/settings.duration,p=paused;seed=4827;Object.assign(settings,defaults);values();redraw(t,p);};
$('save').onclick=()=>{const a=document.createElement('a');a.download='theater-at-dusk-reconstruction.png';a.href=canvas.toDataURL();a.click();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await canvas.parentElement.requestFullscreen();}catch{$('status').textContent='請使用瀏覽器的全螢幕功能。';}};
function frame(now){if(last!==null&&!paused&&index<events.length){elapsed+=Math.min(.1,(now-last)/1000)*settings.speed;advance(Math.min(1,elapsed/settings.duration));}last=now;requestAnimationFrame(frame);}
build();values();reset();requestAnimationFrame(frame);
})();
