(() => {
'use strict';
const G=window.TheaterGeometry,W=G.width,H=G.height,$=id=>document.getElementById(id),canvas=$('art'),ctx=canvas.getContext('2d');
canvas.width=W;canvas.height=H;
const paper=document.createElement('canvas'),ink=document.createElement('canvas'),colors=document.createElement('canvas');
for(const c of [paper,ink,colors]){c.width=W;c.height=H;}
const pc=paper.getContext('2d'),ic=ink.getContext('2d'),cc=colors.getContext('2d');
const defaults={lineWidth:1,ink:1,jitter:.65,retrace:.35,wash:1.12,edge:1,whiteSpace:18,grain:1,water:.6,speed:1,reflection:1,people:120,duration:90};
const settings={...defaults};let compositionSeed=4827,seed=4827,events=[],index=0,elapsed=0,last=null,paused=false,inkEnd=0,phase='';
const materials=new Map(),clips=new Map();
const svg=document.createElementNS('http://www.w3.org/2000/svg','path');
const facade=new Path2D(G.facade),wallPaths=G.walls.map(w=>new Path2D(w.path)),initialPool=new Path2D(G.pool);let pool=initialPool,reflectionGaps,reservedPaper;const sourceSky=G.sky,sourcePool=G.pool;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}function r(a,b){return a+(b-a)*rand();}
function hash(x,y){let a=Math.imul(x+11,374761393)+Math.imul(y+19,668265263);a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967295;}
function noise(x,y,period=256){const xx=Math.floor(x),yy=Math.floor(y),f=x-xx,g=y-yy,u=f*f*(3-2*f),v=g*g*(3-2*g);const at=(a,b)=>hash(((a%period)+period)%period,((b%period)+period)%period);return (at(xx,yy)*(1-u)+at(xx+1,yy)*u)*(1-v)+(at(xx,yy+1)*(1-u)+at(xx+1,yy+1)*u)*v;}
function path(id){if(id==='glass')return G.facade;if(id==='sky')return G.sky;if(id==='pool')return G.pool;return G.walls.find(w=>w.id===id)?.path||G.towers.find(w=>w.id===id)?.face;}
function clip(region,c=cc){
 if(region==='glass'){c.clip(facade);for(const wall of G.walls)c.clip(new Path2D(`M -20 -20 H 1556 V 1044 H -20 Z ${wall.path}`),'evenodd');}
 else if(region==='sky'){c.clip(new Path2D(G.sky));c.clip(new Path2D(`M -20 -20 H 1556 V 1044 H -20 Z ${G.facade}`),'evenodd');for(const t of G.towers){c.clip(new Path2D(`M -20 -20 H 1556 V 1044 H -20 Z ${t.face}`),'evenodd');c.clip(new Path2D(`M -20 -20 H 1556 V 1044 H -20 Z ${t.side}`),'evenodd');}}
 else if(region==='poolDark'){c.clip(pool);const inverse=new Path2D('M -20 -20 H 1556 V 1044 H -20 Z'),transform=new DOMMatrix().translate(0,1100).scale(1,-.95);inverse.addPath(facade,transform);for(const w of wallPaths)inverse.addPath(w,transform);c.clip(inverse,'evenodd');}
 else if(region&&path(region))c.clip(new Path2D(path(region)));
}
function poly(points){return 'M '+points.map(p=>p.join(' ')).join(' L ')+' Z';}
function blot(x,y,rx,ry,phase=0){const pts=[];for(let i=0;i<38;i++){const a=i/38*Math.PI*2,v=1+settings.edge*(.10*Math.sin(a*5+phase)+.045*Math.sin(a*11-phase)+r(-.04,.04));pts.push([x+Math.cos(a)*rx*v,y+Math.sin(a)*ry*v]);}return poly(pts);}
function ribbon(x,y,length,width,angle){const points=[],dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;for(let i=0;i<=16;i++){const u=i/16,v=width*(.6+.3*Math.sin(u*Math.PI)+r(-.12,.12)),w=Math.sin(i*.6)*width*.15;points.push([x+dx*length*u+nx*(v+w),y+dy*length*u+ny*(v+w)]);}for(let i=16;i>=0;i--){const u=i/16,v=width*(.5+.3*Math.sin(u*Math.PI)+r(-.12,.12));points.push([x+dx*length*u-nx*v,y+dy*length*u-ny*v]);}return poly(points);}
function line(d,width=1,alpha=.65,region=null,color='#242b31',reflect=false){for(const piece of d.match(/M[^M]+/g)||[d])events.push({type:'line',path:piece,width,alpha,region,color,reflect,stage:phase});}
function wash(d,color,alpha=.6,region=null,reflect=false,role='wash'){events.push({type:'wash',path:d,color,alpha,region,reflect,role,stage:phase});}
function light(x,y,rx,ry,color='#fff0a4',reflect=false,region=null){events.push({type:'dot',x,y,rx,ry,color,alpha:1,reflect,region,stage:phase});}
function material(color,role){
 const key=color+role+settings.grain+settings.water+settings.whiteSpace;if(materials.has(key))return materials.get(key);
 const tile=document.createElement('canvas');tile.width=tile.height=512;const c=tile.getContext('2d'),data=c.createImageData(512,512),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 for(let y=0;y<512;y++)for(let x=0;x<512;x++){
  const i=(y*512+x)*4,big=noise(x/64,y/64,8),mid=noise((x+Math.sin(y*Math.PI/64)*6)/16,(y+Math.sin(x*Math.PI/64)*6)/16,32),fine=hash(x,y),small=noise((x+Math.sin(y*Math.PI/16)*1.7)/2,(y+Math.sin(x*Math.PI/32)*1.2)/2,256),n=.5*big+.4*mid+.1*small;
  const fiber=noise(x/2,y/2,256),density=.4+n*1.05;
  const dry=role==='dry'?settings.whiteSpace/100*.45:role==='foliage'?settings.whiteSpace/100*.18:settings.whiteSpace/100*.002;
  const holes=fine<dry||role==='dry'&&fiber<.25;
  const granulation=1+settings.grain*((small-.5)*.18+(fine-.5)*.06);
  const tone=(role==='wall'?.40+n*1.06:role==='sky'?.56+n*.80:role==='water'?.39+n*1.13:.85+n*.25)*granulation;
  for(let k=0;k<3;k++)data.data[i+k]=Math.min(255,rgb[k]*tone);
  data.data[i+3]=holes?0:255*Math.min(1,role==='figure'?.97:density*(role==='sky'?.65+n*.55:1));
 }c.putImageData(data,0,0);const pattern=cc.createPattern(tile,'repeat');materials.set(key,pattern);return pattern;
}
function tower(t){
 phase='高樓 · 灰藍底色與暖窗';wash(t.face,t.base,.86,null,true,'wall');wash(t.side,'#8d8272',.82,null,true,'wall');wash(t.roof,'#e5ad4a',.7,null,true);line(t.face,1.1,.85,null,'#182c3d',true);line(t.side,.8,.6,null,'#273643',true);line(t.roof,1.3,.85);
 const x=t.x,y=t.y,w=t.width,h=t.height;
 for(let col=0;col<t.cols;col++){
  const xx=x+(col+.4)/t.cols*w,top=y+(xx-x)*t.slope;
  wash(ribbon(xx,top, h-(xx-x)*t.slope, r(4,9),Math.PI/2),col%2?'#c6a766':'#2d4d70',col%2?.68:.59,t.id,true,'dry');
  line(`M ${xx} ${top} L ${xx+r(-2,2)} ${y+h}`,r(.5,.95),.57,t.id,'#24394e',true);
  for(let row=0;row<t.rows;row++){
   const yy=y+row*h/t.rows+(xx-x)*t.slope*(1-row/t.rows),ww=r(6,11),hh=r(4,8);
   if(rand()<.62){const warm=rand()>.16;wash(poly([[xx,yy],[xx+ww,yy+1.5],[xx+ww,yy+hh],[xx,yy+hh-1]]),warm?'#ffdc70':'#304d67',warm?r(.7,.98):.65,t.id,true,warm?'light':'dry');if(warm&&rand()>.65)light(xx+ww/2,yy+hh/2,ww*.4,hh*.35,'#fff3bb',true,t.id);}
   line(`M ${xx-3} ${yy+hh+1} l ${ww+5} 1`,.6,.45,t.id,'#1f3246',true);
  }
 }
 for(let row=0;row<t.rows;row++){const yy=y+row*h/t.rows;line(`M ${x} ${yy} L ${x+w} ${yy+w*t.slope*(1-row/t.rows)}`, .6,.38,t.id,'#243549',true);}
 const roofPoints=t.id==='tower-left'?[[49,101],[67,105],[85,109],[103,112],[122,116],[141,120]]:[[294,204],[315,192],[337,180],[365,169],[389,181],[407,188]];
 for(const [xx,yy] of roofPoints){wash(poly([[xx,yy],[xx+12,yy+3],[xx+12,yy+22],[xx,yy+20]]),'#ffe99b',.96,null,true,'light');line(`M ${xx-1} ${yy} l 0 21`,1,.85,null,'#283346');}
 line(t.id==='tower-left'?'M 34 91 L 178 125 M 47 87 L 172 118':'M 267 212 L 365 152 L 432 185',1.6,.88);
 line(`M ${t.id==='tower-left'?74:365} ${t.id==='tower-left'?82:151} l 0 -22`,.9,.75);
}
function figure(x,y,height,pose,color){
 const headY=y-height+height*.12,headR=height*.083,shoulder=y-height*.71,hip=y-height*.35,lean=pose===1?height*.08:pose===2?-height*.05:0;
 const d=poly([[x-height*.16,shoulder],[x+height*.14,shoulder-1],[x+lean+height*.12,hip],[x+lean-height*.13,hip]]);
 wash(d,color,.99,null,true,'figure');
 const head=`M ${x-headR} ${headY} a ${headR} ${headR*1.15} 0 1 0 ${headR*2} 0 a ${headR} ${headR*1.15} 0 1 0 ${-headR*2} 0`;
 wash(head,rand()>.55?'#343133':'#8c6953',.92,null,true);line(head,.65,.82);
 const footA=pose===1?-height*.15:-height*.08,footB=pose===1?height*.22:height*.1;
 const legs=`M ${x+lean-height*.05} ${hip} L ${x-height*.07} ${y-height*.15} L ${x+footA} ${y} M ${x+lean+height*.06} ${hip} L ${x+height*.12} ${y-height*.16} L ${x+footB} ${y}`;
 line(legs,Math.max(1,height*.047),.9,null,'#25272d',true);
 const arms=`M ${x-height*.10} ${shoulder+2} L ${x-height*.20} ${hip-height*.11} M ${x+height*.10} ${shoulder+2} L ${x+height*.24} ${hip-height*.12}`;
 line(arms,Math.max(.9,height*.041),.85,null,color,true);
 line(`M ${x-height*.14} ${shoulder} L ${x+lean-height*.13} ${hip}`, .65,.72);
 if(rand()>.68)wash(blot(x+height*.19,hip,height*.075,height*.12), '#4c4240',.9,null,true,'dry');
}
function roughBoundary(d,amount){svg.setAttribute('d',d);const len=svg.getTotalLength(),pts=[];for(let distance=0;distance<len;distance+=7){const p=svg.getPointAtLength(distance),a=svg.getPointAtLength(Math.max(0,distance-3)),b=svg.getPointAtLength(Math.min(len,distance+3)),dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1,j=(Math.sin(distance*.073)*.42+Math.sin(distance*.217)*.22+(hash(Math.floor(distance),77)-.5)*.65)*amount*settings.edge;pts.push([p.x-dy/length*j,p.y+dx/length*j]);}return poly(pts);}
function build(){
 seed=compositionSeed;G.sky=roughBoundary(sourceSky,9);G.pool=roughBoundary(sourcePool,17);pool=new Path2D(G.pool);reservedPaper=new Path2D('M -20 -20 H 1556 V 1044 H -20 Z');for(let i=0;i<Math.round(settings.whiteSpace*3.4);i++){const x=r(10,W-10),y=r(845,1020);reservedPaper.addPath(new Path2D(blot(x,y,r(3,18),r(1,6),i)));}events=[];reflectionGaps=new Path2D('M -20 -20 H 1556 V 1044 H -20 Z');for(let i=0;i<400;i++){const x=r(0,W),y=r(590,1024),length=r(2,25),height=r(.4,2.5);reflectionGaps.addPath(new Path2D(poly([[x,y],[x+length,y+r(-1,1)],[x+length*.8,y+height],[x+length*.12,y+height]])));}
 phase='天空 · 連續濕染';
 wash(G.sky,'#759ce3',.88,'sky',false,'sky');
 // Broad overlapping sweeps follow the cloud bands, rather than isolated polygon islands.
 const skySweeps=[[40,56,450,75,-.08],[380,29,390,70,.12],[590,95,335,65,.20],[32,172,465,54,.10],[180,264,455,53,-.12]];
 for(const [x,y,len,width,angle] of skySweeps)wash(ribbon(x,y,len,width,angle),'#3f78d1',.27,'sky',false,'sky');
 for(let j=0;j<9;j++)wash(blot(150+j*81,110+Math.sin(j*.83)*77,r(43,85),r(32,65),j),'#538adc',.23,'sky',false,'sky');
 for(const [cx,cy,spread] of [[168,60,135],[450,90,140],[728,81,145],[314,255,95]])for(let j=0;j<24;j++){const a=r(0,6.28),distance=r(0,spread);wash(blot(cx+Math.cos(a)*distance,cy+Math.sin(a)*distance*.65,r(8,24),r(6,19)),'#4477c6',r(.04,.12),'sky',false,'skyTexture');}
 wash(blot(524,337,157,90),'#e9bdbe',.39,'sky');wash(blot(604,268,163,57),'#c6b9df',.25,'sky');
 phase='水面 · 深藍灰底染';wash(G.pool,'#75839a',.64,'pool',false,'water');
 for(let i=0;i<32;i++)wash(ribbon(r(-50,1500),r(650,967),r(95,270),r(15,39),r(-.08,.08)),i%3?'#314865':'#3d4566',r(.36,.60),'pool',false,'water');
 phase='遠景建築';for(const d of G.distant){wash(d,'#71849b',.77,null,true,'wall');line(d,.8,.55);for(let i=0;i<14;i++)line(`M 213 ${320+i*11} l 32 -1`,.5,.3,null,'#364760');}
 G.towers.forEach(tower);
 phase='玻璃 · 紙白與暖黃透光';wash(G.facade,'#ffefbb',.91,'glass',true,'light');
 // Architectural glazing: colored panes, broad dark mullions, clear paper-white gaps.
 for(let row=0;row<17;row++)for(let col=0;col<30;col++){
  const x=478+col*35,y=111+row*40-((x-478)*.19),w=r(23,32),h=r(21,35);
  if(rand()<settings.whiteSpace/100)continue;
  const palette=['#ffd34f','#ffd853','#ffe287','#ffefad','#ffd34f','#ffd853','#ffe287','#ffefad','#ffc743','#f2a130'];
  wash(ribbon(x+w*.40+r(-3,3),y,r(35,51),w*.62,Math.PI/2),palette[Math.floor(r(0,palette.length))],r(.62,.94),'glass',true,rand()>.3?'light':'dry');
 }
 for(let x=478;x<1540;x+=32)line(`M ${x} ${365-(x-478)*.59} L ${x+r(-1.3,1.3)} 552`,r(.6,1.2),.84,'glass','#263943',true);
 for(let y=97;y<565;y+=47)line(`M 475 ${y} L 1540 ${y-87}`,r(.9,1.5),.85,'glass','#263640',true);
 for(const y of [216,359,480]){wash(poly([[468,y],[1540,y-106],[1540,y-94],[468,y+13]]),'#21455c',.9,'glass',true,'wash');line(`M 468 ${y+11} L 1540 ${y-95}`,1.2,.8,'glass','#192a35',true);}
 phase='曲面牆 · 灰紫與赭色積染';
 for(const wall of G.walls){
  wash(wall.path,wall.base,.94,null,true,'wall');line(wall.path,1.6,.89,null,'#282b2d',true);
  const shape=new Path2D(wall.path);
  let centers=[];for(let j=0;j<140;j++){const x=r(477,1540),y=r(0,553);if(ctx.isPointInPath(shape,x,y))centers.push([x,y]);}
  for(const [x,y] of centers){wash(ribbon(x,y,r(35,125),r(15,44),r(.5,1.7)),rand()>.47?wall.shadow:'#ad8868',r(.06,.19),wall.id,true,'wall');}
  line(wall.path,3.6,.32,null,'#e2d3b7');
 }
 // Authored pigment pools place shadows and warm light at the observed bends.
 for(const [x,y,rx,ry,color,alpha] of [[1140,118,86,61,'#454d67',.23],[1247,259,99,124,'#91694f',.25],[1053,375,66,101,'#927956',.2],[1328,310,55,79,'#505367',.19],[1113,449,64,65,'#bd9e65',.25]])wash(blot(x,y,rx,ry),color,alpha,'large',true,'wall');
 // Far wing pale architectural ribs and a turquoise ground-floor glazing strip.
 for(let i=0;i<5;i++)line(`M ${1320+i*45} ${80+i*10} Q ${1370+i*35} 180 ${1360+i*40} 425`,.8,.37,'far','#7c766d');
 wash(poly([[1272,451],[1540,424],[1540,552],[1258,551]]),'#a2d0c8',.82,null,true);
 for(let x=1290;x<1540;x+=47)line(`M ${x} ${447-(x-1290)*.10} L ${x+3} 552`,1.3,.82,null,'#243b3c',true);
 line('M 1270 505 L 1539 487',1.1,.72,null,'#314344',true);
 phase='牆面燈光';
 for(let i=0;i<140;i++){const x=r(492,836),y=r(247,533),region=x<579?'small':'middle';if(ctx.isPointInPath(new Path2D(path(region)),x,y)){light(x,y,r(.9,2.3),r(1.3,3.4),'#fff0a5',true,region);}}
 for(const [x,y,rad] of [[1200,421,5],[1086,465,3.4],[1165,474,5],[1280,426,3.1]]){wash(blot(x,y,rad*2.5,rad*2.4),'#eac65e',.2);light(x,y,rad,rad,'#fff5b1',true);line(`M ${x-rad} ${y} a ${rad} ${rad} 0 1 0 ${rad*2} 0`,.55,.4);}
 phase='樹木 · 枝幹與碎葉';
 for(let j=0;j<14;j++)wash(blot(j*36,508,r(24,49),r(23,42)),'#ffd074',r(.22,.43),null,true,'light');
 const trees=[[32,541,60],[78,546,68],[148,545,72],[203,548,47],[285,547,54],[345,548,38],[393,549,39],[441,549,37]];
 for(const [x,y,size] of trees){
  line(`M ${x} ${y} Q ${x+2} ${y-size*.6} ${x-5} ${y-size*1.18} M ${x} ${y-size*.4} l ${-size*.22} ${-size*.35} M ${x} ${y-size*.55} l ${size*.23} ${-size*.4}`,1.9,.85,null,'#3d3c30',true);
  for(let j=0;j<16;j++){const a=r(0,Math.PI*2),rad=r(0,size*.46),cx=x+Math.cos(a)*rad,cy=y-size*.88+Math.sin(a)*rad*.58;wash(blot(cx,cy,r(7,19),r(9,22),j),['#234c3d','#3a5e39','#708035','#223f38'][j%4],r(.65,.97),null,true,'foliage');}
 }
 phase='地面與燈光';wash(G.ground,'#a0959a',.77);wash(ribbon(-3,574,1540,3.5,.002),'#3c3947',.83,null,false,'dry');line('M -4 578 Q 692 561 1540 583',1.7,.77);
 for(let i=0;i<75;i++){const x=r(0,1536),y=r(563,587);light(x,y,r(2.5,5),.75,i%4?'#efe4d8':'#bbdcf0');}
 for(const [x,y] of [[217,472],[370,481],[434,499]]){line(`M ${x} ${y} l 0 ${550-y}`,1.3,.75);wash(blot(x,y,9,7),'#ecb43d',.38);light(x,y,5,3.4,'#fff5a3');}
 phase='街道人物 · 姿態與衣色';
 const clothes=['#20282e','#304258','#983c32','#c47e25','#595358','#425453','#887671','#242b30'];
 const anchors=G.peopleAnchors.slice(0,Math.min(settings.people,G.peopleAnchors.length));
 for(let i=0;i<anchors.length;i++){const [x,y,h]=anchors[i];figure(x,y,h,i%3,clothes[i%clothes.length]);}
 for(let i=anchors.length;i<settings.people;i++){const x=r(4,1415),y=r(539,551),h=x>960?r(29,46):r(17,34);figure(x,y,h,Math.floor(r(0,3)),clothes[Math.floor(r(0,clothes.length))]);}
 phase='水池 · 碎光與水紋';
 for(const [x,y,len,width] of [[28,733,430,50],[53,890,550,68],[881,766,660,58],[930,881,555,76],[667,964,720,57]])wash(ribbon(x,y,len,width,r(-.08,.08)),'#1e3659',.39,'poolDark',false,'water');
 for(let j=0;j<160;j++){const x=r(12,1512),y=r(593,998),len=r(4,39),ww=r(.4,2.1);wash(ribbon(x,y,len,ww,r(-.04,.04)),j%4?'#eae7dc':'#243953',r(.18,.65),'pool',false,'dry');}
 for(const [x,y,rad] of G.lights){wash(blot(x,y,rad*2.25,rad*.65),'#1469ae',.47,'pool');wash(blot(x,y,rad*1.7,rad*.33),'#2f9bdd',.82,'pool');wash(blot(x,y,rad*.95,rad*.2),'#e1f7ff',.96,'pool');line(`M ${x-rad*1.6} ${y} Q ${x} ${y-rad*.75} ${x+rad*1.6} ${y} Q ${x} ${y+rad*.75} ${x-rad*1.6} ${y}`,1.1,.79,null,'#255276');light(x-rad*.1,y-rad*.06,rad*.65,rad*.13,'#fffefa');}
 phase='乾筆留白與顏料飛濺';
 for(let i=0;i<85;i++){const x=r(15,1500),y=r(622,1010),len=r(3,19);wash(ribbon(x,y,len,r(.6,2),r(-.15,.15)),'#faf7ec',r(.55,.95),'pool',false,'dry');}

 for(let i=0;i<180;i++){const x=r(15,1520),y=r(18,1010);if(y>595||y<340){const rad=r(.5,2.4);wash(blot(x,y,rad,rad*.7),'#394960',r(.15,.45),y>595?'pool':'sky',false,'dry');}}
 // Turn authored paths into the selected short-segment ink style. No charcoal or bitmap tracing.
 const inkEvents=[],colorEvents=[];for(const e of events){if(e.type!=='line'){colorEvents.push(e);continue;}svg.setAttribute('d',e.path);const length=svg.getTotalLength();for(let d=0;d<length;d+=8){const u=rand();if(u<.032)continue;const a=svg.getPointAtLength(d),b=svg.getPointAtLength(Math.min(length,d+8)),offset=(u-.5)*1.3*settings.jitter;inkEvents.push({...e,path:`M ${a.x+offset} ${a.y-offset} L ${b.x+offset} ${b.y-offset}`,width:e.width*(.65+u*.55),minY:Math.min(a.y,b.y)-4,maxY:Math.max(a.y,b.y)+4});if(rand()<settings.retrace*.06)inkEvents.push({...e,path:`M ${a.x+offset+.7} ${a.y-offset-.7} L ${b.x+offset+.7} ${b.y-offset-.7}`,width:e.width*.5,alpha:e.alpha*.25,minY:Math.min(a.y,b.y)-4,maxY:Math.max(a.y,b.y)+4});}}
 inkEnd=inkEvents.length;const reflectedInk=inkEvents.filter(e=>e.reflect&&rand()<.48).map(e=>({...e,type:'reflectionLine',stage:'倒影 · 窗格與碎線'}));events=[...inkEvents,...colorEvents,...reflectedInk];
}
function reflection(e,draw){
 if(!e.reflect||settings.reflection<=0)return;
 cc.save();cc.clip(pool);cc.clip(reflectionGaps,'evenodd');
 let minY=e.minY,maxY=e.maxY;if(e.type==='dot'){minY=e.y-e.ry;maxY=e.y+e.ry;}else if(minY===undefined){svg.setAttribute('d',e.path);const length=svg.getTotalLength();minY=H;maxY=-20;for(let i=0;i<=50;i++){const p=svg.getPointAtLength(length*i/50);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}e.minY=minY-4;e.maxY=maxY+4;minY=e.minY;maxY=e.maxY;}
 const start=Math.max(577,577+Math.floor((1100-.95*maxY-577)/7)*7),end=Math.min(1024,1100-.95*minY+7);
 for(let y=start;y<end;y+=7){
  // Horizontal shear, varied pigment strength and omitted narrow bands break the mirror.
  const stripe=Math.floor((y-577)/7),offset=Math.sin(stripe*.19)*2.2+Math.sin(stripe*.7)*1.2;
 
  cc.save();cc.beginPath();cc.rect(-20,y,1576,7.2);cc.clip();cc.translate(offset,1100);cc.scale(1,-.95);
  cc.globalAlpha*=Math.min(1,settings.reflection*(.76+.12*noise(y/105,3)));
  draw();cc.restore();
 }cc.restore();
}
function drawWash(e){
 const shape=new Path2D(e.path),pattern=material(e.color,e.role||'wash');
 const apply=()=>{cc.save();clip(e.region);cc.globalAlpha*=Math.min(1,e.alpha*settings.wash);
  if(settings.water>.01&&e.role!=='dry'&&e.role!=='light'){cc.save();cc.globalAlpha*=.15;cc.filter=`blur(${(.7+settings.water*2.4).toFixed(2)}px)`;cc.fillStyle=e.color;cc.fill(shape);cc.restore();}
  cc.save();if((e.role==='sky'||e.role==='wall'||e.role==='water')&&e.path!==G.sky&&!G.walls.some(w=>w.path===e.path)){cc.filter=`blur(${(e.role==='water'?7+settings.water*10:1.4+settings.water*4).toFixed(2)}px)`;}cc.fillStyle=pattern;cc.fill(shape);cc.restore();
  if(e.role==='wall'||e.role==='water'||e.role==='sky'){cc.strokeStyle=e.color;cc.globalAlpha*=.18*settings.edge;cc.lineWidth=1+settings.water*1.3;cc.setLineDash([4,7,2,5]);cc.stroke(shape);}
  cc.restore();};
 cc.save();apply();cc.restore();reflection(e,apply);
}
function drawLine(e){
 ic.save();clip(e.region,ic);ic.strokeStyle=e.color;ic.lineWidth=e.width*settings.lineWidth;ic.globalAlpha=Math.min(1,e.alpha*settings.ink);ic.lineCap='round';ic.lineJoin='round';ic.stroke(new Path2D(e.path));ic.restore();

}
function drawDot(e){const apply=()=>{cc.save();clip(e.region);cc.fillStyle=e.color;cc.beginPath();cc.ellipse(e.x,e.y,e.rx,e.ry,0,0,Math.PI*2);cc.fill();cc.restore();};apply();reflection(e,apply);}
function draw(e){
 if(e.type==='line'){drawLine(e);return;}
 cc.save();cc.clip(reservedPaper,'evenodd');
 if(e.type==='reflectionLine'){reflection(e,()=>{cc.save();clip(e.region);cc.strokeStyle=e.color;cc.globalAlpha*=Math.min(1,e.alpha*settings.ink*.64);cc.lineWidth=e.width*settings.lineWidth;cc.lineCap='round';cc.stroke(new Path2D(e.path));cc.restore();});}
 else if(e.type==='wash')drawWash(e);else drawDot(e);cc.restore();
}
function makePaper(){seed=17;pc.fillStyle='#faf7ec';pc.fillRect(0,0,W,H);for(let i=0;i<130000;i++){pc.fillStyle=`rgba(109,86,51,${r(.012,.053)*settings.grain})`;pc.fillRect(r(0,W),r(0,H),r(.5,1.2),r(.5,1.6));}}
function render(){ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);ctx.drawImage(paper,0,0);ctx.globalCompositeOperation='multiply';ctx.drawImage(colors,0,0);ctx.drawImage(ink,0,0);ctx.globalCompositeOperation='source-over';const t=Math.min(1,elapsed/settings.duration);$('seek').value=Math.round(t*1000);$('progress').value=Math.round(t*100)+'%';$('status').textContent=index===events.length?'作品完成':index<inkEnd?'逐筆墨線 · 劇院與街景':events[Math.max(0,index-1)]?.stage||'透明水彩';}
function targetAt(t){t=Math.max(0,Math.min(1,t));return t<.34?Math.floor(t/.34*inkEnd):inkEnd+Math.floor((t-.34)/.66*(events.length-inkEnd));}
function reset(){materials.clear();ic.clearRect(0,0,W,H);cc.clearRect(0,0,W,H);makePaper();build();index=0;elapsed=0;last=null;paused=false;$('pause').textContent='暫停';render();}
function advance(target){while(index<target&&index<events.length)draw(events[index++]);render();}
function frame(now){if(last!==null&&!paused&&index<events.length){elapsed+=Math.min(.1,(now-last)/1000)*settings.speed;advance(targetAt(elapsed/settings.duration));}last=now;requestAnimationFrame(frame);}
function values(){for(const key of Object.keys(settings)){$(key).value=settings[key];$(key+'-value').value=settings[key]+(key==='whiteSpace'?'%':key==='duration'?' 秒':key==='people'?' 人':'×');}}
let timer;for(const key of Object.keys(settings))$(key).oninput=e=>{const fraction=elapsed/settings.duration;settings[key]=+e.target.value;values();if(key==='duration'){elapsed=fraction*settings.duration;return;}if(key==='speed')return;clearTimeout(timer);timer=setTimeout(()=>{const t=elapsed,p=paused;reset();elapsed=t;advance(targetAt(elapsed/settings.duration));paused=p;$('pause').textContent=p?'繼續':'暫停';},100);};
$('seek').oninput=e=>{clearTimeout(timer);const t=+e.target.value/1000*settings.duration,p=paused;reset();elapsed=t;advance(targetAt(t/settings.duration));paused=p;$('pause').textContent=p?'繼續':'暫停';};
$('replay').onclick=()=>{clearTimeout(timer);reset();};$('pause').onclick=()=>{paused=!paused;$('pause').textContent=paused?'繼續':'暫停';};$('finish').onclick=()=>{elapsed=settings.duration;advance(events.length);};
$('new').onclick=()=>{clearTimeout(timer);compositionSeed=Math.floor(Math.random()*10000000);reset();};$('reset').onclick=()=>{clearTimeout(timer);const t=elapsed/settings.duration,p=paused;Object.assign(settings,defaults);values();reset();elapsed=t*settings.duration;advance(targetAt(t));paused=p;$('pause').textContent=p?'繼續':'暫停';};
$('save').onclick=()=>{const a=document.createElement('a');a.download='theater-at-dusk-watercolor.png';a.href=canvas.toDataURL('image/png');a.click();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await canvas.parentElement.requestFullscreen();}catch(e){$('status').textContent='請使用瀏覽器的全螢幕功能。';}};
values();reset();requestAnimationFrame(frame);
})();
