(() => {
'use strict';
const canvas=document.getElementById('art'),ctx=canvas.getContext('2d'),W=1200,H=800;
const inkLayer=document.createElement('canvas'),colorLayer=document.createElement('canvas'),paper=document.createElement('canvas');
for(const c of [inkLayer,colorLayer,paper]){c.width=W;c.height=H;}
const ic=inkLayer.getContext('2d'),wc=colorLayer.getContext('2d'),pc=paper.getContext('2d');
const defaults={lineWidth:1,ink:.95,jitter:.9,retrace:.6,wash:1.15,edge:1,whiteSpace:18,grain:1,water:.55,speed:1,reflection:.75,people:85,duration:60};const settings={...defaults};let compositionSeed=1947,inkCount=0;
let seed=1947,commands=[],index=0,elapsed=0,last=null,paused=false;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function r(a,b){return a+rand()*(b-a);}
const facade='M 393 213 L 817 27 L 1155 27 L 1155 424 L 350 424 L 350 289 L 393 278 Z';
const leftWall='M 393 213 L 458 184 C 457 212 485 202 483 226 C 481 247 453 255 452 284 L 451 387 L 471 424 L 350 424 L 350 289 C 375 270 376 319 390 312 C 428 291 399 257 393 213 Z';
const middleWall='M 458 184 L 641 104 C 645 151 615 155 584 185 C 555 209 533 214 545 236 C 553 254 588 237 597 257 C 616 293 614 326 599 353 C 579 384 554 382 552 423 L 471 424 C 470 394 451 387 451 354 L 452 284 C 453 255 481 247 483 226 C 485 202 457 212 458 184 Z';
const rightWall='M 641 104 L 817 27 L 1018 27 C 962 62 939 99 960 116 C 982 135 1023 113 1044 154 C 1052 172 1032 176 1036 203 C 1096 291 1061 340 1017 365 C 985 385 976 401 975 424 L 796 424 C 794 387 765 376 753 352 C 718 301 731 252 747 211 C 760 178 798 163 820 141 C 850 111 825 100 786 101 C 722 105 662 145 641 104 Z';
const farWall='M 1018 27 L 1155 27 L 1155 340 L 975 366 C 1031 336 1078 302 1060 251 C 1050 220 1036 208 1036 203 C 1032 176 1052 172 1044 154 C 1023 113 982 135 960 116 C 939 99 962 62 1018 27 Z';
function line(path,width=1,alpha=.5,color='#3e4146'){commands.push({type:'ink',path,width,alpha,color});}
function fill(path,color,alpha=.4,reflection=false){commands.push({type:'wash',path,color,alpha,reflection});}
function poly(points){return 'M '+points.map(p=>p.join(' ')).join(' L ')+' Z';}
function blob(x,y,rx,ry){const pts=[];for(let i=0;i<24;i++){const a=i/24*Math.PI*2,s=1+r(-.18,.16)*settings.edge;pts.push([x+Math.cos(a)*rx*s,y+Math.sin(a)*ry*s]);}return poly(pts);}
function wash(path,color,alpha=.4,reflect=false){fill(path,color,alpha,reflect);}
function build(){
 seed=compositionSeed;commands=[];
 // Air and large pigment veils, with irregular footprints and visible paper.
 for(let i=0;i<54;i++){const x=45+i%14*85+r(-18,18),y=52+Math.floor(i/14)*62+r(-12,12);wash(blob(x,y,r(48,92),r(38,68)),i%4?'#5c91db':'#3568c0',r(.3,.5));commands[commands.length-1].sky=true;}
 for(let i=0;i<80;i++)wash(blob(r(45,1160),r(470,747),r(50,120),r(20,53)),i%3?'#435d83':'#2d4264',r(.20,.32));
 // Two residential towers at the left edge, deliberately drawn in loose perspective.
 const towers=[{x:42,y:85,w:109,h:321},{x:196,y:164,w:117,h:249}];
 for(const t of towers){
  const shape=poly([[t.x,t.y],[t.x+t.w*.73,t.y+5],[t.x+t.w,t.y+25],[t.x+t.w,t.y+t.h],[t.x,t.y+t.h]]);
  wash(shape,'#68717d',.72,true);line(shape,1.3,.7);
  const roof=poly([[t.x-5,t.y],[t.x+12,t.y-15],[t.x+t.w*.7,t.y-8],[t.x+t.w*.8,t.y+5]]);wash(roof,'#e9c171',.6,true);line(roof,1,.65);
  line(`M ${t.x+20} ${t.y-13} L ${t.x+21} ${t.y-33}`,1,.55);
  for(let col=0;col<7;col++){
   const x=t.x+8+col*(t.w-15)/7;line(`M ${x} ${t.y+10} L ${x+r(-2,2)} ${t.y+t.h}`,r(.5,1.1),.45);
   for(let row=0;row<24;row++){const y=t.y+23+row*(t.h-30)/24;line(`M ${x} ${y} l 10 1`,.6,.35);if(rand()>.38)wash(poly([[x,y-6],[x+7,y-5],[x+7,y],[x,y]]),rand()>.3?'#ffd983':'#7f9eb1',r(.25,.7),true);}
  }
  for(let row=0;row<22;row++){const y=t.y+30+row*(t.h-35)/22;line(`M ${t.x} ${y} L ${t.x+t.w} ${y+2}`, .6,.25);}
  for(let k=0;k<3;k++)wash(blob(t.x+20+k*27,t.y+t.h*.55,2,t.h*.43),'#94b8d1',.16,true);
 }
 wash(poly([[158,234],[183,211],[197,225],[195,411],[156,412]]),'#666a69',.5,true);
 for(let i=0;i<14;i++)line(`M 162 ${242+i*11} L 190 ${240+i*11}`, .65,.35);
 // Glowing glazing is underneath the sculptural opaque walls.
 wash(facade,'#edb951',.8,true);commands[commands.length-1].glazing=true;line(facade,1.7,.72);
 for(let i=0;i<34;i++){wash(blob(r(409,982),r(140,415),r(18,52),r(20,55)),i%3?'#ffd265':'#e88b28',.24);commands[commands.length-1].glazing=true;}
 for(let x=408;x<1150;x+=22){line(`M ${x} ${Math.max(29,213-(x-393)*.439)} L ${x+r(-1,1)} 423`,r(.6,1.4),.72,'#494c49');commands[commands.length-1].glazing=true;}
 for(let y=103;y<420;y+=37){const start=Math.max(393,393+(213-y)/.439);line(`M ${start} ${y} L 1155 ${y-12}`,1.1,.66,'#494c49');commands[commands.length-1].glazing=true;}
 for(const [path,color,alpha] of [[leftWall,'#aba18a',.83],[middleWall,'#827d73',.86],[rightWall,'#726a6b',.95],[farWall,'#b3a089',.7]]){
  wash(path,color,alpha*.55,true);line(path,2.1,.67);
  const shape=new Path2D(path);for(let j=0;j<36;j++){let x,y,tries=0;do{x=r(350,1155);y=r(28,424);tries++;}while(!ctx.isPointInPath(shape,x,y)&&tries<250);if(tries<250)commands.push({type:'wet',path,x,y,radius:r(18,46),color:j%4===0?'#8f7160':color,amount:r(.045,.11)});}
  // Second transparent veil makes the flat geometry read as watercolor pigment.
  wash(path,'#797268',.09,true);
 }
 for(const path of [leftWall,middleWall,rightWall])commands.push({type:'rim',path});
 // Pinprick facade lights, clipped to the walls.
 for(let i=0;i<140;i++){const x=r(367,605),y=r(215,414);const target=x<448?leftWall:middleWall;commands.push({type:'dot',x,y,rx:r(.7,1.8),ry:r(1.2,2.8),color:'#ffe7a0',alpha:r(.35,.8),clip:target,reflection:true});}
 wash(poly([[972,372],[1155,348],[1155,424],[973,424]]),'#749991',.45,true);
 for(let x=978;x<1155;x+=32)line(`M ${x} 365 L ${x} 424`,1,.6);
 line('M 973 401 L 1155 394',1,.55);
 // Trees and low planting frame the street, with broken silhouettes.
 for(let i=0;i<34;i++){const x=48+i*9,y=r(371,410);wash(blob(x,y,r(9,22),r(11,24)),i%2?'#284d37':'#65752e',.56,true);line(`M ${x} ${y-2} l 0 ${424-y} M ${x} ${y+9} l -8 -11`,.8,.65);}
 wash(poly([[39,424],[1158,421],[1160,443],[40,447]]),'#b7a895',.45);
 line('M 41 424 L 1155 424',1.3,.64);line('M 43 445 L 1155 440',1,.5);
 // Tiny gestural figures rather than individual photographic details.
 for(let i=0;i<settings.people;i++){
  const x=r(47,1143),y=r(410,430),h=r(9,23),color=['#282d37','#43556c','#ad854a','#9f3539'][Math.floor(r(0,4))];
  wash(blob(x,y-h+2,1.8,2.1),color,.8,true);
  line(`M ${x} ${y-h+5} L ${x+r(-1,1)} ${y-5} M ${x} ${y-7} l -3 7 M ${x} ${y-7} l 3 7`,r(.8,1.8),.65,color);
  wash(blob(x,y-h*.5,2,h*.24),color,.55,true);
 }
 for(let i=0;i<45;i++)commands.push({type:'dot',x:r(48,1150),y:r(434,451),rx:r(1,2.5),ry:.65,color:i%3?'#edc4d9':'#94c7ef',alpha:.8});
 // Blue submerged lights and luminous reflected pigment.
 for(const [x,y,rx] of [[205,581,15],[473,517,13],[753,545,13],[864,651,22]]){
  wash(blob(x,y,rx*2.4,rx*.48),'#4c91bb',.17);wash(blob(x,y,rx*1.4,rx*.24),'#429bd1',.38);wash(blob(x,y,rx*.7,rx*.12),'#c2e7ef',.9);line(`M ${x-rx} ${y} Q ${x} ${y-8} ${x+rx} ${y} Q ${x} ${y+8} ${x-rx} ${y}`, .8,.4,'#396c92');
 }
 // Horizontal dry brush marks break up the reflected architecture.
 for(let i=0;i<140;i++){const x=r(48,1150),y=r(477,752);wash(blob(x,y,r(6,30),r(.25,1.3)),i%3?'#f2ece0':'#718499',r(.05,.15));}
 // Generate reflected lines as separate water-broken pen marks.
 const reflectionLines=commands.filter(c=>c.type==='ink'&&rand()<.38).map(c=>({...c,reflection:true,alpha:c.alpha*.45}));
 const inks=commands.filter(c=>c.type==='ink'),colors=commands.filter(c=>c.type!=='ink');
 const paths=[...inks,...reflectionLines],segments=[];
 const sampler=document.createElementNS('http://www.w3.org/2000/svg','path');
 for(const c of paths){sampler.setAttribute('d',c.path);const length=sampler.getTotalLength();
  for(let d=0;d<length;d+=7){if(rand()<.025)continue;const a=sampler.getPointAtLength(d),b=sampler.getPointAtLength(Math.min(length,d+7));const dx=Math.sin(d*.3)*settings.jitter,dy=Math.cos(d*.21)*settings.jitter;
   segments.push({...c,path:`M ${a.x+dx} ${a.y+dy} L ${b.x+dx} ${b.y+dy}`,width:c.width*r(.65,1.15)});
   if(rand()<settings.retrace*.2)segments.push({...c,path:`M ${a.x+dx+1} ${a.y+dy-1} L ${b.x+dx+1} ${b.y+dy-1}`,alpha:c.alpha*.3,width:c.width*.65});
  }
 }
 inkCount=segments.length;commands=[...segments,...colors];
}
const pigmentCache=new Map();
function noise(x,y,period=256){const hash=(a,b)=>{a=((a%period)+period)%period;b=((b%period)+period)%period;let n=Math.imul(a,374761393)+Math.imul(b,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};const xx=Math.floor(x),yy=Math.floor(y),u=x-xx,v=y-yy,tx=u*u*(3-2*u),ty=v*v*(3-2*v);return (hash(xx,yy)*(1-tx)+hash(xx+1,yy)*tx)*(1-ty)+(hash(xx,yy+1)*(1-tx)+hash(xx+1,yy+1)*tx)*ty;}
function pigment(color){
 const key=color+':'+settings.grain+':'+settings.whiteSpace;if(pigmentCache.has(key))return pigmentCache.get(key);
 const tile=document.createElement('canvas');tile.width=tile.height=256;const tc=tile.getContext('2d'),data=tc.createImageData(256,256),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,n=noise(x/32,y/32,8)*.5+noise(x/8,y/8,32)*.3+noise(x/2,y/2,128)*.2,g=noise(x*2,y*2,512),density=.35+n*.9,white=g<settings.whiteSpace/100*.025;
  const dark=1-(g>.7?(g-.7)*settings.grain*.25:0);for(let j=0;j<3;j++)data.data[i+j]=rgb[j]*dark;
  data.data[i+3]=white?0:Math.min(255,density*255*(1-settings.grain*.13+g*settings.grain*.18));
 }tc.putImageData(data,0,0);const pattern=wc.createPattern(tile,'repeat');pigmentCache.set(key,pattern);return pattern;
}
function glassClip(c){if(!c.glazing)return;wc.clip(new Path2D(facade));for(const wall of [leftWall,middleWall,rightWall,farWall])wc.clip(new Path2D('M 0 0 H 1200 V 800 H 0 Z '+wall),'evenodd');}
function paintShape(c,reflection=false){
 wc.save();if(reflection){wc.translate(0,774.72);wc.scale(1,-.78);wc.globalAlpha=Math.min(1,c.alpha*settings.wash*settings.reflection);}glassClip(c);if(c.sky){wc.clip(new Path2D('M0 0H1200V800H0Z '+facade),'evenodd');for(const tower of ['M42 85L121.57 90L151 110L151 406L42 406Z','M196 164L281.41 169L313 189L313 413L196 413Z'])wc.clip(new Path2D('M0 0H1200V800H0Z '+tower),'evenodd');}
 const path=new Path2D(c.path);wc.fillStyle=pigment(c.color);wc.fill(path);
 // Granular pigment gathers at broken wet edges, with translucent pooling.
 wc.strokeStyle=c.color;wc.globalAlpha*=.18*settings.edge;wc.lineWidth=1.3;wc.setLineDash([3,5,8,4]);wc.stroke(path);wc.restore();
}
// A wet-paper layer is generated from brush deposits, never from a reference bitmap.
const FW=300,FH=200,FN=FW*FH,wetCanvas=document.createElement('canvas');wetCanvas.width=FW;wetCanvas.height=FH;
const wetCtx=wetCanvas.getContext('2d');let wetWater,wetMobile,wetFixed,wetBuffer,wetTerrain,wetDirty=false,wetImage;
function resetWet(){wetWater=new Float32Array(FN);wetMobile=Array.from({length:3},()=>new Float32Array(FN));wetFixed=Array.from({length:3},()=>new Float32Array(FN));wetBuffer=new Float32Array(FN);wetTerrain=Float32Array.from({length:FN},(_,i)=>noise(i%FW*2,Math.floor(i/FW)*2,512));wetImage=wetCtx.createImageData(FW,FH);wetCtx.clearRect(0,0,FW,FH);wetDirty=false;}
function depositWet(c,reflected=false){
 const cx=c.x/4,cy=(reflected?774.72-c.y*.78:c.y)/4,rad=c.radius/4,mask=new Path2D(c.path),rgb=[1,3,5].map(k=>parseInt(c.color.slice(k,k+2),16)),abs=rgb.map(v=>-Math.log(Math.max(.03,v/255)));
 for(let y=Math.max(1,Math.floor(cy-rad));y<Math.min(FH-1,cy+rad);y++)for(let x=Math.max(1,Math.floor(cx-rad));x<Math.min(FW-1,cx+rad);x++){
  const i=y*FW+x,d=Math.hypot(x-cx,y-cy)/rad;if(d>1+(wetTerrain[i]-.5)*.2)continue;
  const originalY=reflected?(774.72-y*4)/.78:y*4;if(!ctx.isPointInPath(mask,x*4,originalY))continue;
  if(wetTerrain[i]<settings.whiteSpace/100*.12)continue;
  const amount=c.amount*settings.wash*(reflected?settings.reflection:1)*(.7+wetTerrain[i]*.5);
  wetWater[i]=Math.min(2,wetWater[i]+amount*(.3+settings.water*2));for(let k=0;k<3;k++)wetMobile[k][i]+=abs[k]*amount;
 }wetDirty=true;
}
function simulateWet(){
 if(!wetDirty)return;wetBuffer.fill(0);
 for(let y=1;y<FH-1;y++)for(let x=1;x<FW-1;x++){const i=y*FW+x,w=wetWater[i];if(w<.00001)continue;const flow=.045*settings.water;wetBuffer[i]+=w*(1-flow*4)*.982;
  let edge=0;for(const j of [i-1,i+1,i-FW,i+FW]){wetBuffer[j]+=w*flow*.982;if(wetWater[j]<w*.3)edge++;}
  const rate=Math.min(.6,.04+(1-Math.min(1,w))*.045+wetTerrain[i]*settings.grain*.025+edge*settings.edge*.014);
  for(let k=0;k<3;k++){const mass=wetMobile[k][i]*rate;wetFixed[k][i]+=mass;wetMobile[k][i]-=mass;}
 }wetWater.set(wetBuffer);
 for(let k=0;k<3;k++){wetBuffer.fill(0);for(let y=1;y<FH-1;y++)for(let x=1;x<FW-1;x++){const i=y*FW+x,m=wetMobile[k][i];if(m<.000001)continue;const f=Math.min(.10,wetWater[i]*.1)*settings.water;wetBuffer[i]+=m*(1-f*4);for(const j of [i-1,i+1,i-FW,i+FW])wetBuffer[j]+=m*f;}wetMobile[k].set(wetBuffer);}
}
function renderWet(){if(!wetDirty)return;for(let i=0;i<FN;i++){for(let k=0;k<3;k++)wetImage.data[i*4+k]=255*Math.exp(-wetFixed[k][i]*(1+(wetTerrain[i]-.5)*settings.grain*.45)-wetMobile[k][i]);wetImage.data[i*4+3]=255;}wetCtx.putImageData(wetImage,0,0);ctx.drawImage(wetCanvas,0,0,W,H);}
function draw(c){
 if(c.type==='wet'){depositWet(c);depositWet(c,true);return;}
 if(c.type==='ink'){ic.save();if(c.reflection){ic.translate(0,774.72);ic.scale(1,-.78);ic.globalAlpha=settings.reflection;}
  if(c.glazing){ic.clip(new Path2D(facade));for(const wall of [leftWall,middleWall,rightWall,farWall])ic.clip(new Path2D('M 0 0 H 1200 V 800 H 0 Z '+wall),'evenodd');}
  ic.strokeStyle=c.color;ic.globalAlpha=Math.min(1,ic.globalAlpha*c.alpha*settings.ink);ic.lineWidth=c.width*settings.lineWidth;ic.lineJoin='round';ic.lineCap='round';ic.stroke(new Path2D(c.path));ic.restore();return;
 }
 wc.save();wc.globalAlpha=c.alpha===undefined?.4:Math.min(1,c.alpha*settings.wash);
 if(c.type==='wash'){paintShape(c);if(c.reflection)paintShape(c,true);}
 if(c.type==='rim'){wc.strokeStyle='#ebdcc3';wc.globalAlpha=.38*settings.wash;wc.lineWidth=3;wc.stroke(new Path2D(c.path));}
 if(c.type==='dot'){
  wc.save();if(c.clip)wc.clip(new Path2D(c.clip));wc.fillStyle=c.color;wc.beginPath();wc.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2);wc.fill();wc.restore();
  if(c.reflection){wc.globalAlpha*=settings.reflection;wc.fillStyle=c.color;wc.beginPath();wc.ellipse(c.x,774.72-c.y*.78,c.rx,c.ry*.9,0,0,Math.PI*2);wc.fill();}
 }wc.restore();
}
function makePaper(){seed=273;pc.fillStyle='#f8f4eb';pc.fillRect(0,0,W,H);for(let i=0;i<85000;i++){pc.fillStyle=`rgba(101,85,66,${r(.01,.055)*settings.grain})`;pc.fillRect(r(0,W),r(0,H),r(.4,1.4),r(.4,1.6));}}
function render(){ctx.clearRect(0,0,W,H);ctx.drawImage(paper,0,0);ctx.globalCompositeOperation='multiply';ctx.drawImage(colorLayer,0,0);renderWet();ctx.drawImage(inkLayer,0,0);ctx.globalCompositeOperation='source-over';document.getElementById('status').textContent=index===commands.length?'作品完成':index<inkCount?'逐筆墨線 · 建築、人物與倒影':'透明水彩 · 底染與疊色';document.getElementById('seek').value=Math.round(Math.min(1,elapsed/settings.duration)*1000);document.getElementById('progress').value=Math.round(Math.min(1,elapsed/settings.duration)*100)+'%';}
function reset(){pigmentCache.clear();resetWet();ic.clearRect(0,0,W,H);wc.clearRect(0,0,W,H);makePaper();build();index=0;elapsed=0;last=null;paused=false;document.getElementById('pause').textContent='暫停';render();}
function advance(target){while(index<target&&index<commands.length){draw(commands[index++]);if(index>inkCount&&index%10===0)simulateWet();}if(index>inkCount)simulateWet();render();}
function frame(now){if(last!==null&&!paused&&index<commands.length){elapsed+=Math.min(.1,(now-last)/1000)*settings.speed;advance(targetAt(elapsed/settings.duration));}last=now;requestAnimationFrame(frame);}
document.getElementById('replay').onclick=reset;
document.getElementById('finish').onclick=()=>{elapsed=settings.duration;advance(commands.length);for(let i=0;i<70;i++)simulateWet();render();};
document.getElementById('pause').onclick=()=>{paused=!paused;document.getElementById('pause').textContent=paused?'繼續':'暫停';};
document.getElementById('save').onclick=()=>{const a=document.createElement('a');a.download='theater-at-dusk-watercolor.png';a.href=canvas.toDataURL('image/png');a.click();};
function targetAt(t){t=Math.max(0,Math.min(1,t));return t<.4?Math.floor(t/.4*inkCount):inkCount+Math.floor((t-.4)/.6*(commands.length-inkCount));}
function values(){for(const key of Object.keys(settings)){document.getElementById(key).value=settings[key];document.getElementById(key+'-value').value=settings[key]+(key==='whiteSpace'?'%':key==='duration'?' 秒':key==='people'?' 人':'×');}}
let refreshTimer;
for(const key of Object.keys(settings)){document.getElementById(key).oninput=e=>{
 const fraction=elapsed/settings.duration;settings[key]=Number(e.target.value);values();if(key==='duration'){elapsed=fraction*settings.duration;return;}if(key==='speed')return;
 clearTimeout(refreshTimer);refreshTimer=setTimeout(()=>{const t=elapsed,p=paused;reset();elapsed=t;advance(targetAt(elapsed/settings.duration));paused=p;document.getElementById('pause').textContent=p?'繼續':'暫停';},100);
};}
document.getElementById('seek').oninput=e=>{clearTimeout(refreshTimer);const t=Number(e.target.value)/1000*settings.duration,p=paused;reset();elapsed=t;advance(targetAt(t/settings.duration));paused=p;document.getElementById('pause').textContent=p?'繼續':'暫停';};
document.getElementById('reset').onclick=()=>{clearTimeout(refreshTimer);const t=elapsed/settings.duration,p=paused;Object.assign(settings,defaults);values();reset();elapsed=t*settings.duration;advance(targetAt(t));paused=p;document.getElementById('pause').textContent=p?'繼續':'暫停';};
document.getElementById('new').onclick=()=>{clearTimeout(refreshTimer);compositionSeed=Math.floor(Math.random()*10000000);reset();};
document.getElementById('replay').onclick=()=>{clearTimeout(refreshTimer);reset();};
document.getElementById('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await canvas.parentElement.requestFullscreen();}catch(e){document.getElementById('status').textContent='瀏覽器未開啟全螢幕，請使用瀏覽器的全螢幕功能。';}};
values();reset();requestAnimationFrame(frame);
})();
