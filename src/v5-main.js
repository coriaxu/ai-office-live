(function(){
'use strict';
const AL=window.ASSETS_LIVE;
const IDS=['gushen','lumen','forge','axiom','penny','vox','linxi'];
const NAMES={gushen:'顾深',lumen:'Lumen',forge:'Forge',axiom:'Axiom',penny:'Penny',vox:'Vox',linxi:'林溪'};
const ROLE={gushen:'总管家',lumen:'艺术总监',forge:'顾问｜dbs',axiom:'情报',penny:'财务',vox:'录音',linxi:'日记教练'};
const ROOMN={gushen:'调度中枢',lumen:'设计室',forge:'顾问间',axiom:'情报室',penny:'财务角',vox:'录音棚',linxi:'小书房'};
const CATC={work:'#FBBF24',active:'#34D399',nap:'#64748B'};
const $=id=>document.getElementById(id);
const DT=1/60;
const FY={1:312,2:592,3:902};
const ROWB={1:328,2:608,3:918};
const HSTAND=196;
const SEATH={lumen:162,forge:162,axiom:140,penny:149,vox:157,linxi:157};
const WORKERS=['gushen','lumen','forge'];
const params=new URLSearchParams(location.search);
const REC=params.has('rec');
/* quality: 'hi' keeps film grain + dust; 'lite' drops them and throttles the window skies */
let QUAL=params.get('q')==='lite'?'lite':'hi';
if(!params.has('q')&&!REC){try{if(localStorage.getItem('office-quality')==='lite')QUAL='lite';}catch(e){}}
document.body.classList.toggle('lite',QUAL==='lite');
let FRAME=0;
/* sky follows Taipei time: N=1 night, 0 day; D = dusk/dawn glow */
const SKY={N:1,D:0,word:'夜景',name:'夜景',late:false};
/* ---------- live data (rewritten by refresh; see data.json) ---------- */
const OD=(function(){try{return JSON.parse(document.getElementById('office-data').textContent);}catch(e){return {};}})();
let MEET=OD.meeting||null;
function tpDay(d){return d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');}
function hm(s){const p=String(s||'0:0').split(':').map(Number);return p[0]*60+(p[1]||0);}
function meetingNow(){if(!MEET)return false;const d=new Date(nowMs()+8*3600e3);if(tpDay(d)!==MEET.day)return false;const c=d.getUTCHours()*60+d.getUTCMinutes();return c>=hm(MEET.start)&&c<hm(MEET.end);}
function skyAt(ms){const d=new Date(ms+8*3600e3);const h=d.getUTCHours()+d.getUTCMinutes()/60;
 const N=h<5||h>=19.5?1:h<7?1-sm((h-5)/2):h<17?0:sm((h-17)/2.5);
 const D=Math.max(0,1-Math.abs(h-6)/1.3)+Math.max(0,1-Math.abs(h-18)/1.5);
 SKY.N=N;SKY.D=Math.min(1,D);SKY.late=h<7;
 SKY.name=N>.8?'夜景':N<.2?(D>.3?'晨光':'日景'):(h<12?'晨光':'黄昏');
 SKY.word=N>.8?'夜景':N<.2?'外面':'晚霞';if(h<12&&N<.8&&N>.2)SKY.word='日出';}
let seed=params.has('seed')?+params.get('seed'):((Date.now()%1e9)|0);
let rnd=mulberry32(1);
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rr=(a,b)=>a+(b-a)*rnd();
const pick=arr=>arr[(rnd()*arr.length)|0];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const sm=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const eo3=t=>{t=clamp(t,0,1);return 1-Math.pow(1-t,3)};
const eio3=t=>{t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2};
function W(el,k,v){let s=el._s;if(!s)s=el._s={};if(s[k]!==v){s[k]=v;el.style[k]=v;}}

/* ---------- geometry ---------- */
const R={lumen:{f:1,side:'L'},forge:{f:1,side:'R'},axiom:{f:2,side:'L'},penny:{f:2,side:'R'},vox:{f:3,side:'L'},linxi:{f:3,side:'R'}};
Object.keys(R).forEach(id=>{const r=R[id];r.id=id;r.x0=r.side==='L'?28:1068;r.w=424;r.bottom=ROWB[r.f];r.top=r.f===1?36:r.f===2?358:638;r.cx=r.x0+212;r.h=r.bottom-r.top;
 r.dir=r.side==='L'?1:-1;r.doorX=r.side==='L'?452:1068;r.FY=FY[r.f];r.standX=r.cx+r.dir*80;r.hostX=r.cx-r.dir*80;
 r.hasWin=id!=='linxi';r.winX=r.x0+318;r.readX=r.x0+(id==='vox'?170:160);r.el=$('r-'+id);});
const HUBDOOR={L:548,R:972};
const CAR={L:{x:500,floor:2,y:FY[2]+8,owner:null,v:0,door:0,doorT:0},R:{x:1020,floor:3,y:FY[3]+8,owner:null,v:0,door:0,doorT:0}};
const MACH={L:{cupX:617,cupY:810,standX:676,face:-1,inDir:1,q:[]},R:{cupX:903,cupY:810,standX:844,face:1,inDir:-1,q:[]}};
const HUBX=760;
const HUBEL=$('r-gushen');

/* ---------- persp ---------- */
function persp(room,o){
 const W_=room.offsetWidth,H=room.offsetHeight,ix=W_*(o.ix||.105),ty=H*(o.ty||.13),by=H*(o.by||.76);
 const id=room.id+(o.sfx||''),c=o.c;let lines='';const n=9;
 for(let i=0;i<=n;i++){lines+=`<line x1="${ix+(W_-2*ix)*i/n}" y1="${by}" x2="${W_*i/n}" y2="${H}" stroke="${c.line}" stroke-width="1.5"/>`}
 [.16,.4,.72].forEach(f=>{const y=by+(H-by)*f;const k=(y-by)/(H-by);lines+=`<line x1="${ix-ix*k}" y1="${y}" x2="${W_-ix+ix*k}" y2="${y}" stroke="${c.line}" stroke-width="1.5"/>`});
 const svg=`<svg class="persp ${o.cls||''}" width="${W_}" height="${H}" viewBox="0 0 ${W_} ${H}"><defs>
  <linearGradient id="b${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.back0}"/><stop offset="1" stop-color="${c.back1}"/></linearGradient>
  <linearGradient id="f${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.floor0}"/><stop offset="1" stop-color="${c.floor1}"/></linearGradient>
  <linearGradient id="l${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.side0}"/><stop offset="1" stop-color="${c.side1}"/></linearGradient>
  <linearGradient id="r${id}" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="${c.side0}"/><stop offset="1" stop-color="${c.side1}"/></linearGradient>
  <linearGradient id="c${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.ceil0}"/><stop offset="1" stop-color="${c.ceil1}"/></linearGradient>
  <radialGradient id="g${id}" cx="50%" cy="${(by/H*100).toFixed(0)}%" r="60%"><stop offset="0" stop-color="${c.glow}" stop-opacity="${c.ga}"/><stop offset="1" stop-color="${c.glow}" stop-opacity="0"/></radialGradient></defs>
 <polygon points="0,0 ${W_},0 ${W_-ix},${ty} ${ix},${ty}" fill="url(#c${id})"/>
 <polygon points="${ix},${ty} ${W_-ix},${ty} ${W_-ix},${by} ${ix},${by}" fill="url(#b${id})"/>
 <polygon points="0,0 ${ix},${ty} ${ix},${by} 0,${H}" fill="url(#l${id})"/>
 <polygon points="${W_},0 ${W_-ix},${ty} ${W_-ix},${by} ${W_},${H}" fill="url(#r${id})"/>
 <polygon points="0,${H} ${ix},${by} ${W_-ix},${by} ${W_},${H}" fill="url(#f${id})"/>
 ${lines}
 <polygon points="0,${H} ${ix},${by} ${W_-ix},${by} ${W_},${H}" fill="url(#g${id})"/>
 <g stroke="${c.edge}" stroke-width="2" fill="none"><polyline points="0,0 ${ix},${ty} ${W_-ix},${ty} ${W_},0"/><polyline points="${ix},${ty} ${ix},${by} 0,${H}"/><polyline points="${W_-ix},${ty} ${W_-ix},${by} ${W_},${H}"/><line x1="${ix}" y1="${by}" x2="${W_-ix}" y2="${by}"/></g></svg>`;
 room.insertAdjacentHTML('afterbegin',svg);return room.firstElementChild;
}
const WORK={back0:'#5A4529',back1:'#42331F',floor0:'#6A5030',floor1:'#3A2C1A',side0:'#1E170E',side1:'#3A2D1B',ceil0:'#120D08',ceil1:'#2A2014',line:'rgba(255,214,150,.16)',edge:'rgba(255,205,130,.45)',glow:'#FFD08A',ga:.5};
const REST={back0:'#223149',back1:'#1A263C',floor0:'#233350',floor1:'#121B2E',side0:'#0B111C',side1:'#17223A',ceil0:'#080C15',ceil1:'#121A2B',line:'rgba(150,180,230,.13)',edge:'rgba(150,180,230,.3)',glow:'#7C9BD0',ga:.18};
const HUBC={back0:'#2E3752',back1:'#1F273C',floor0:'#303B5C',floor1:'#121828',side0:'#0E131F',side1:'#222B44',ceil0:'#0A0E18',ceil1:'#1A2132',line:'rgba(110,231,183,.2)',edge:'rgba(255,200,130,.55)',glow:'#FFD08A',ga:.35};
Object.keys(R).forEach(id=>{const r=R[id];
 r.warm=persp(r.el,{c:WORK,sfx:'w',cls:'warm'});persp(r.el,{c:REST,sfx:'c',cls:'cool'});
 r.scrim=document.createElement('div');r.scrim.className='scrim';r.el.appendChild(r.scrim);
 r.edge=document.createElement('div');r.edge.className='edge';r.el.appendChild(r.edge);
 r.hl=document.createElement('div');r.hl.className='hl';r.el.appendChild(r.hl);r.hv=0;r.hvT=0;
 r.L=0.6;r.Ls=0.6;r.Lt=0.6;r.hold=0;
});
persp(HUBEL,{c:HUBC,ty:.05,by:.70,ix:.09});
const hubScrim=document.createElement('div');hubScrim.className='scrim';HUBEL.appendChild(hubScrim);
const hubHl=document.createElement('div');hubHl.className='hl';HUBEL.appendChild(hubHl);let hubHv=0,hubHvT=0;

/* ---------- static art ---------- */
IDS.forEach(k=>{$('av-'+k).src=AL.avs[k];});
const SEATS={};
function makeSeat(id,room,h,bottom){
 const s=AL.seat[id];const w=Math.round(h*s.w/s.h);const d=document.createElement('div');d.className='seat';
 d.style.width=w+'px';d.style.height=h+'px';d.style.left=((424-w)/2)+'px';d.style.bottom=bottom+'px';
 d.innerHTML='<img class="sp" alt="">';d.firstChild.src=s.src;
 const f=AL.furn[id];let fn=null;
 if(f){fn=document.createElement('img');fn.className='fn';fn.src=f.src;fn.alt='';fn.style.left=(f.fx*100)+'%';fn.style.top=(f.fy*100)+'%';fn.style.width=(f.fw*100)+'%';fn.style.height=(f.fh*100)+'%';d.insertBefore(fn,d.firstChild);}
 room.appendChild(d);
 const sh=document.createElement('div');sh.className='sset';sh.style.width=Math.round(w*1.1)+'px';sh.style.left=((424-w*1.1)/2)+'px';sh.style.bottom=(bottom-6)+'px';room.appendChild(sh);
 SEATS[id]={el:d,sp:d.querySelector('.sp'),fn,w,h,sh};return SEATS[id];
}
Object.keys(R).forEach(id=>makeSeat(id,R[id].el,SEATH[id],2));
(function(){const s=AL.seat.gushen;const h=Math.round(882*.57);const w=Math.round(h*s.w/s.h);
 const d=document.createElement('div');d.className='seat';d.style.width=w+'px';d.style.height=h+'px';d.style.left=((424-w)/2)+'px';d.style.bottom='108px';
 d.innerHTML='<img class="sp" alt="">';d.firstChild.src=s.src;HUBEL.appendChild(d);SEATS.gushen={el:d,sp:d.firstChild,fn:null,w,h};})();

/* ---------- night windows (SVG, T-driven) ---------- */
const NIGHT=[];
function mkNight(win,k){
 const g=mulberry32(k*977+31);const Wd=106,Hd=98;let s=`<svg viewBox="0 0 ${Wd} ${Hd}" preserveAspectRatio="none"><defs><linearGradient id="sk${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#070D26"/><stop offset=".62" stop-color="#1B2A55"/><stop offset="1" stop-color="#46406E"/></linearGradient><linearGradient id="dy${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E9BD6"/><stop offset="1" stop-color="#BFD9EE"/></linearGradient><linearGradient id="du${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3A78" stop-opacity="0"/><stop offset=".55" stop-color="#E08A6A" stop-opacity=".75"/><stop offset="1" stop-color="#FFC27A"/></linearGradient><radialGradient id="mn${k}"><stop offset="0" stop-color="#FFF4D2"/><stop offset="1" stop-color="#FFF4D2" stop-opacity="0"/></radialGradient></defs><rect width="${Wd}" height="${Hd}" fill="url(#sk${k})"/>`;
 const stars=[];for(let i=0;i<9;i++){stars.push({x:g()*Wd,y:g()*40,r:.7+g()*.9,p:g()*6.28,sp:.8+g()*1.8});}
 stars.forEach((st,i)=>{s+=`<circle id="st${k}_${i}" cx="${st.x.toFixed(1)}" cy="${st.y.toFixed(1)}" r="${st.r.toFixed(1)}" fill="#EAF2FF"/>`;});
 if(k%2===0)s+=`<circle cx="${(18+g()*60).toFixed(0)}" cy="${(12+g()*10).toFixed(0)}" r="11" fill="url(#mn${k})" opacity=".75"/><circle cx="${(18+g()*60).toFixed(0)}" cy="${(14+g()*6).toFixed(0)}" r="0"/>`;
 s+=`<rect id="sd${k}" width="${Wd}" height="${Hd}" fill="url(#dy${k})" opacity="0"/><rect id="su${k}" width="${Wd}" height="${Hd}" fill="url(#du${k})" opacity="0"/>`;
 let x=-4;while(x<Wd){const w=9+g()*14,h=26+g()*30;s+=`<rect x="${x.toFixed(1)}" y="${(Hd-h-8).toFixed(1)}" width="${w.toFixed(1)}" height="${h+8}" fill="#18274F"/>`;x+=w+1+g()*3;}
 const blink=[];x=-6;
 while(x<Wd){const w=12+g()*16,h=16+g()*34,y0=Hd-h;s+=`<rect x="${x.toFixed(1)}" y="${y0.toFixed(1)}" width="${w.toFixed(1)}" height="${h}" fill="#0A1228"/>`;
  for(let wy=y0+5;wy<Hd-4;wy+=6)for(let wx=x+3;wx<x+w-3;wx+=5){const r=g();if(r<.30){const col=r<.05?'#9FD3FF':r<.2?'#FFD58A':'#FFE9B8';const id=`bw${k}_${blink.length}`;const bl=r<.12;s+=`<rect id="${id}" x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="2.4" height="3" fill="${col}" opacity="${bl?.2:.9}"/>`;if(bl)blink.push({id,p:g()*6.28,sp:.25+g()*.5});}}
  x+=w+2+g()*5;}
 s+=`<rect id="sw${k}" width="${Wd}" height="${Hd}" fill="#9CC1E4" opacity="0"/>`;
 const cars=[];for(let i=0;i<2;i++){const id=`cr${k}_${i}`;const dir=i?-1:1;s+=`<g id="${id}" opacity="0"><rect x="-6" y="-1.5" width="9" height="3" rx="1.5" fill="${dir>0?'#FFF1C4':'#FF5A4A'}" opacity=".25"/><rect x="-2" y="-1" width="2.6" height="2" fill="${dir>0?'#FFFBEA':'#FF6B5A'}"/><rect x="-6" y="-1" width="2" height="2" fill="${dir>0?'#FFFBEA':'#FF6B5A'}"/></g>`;cars.push({id,dir,P:11+g()*7,off:g()*14,y:Hd-3-i*3});}
 s+='</svg><div class="glass"></div>';
 win.innerHTML=s;
 const q=id=>win.querySelector('#'+id);
 NIGHT.push({k,sd:q('sd'+k),su:q('su'+k),sw:q('sw'+k),stars:stars.map((st,i)=>({el:q(`st${k}_${i}`),p:st.p,sp:st.sp})),blink:blink.map(b=>({el:q(b.id),p:b.p,sp:b.sp})),cars:cars.map(c=>({el:q(c.id),dir:c.dir,P:c.P,off:c.off,y:c.y})),Wd});
}
[...document.querySelectorAll('.win')].forEach((w,i)=>mkNight(w,i+1));

/* ---------- shafts: cars, ledges, doors ---------- */
const shell=$('shell');
const cars={};
['L','R'].forEach(sd=>{
 const x=CAR[sd].x;
 const car=document.createElement('div');car.className='car';car.style.left=(x-42)+'px';car.innerHTML='<i class="cg"></i>';shell.appendChild(car);
 /* doors live inside #world so walkers passing a parked car draw in front of them; riders get a lower zIndex than the doors */
 const cdr=document.createElement('div');cdr.className='cdr';cdr.style.left=(x-42)+'px';cdr.style.zIndex='3';cdr.innerHTML='<i class="dl"></i><i class="dr"></i>';$('world').appendChild(cdr);
 const cab=document.createElement('div');cab.className='cable';cab.style.left=(x-1)+'px';shell.appendChild(cab);
 cars[sd]={car,cdr,dl:cdr.firstChild,dr:cdr.lastChild,cg:car.firstChild,cab,labels:{}};
 [1,2,3].forEach(f=>{
  const lg=document.createElement('div');lg.className='ledge';lg.style.left=(x-48)+'px';lg.style.top=(FY[f]+8)+'px';shell.appendChild(lg);
  const fl=document.createElement('div');fl.className='fl';fl.textContent=(4-f)+'F'; /* internal f=1 is the top row; label from the ground up */fl.style.left=(x-22)+'px';fl.style.top=((f===1?36:f===2?358:638)+10)+'px';shell.appendChild(fl);cars[sd].labels[f]=fl;
 });
});
function mkDoor(x,f){const d=document.createElement('div');d.className='door';d.style.left=(x-6)+'px';d.style.top=(FY[f]-126)+'px';shell.appendChild(d);}
Object.keys(R).forEach(id=>mkDoor(R[id].doorX,R[id].f));mkDoor(HUBDOOR.L,3);mkDoor(HUBDOOR.R,3);
/* warm spill from each room into the shaft landing */
const SPILLS=[];
function mkSpill(roomKey,left,cls,f){const e=document.createElement('div');e.className='spill '+cls;e.style.left=left+'px';e.style.top=(FY[f]-150)+'px';shell.appendChild(e);SPILLS.push({key:roomKey,el:e});}
Object.keys(R).forEach(id=>{const r=R[id];mkSpill(id,r.side==='L'?452:972,r.side==='L'?'l':'r',r.f);});
mkSpill('hub',452,'r',3);mkSpill('hub',972,'l',3);
const world=$('world'),bubLayer=$('bubbles');
(function liftLabels(){const lay=document.createElement('div');lay.style.cssText='position:absolute;inset:0;z-index:25;pointer-events:none';shell.insertBefore(lay,bubLayer);
 const sr=shell.getBoundingClientRect(),k=sr.width/shell.offsetWidth;
 [...document.querySelectorAll('.rlabel,.g-label,.g-mlabel')].forEach(e=>{const r=e.getBoundingClientRect();
  const l=(r.left-sr.left)/k,t=(r.top-sr.top)/k;e.style.cssText+=';left:'+l+'px;top:'+t+'px;right:auto;bottom:auto;transform:none;margin:0';lay.appendChild(e);});})();
/* hover ring */
const hring=document.createElement('div');hring.id='hring';world.appendChild(hring);
/* hub dust motes */
const MOTES=[];for(let i=0;i<10;i++){const m=document.createElement('i');m.className='mote';HUBEL.appendChild(m);MOTES.push(m);}

/* ---------- actors ---------- */
const ACTORS=[];const A={};
const feedList=[];
function logEv(name,text){const key=name+text;if(feedList.some(f=>f.key===key&&T-f.born<60))return;feedList.unshift({key,name,text,t:nowMs(),born:T});if(feedList.length>5)feedList.pop();feedDirty=true;}
let feedDirty=true;
class Actor{
 constructor(id){this.id=id;this.name=NAMES[id];this.kind=WORKERS.includes(id)?'worker':'rest';this.mode=id==='gushen'?'fixed':'seated';
  this.x=0;this.y=0;this.yo=0;this.face=1;this.faceV=1;this.ph=0;this.wk=0;this.lastWalk=-9;this.v=0;this.sp=0;this.xf=0;
  this.text='';this.stext='';this.cat='nap';this.bst='nap';this.zone=id==='gushen'?{kind:'hub'}:{kind:'room',id};
  this.pop=0;this.anim=null;this.animT=0;this.prop=null;this.propAt=null;this.riding=null;
  this.hostable=false;this.lock=null;this.guestHere=false;this.chat=null;this.last='';this.talk=0;this.ph0=rnd()*6.28;
  this.bubW=0;this.bubTxt='';this.bx=null;this.by=null;this.lane=0;
  if(id!=='gushen'){
   const s=AL.stand[id];this.sh=HSTAND;this.sw=Math.round(this.sh*s.w/s.h);
   const el=document.createElement('img');el.className='act';el.src=s.src;el.alt='';el.style.width=this.sw+'px';el.style.height=this.sh+'px';el.style.display='none';world.appendChild(el);this.el=el;
   const sh=document.createElement('div');sh.className='sdw';sh.style.display='none';world.appendChild(sh);this.sdw=sh;
  }
  const cup=document.createElement('div');cup.className='cup';cup.innerHTML='<i></i><i style="left:9px;top:2px;height:7px"></i><b></b><u></u>';world.appendChild(cup);this.cupEl=cup;
  const bk=document.createElement('div');bk.className='book';bk.innerHTML='<b></b><u></u>';world.appendChild(bk);this.bookEl=bk;
  const b=document.createElement('div');b.className='bub nap';b.innerHTML='<span></span><div class="tl"></div><i class="ln"></i>';bubLayer.appendChild(b);this.bub=b;this.bubS=b.firstChild;this.bubT=b.children[1];this.bubL=b.children[2];
 }
 setStatus(t,cat){this.stext=t;this.text=t;this.cat=cat;this.bst=cat;}
 say(t){this.text=t;this.bst='chat';this.talk=1;}
}
IDS.forEach(id=>{const a=new Actor(id);ACTORS.push(a);A[id]=a;});

/* ---------- coroutine helpers ---------- */
let T=0;
function* wait(s){let t=s;while(t>0){t-=DT;yield;}}
function* until(f){while(!f())yield;}
function* walk(a,tx,ty,sp){
 sp=sp||a.sp;
 /* snap face to travel direction immediately — no moonwalk on reverse */
 {const dx0=tx-a.x,dy0=ty-a.y;
  if(Math.abs(dx0)>3&&Math.abs(dx0)>Math.abs(dy0)*1.2){
   const nf=dx0>=0?1:-1;if(nf!==a.face){a.face=nf;a.faceV=nf;}else a.face=nf;}}
 for(;;){
  const dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);
  if(d<1.2)break;
  const target=sp*Math.min(1,0.3+d/46);
  a.v+=(target-a.v)*Math.min(1,10*DT);
  const st=Math.min(d,Math.max(a.v,20)*DT);
  a.x+=dx/d*st;a.y+=dy/d*st;
  /* face from remaining/step horizontal whenever x-motion is meaningful */
  if(Math.abs(dx)>3&&Math.abs(dx)>Math.abs(dy)*1.2){
   const nf=dx>=0?1:-1;if(nf!==a.face){a.face=nf;a.faceV=nf;}else a.face=nf;}
  a.ph+=st/34;a.lastWalk=T;
  yield;
 }
 a.v=0;
}
function sameZone(z,d){return z.kind===d.kind&&(z.kind!=='room'||z.id===d.id);}
function* carGoto(c,f,a){
 const ty=FY[f]+8;
 while(Math.abs(c.y-ty)>0.6){
  const d=ty-c.y;const tv=Math.sign(d)*Math.min(300,50+Math.abs(d)*3.2);
  c.v+=(tv-c.v)*Math.min(1,6*DT);
  const st=Math.sign(d)*Math.min(Math.abs(d),Math.abs(c.v)*DT);
  c.y+=st;if(a){a.y=c.y-8;a.x=c.x;}
  yield;
 }
 c.y=ty;c.v=0;c.floor=f;if(a){a.y=c.y-8;}
 yield* wait(0.2);
}
function* doors(c,t){c.doorT=t;while(Math.abs(c.door-t)>.002)yield;}
function* ride(a,side,f1,f2,exitDir){
 if(f1===f2)return;
 const c=CAR[side];const t0=a.text,c0=a.cat;
 if(c.owner&&c.owner!==a){a.setStatus('等电梯','active');yield* until(()=>!c.owner);}
 c.owner=a;
 if(c.floor!==f1){a.setStatus('等电梯','active');yield* doors(c,0);yield* carGoto(c,f1,null);}
 a.setStatus('等电梯','active');
 yield* doors(c,1);
 a.text=t0;a.cat=c0;a.bst=c0;a.stext=t0;
 yield* walk(a,c.x,FY[f1]);
 a.riding=c;a.setStatus('坐电梯','active');a.v=0;
 yield* wait(.12);
 yield* doors(c,0);
 yield* carGoto(c,f2,a);
 yield* doors(c,1);
 a.riding=null;
 a.text=t0;a.cat=c0;a.bst=c0;a.stext=t0;
 yield* walk(a,c.x+exitDir*66,FY[f2]);
 c.doorT=0;c.owner=null;
 yield* walk(a,c.x+exitDir*84,FY[f2]);
}
function* travel(a,dest){
 const cz=a.zone;
 if(sameZone(cz,dest)){yield* walk(a,dest.x,dest.y);return;}
 let side,floor;
 if(cz.kind==='room'){const r=R[cz.id];side=r.side;floor=r.f;yield* walk(a,r.doorX,FY[floor]);}
 else{side=dest.kind==='room'?R[dest.id].side:(a.x<HUBX?'L':'R');floor=3;yield* walk(a,HUBDOOR[side],FY[3]);}
 a.zone={kind:'shaft',side};
 const other=side==='L'?'R':'L';
 if(dest.kind==='room'){
  const r2=R[dest.id];
  if(r2.side===side){yield* ride(a,side,floor,r2.f,side==='L'?-1:1);}
  else{
   yield* ride(a,side,floor,3,side==='L'?1:-1);
   yield* walk(a,HUBDOOR[side],FY[3]);a.zone={kind:'hub'};
   yield* walk(a,HUBDOOR[other],FY[3]);a.zone={kind:'shaft',side:other};
   yield* ride(a,other,3,r2.f,other==='L'?-1:1);
  }
  yield* walk(a,r2.doorX,FY[r2.f]);a.zone={kind:'room',id:dest.id};
  yield* walk(a,dest.x,dest.y);
 }else{
  yield* ride(a,side,floor,3,side==='L'?1:-1);
  yield* walk(a,HUBDOOR[side],FY[3]);a.zone={kind:'hub'};
  yield* walk(a,dest.x,dest.y);
 }
}
/* stand / sit now cross-fade through a.xf (0 seated .. 1 standing) */
function* standUp(a){const r=R[a.id];a.mode='standing';a.x=r.cx;a.y=r.FY-6;a.face=-r.dir;a.zone={kind:'room',id:a.id};a.v=0;yield* wait(.5);}
function* sitDown(a){const r=R[a.id];yield* travel(a,{kind:'room',id:a.id,x:r.cx,y:r.FY-6});a.face=-r.dir;yield* wait(.1);a.mode='seated';a.prop=null;a.anim=null;yield* wait(.5);}
function* ensureStanding(a){if(a.mode==='seated')yield* standUp(a);}
function* goHome(a){if(a.mode==='seated')return;a.setStatus('回座位','active');yield* sitDown(a);}

/* ---------- hosting / chatting ---------- */
const LINES=['最近忙吗？','刚好路过','咖啡好喝吗','今天排得满','来歇口气','有个新点子','下午茶？','稿子顺利吗','昨晚没睡好','一起走走？'];
const REPL=['嗯嗯','是呀','哈哈','真的？','好主意','慢慢来','我也是'];
function* host(a){
 const ch=a.chat;const t0=a.text,c0=a.cat,b0=a.bst;
 if(a.id==='gushen'){a.setStatus('来啦来啦','active');a.face=1;ch.ready=true;}
 else if(a.kind==='worker'&&a.mode==='seated'){a.cat='active';ch.ready=true;}
 else{
  a.setStatus('被叫醒啦','active');if(a.lock)logEv(a.name,'被 '+a.lock.name+' 叫醒，起来聊两句');yield* standUp(a);const r=R[a.id];
  yield* walk(a,r.hostX,r.FY-6);a.face=r.dir;ch.ready=true;
 }
 yield* until(()=>ch.done);
 if(a.kind==='rest'){a.setStatus('回座位','active');yield* sitDown(a);}
 a.text=t0;a.cat=c0;a.bst=b0;
}
function* idleWait(a,secs,hostable){
 a.hostable=hostable;let t=secs;
 while(t>0||a.lock){
  if(a.guestHere){a.hostable=false;yield* host(a);a.guestHere=false;a.hostable=hostable;t=Math.max(t,.8);}
  t-=DT;yield;
 }
 a.hostable=false;
}
function pickHost(a){
 const cands=ACTORS.filter(h=>h!==a&&h.hostable&&!h.lock);
 if(!cands.length)return null;
 const zs=a.zone.kind==='room'?R[a.zone.id].side:null;
 const ws=cands.map(h=>{if(h.id==='gushen')return zs?2:4;const s=R[h.id].side;return zs?(s===zs?3:1):1.5;});
 let tot=ws.reduce((x,y)=>x+y,0),r=rnd()*tot;
 for(let i=0;i<cands.length;i++){r-=ws[i];if(r<=0)return cands[i];}
 return cands[0];
}
function* visit(a,h){
 h.lock=a;const ch={ready:false,done:false};h.chat=ch;
 yield* ensureStanding(a);
 a.setStatus('找 '+NAMES[h.id]+' 聊两句','active');if(!(h.kind==='rest'&&h.cat==='nap'))logEv(a.name,h.id==='gushen'?((a.zone.kind==='room'&&R[a.zone.id].f<3)?'下楼找顾深聊两句':'去大厅找顾深聊两句'):'去找 '+NAMES[h.id]+' 串门');
 let dest;
 if(h.id==='gushen'){const left=a.zone.kind==='room'?R[a.zone.id].side==='L':a.x<HUBX;dest={kind:'hub',x:HUBX+(left?-120:120),y:FY[3]-6};}
 else{const r=R[h.id];dest={kind:'room',id:h.id,x:r.standX,y:r.FY-6};}
 yield* travel(a,dest);
 a.face=h.id==='gushen'?(a.x<HUBX?1:-1):-R[h.id].dir;
 h.guestHere=true;
 yield* until(()=>ch.ready);
 for(let i=0;i<4;i++){const sp=i%2?h:a,ot=i%2?a:h;sp.say(pick(LINES));ot.say(pick(REPL));yield* wait(rr(2,2.6));}
 a.setStatus('聊完啦','active');
 ch.done=true;h.lock=null;
 yield* wait(.5);
}
function* coffeeTrip(a,water){
 yield* ensureStanding(a);
 let side=a.zone.kind==='room'?R[a.zone.id].side:(a.x<HUBX?'L':'R');
 const o=side==='L'?'R':'L';
 if(MACH[side].q.length>=2&&MACH[o].q.length<MACH[side].q.length)side=o;
 const m=MACH[side];
 a.setStatus(water?'起身去喝水':'去倒咖啡','active');logEv(a.name,(water?'去'+(side==='L'?'咖啡机':'茶水角')+'接杯水':'去'+(side==='L'?'咖啡机':'茶水角')+'倒咖啡')+(m.q.length?'，前面排着 '+m.q.length+' 人':''));
 m.q.push(a);
 const slot=i=>m.standX+m.inDir*i*58;
 yield* travel(a,{kind:'hub',x:slot(Math.max(0,m.q.indexOf(a))),y:FY[3]-4});
 let announced=false;
 while(m.q[0]!==a){
  const idx=m.q.indexOf(a);
  if(!announced){a.setStatus('排队等咖啡','active');announced=true;}
  a.face=m.face;
  yield* walk(a,slot(idx),FY[3]-4);yield;
 }
 yield* walk(a,slot(0),FY[3]-4);a.face=m.face;
 a.setStatus(water?'接水中':'倒咖啡中','active');
 a.prop='cup';a.propAt={x:m.cupX,y:m.cupY};yield* wait(2.6);
 a.propAt=null;a.setStatus(water?'喝水中':'喝口咖啡','active');a.anim='sip';a.animT=0;yield* wait(2.8);
 a.prop=null;a.anim=null;
 const qi=m.q.indexOf(a);if(qi>=0)m.q.splice(qi,1);
}
/* ---------- activities ---------- */
const ACT={
 *stretch(a){yield* ensureStanding(a);a.setStatus('伸个懒腰','active');logEv(a.name,'起来伸了个懒腰');a.anim='stretch';a.animT=0;yield* wait(2.9);a.anim=null;},
 *read(a){yield* ensureStanding(a);const r=R[a.id];a.setStatus('去看书','active');logEv(a.name,'到书架前翻几页书');yield* travel(a,{kind:'room',id:a.id,x:r.readX,y:r.bottom-30});a.face=1;a.setStatus('看书中','active');a.prop='book';a.anim='read';a.animT=0;yield* wait(rr(6,8.5));a.prop=null;a.anim=null;},
 *window(a){const r=R[a.id];if(!r.hasWin){yield* ACT.stretch(a);return;}yield* ensureStanding(a);a.setStatus('去窗边','active');logEv(a.name,'站到窗边看'+SKY.word);yield* travel(a,{kind:'room',id:a.id,x:r.winX,y:r.bottom-40});a.face=-r.dir;a.setStatus('看窗外','active');a.anim='look';a.animT=0;yield* wait(rr(5,7.5));a.anim=null;},
 *coffee(a){yield* coffeeTrip(a,false);},
 *visit(a){const h=pickHost(a);if(!h){yield* ACT.stretch(a);return;}yield* visit(a,h);}
};
function chooseAct(a){
 const opts=[['coffee',3],['visit',3.2],['read',2],['window',a.id==='linxi'?0:2],['stretch',1.4]].filter(o=>o[1]>0&&o[0]!==a.last);
 let tot=opts.reduce((x,o)=>x+o[1],0),r=rnd()*tot;
 for(const o of opts){r-=o[1];if(r<=0){a.last=o[0];return o[0];}}
 a.last=opts[0][0];return opts[0][0];
}
function* restLife(a,first){
 a.setStatus('小睡中 zZ','nap');yield* idleWait(a,first,true);
 for(;;){
  const n=1+(rnd()<.4?1:0);
  for(let i=0;i<n;i++){yield* ACT[chooseAct(a)](a);if(i<n-1)yield* wait(rr(.5,1.4));}
  yield* goHome(a);
  a.setStatus("小睡中 zZ","nap");yield* idleWait(a,SKY.late?rr(14,22):rr(8,13),true);
 }
}
const MTEXT=['会议进行中','在会上记要点','投屏讲方案'];
const WTEXT0={lumen:['在画设计图','调色中','改线稿'],forge:['在写方案','在整理资料','敲代码中'],gushen:['在做调度','派发任务','盯着全息屏']};
const WLOG0={'在写方案':'写完了一版方案','改线稿':'开始改线稿','派发任务':'给大家派了一轮新任务'};
const WTEXT={},WLOG={};
function loadW(){for(const k in WTEXT0){const v=(OD.bots||{})[k];const a=(Array.isArray(v)&&v.length>=1)?[v[0],v[1]||v[0],v[2]||v[0]]:WTEXT0[k];if(!WTEXT[k])WTEXT[k]=[];for(let i=0;i<3;i++)WTEXT[k][i]=a[i];}
 for(const k in WLOG)delete WLOG[k];Object.assign(WLOG,WLOG0,OD.wlog||{});}
loadW();
/* hosted over http(s) next to data.json: pick up new data every 5 min, no rebuild needed */
if(location.protocol.startsWith('http')&&!REC){const pull=()=>fetch('data.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d){for(const k in OD)delete OD[k];Object.assign(OD,d);MEET=OD.meeting||null;loadW();loadSched();lastSched='';lastSec=-1;window.__dataPulled=(window.__dataPulled||0)+1;}}).catch(()=>{});setTimeout(pull,2500);setInterval(pull,300000);}
function* workLife(a,first){
 let k=0;let t=first;
 for(;;){
  for(let i=0;i<3;i++){const wt=WTEXT[a.id][k++%3];a.setStatus(wt,'work');if(WLOG[wt])logEv(a.name,WLOG[wt]);yield* idleWait(a,t,true);t=rr(4.5,6.5);}
  yield* coffeeTrip(a,true);yield* goHome(a);
 }
}
function* gushenLife(a){
 let k=0;
 for(;;){
  const g=(meetingNow()?MTEXT:WTEXT.gushen)[k++%3];a.setStatus(g,'work');if(WLOG[g])logEv(a.name,WLOG[g]);yield* idleWait(a,rr(5,7),true);
  if(k%2===0){a.setStatus('喝口水','work');a.prop='cup';a.anim='sip';a.animT=0;yield* wait(3.2);a.prop=null;a.anim=null;}
 }
}
function initLives(){
 const first={axiom:rr(1.5,4),penny:rr(3,6.5),vox:rr(.8,3),linxi:rr(4.5,7.5)};
 ACTORS.forEach(a=>{a.sp=rr(136,158);});
 A.gushen.co=gushenLife(A.gushen);
 A.lumen.co=workLife(A.lumen,rr(6.5,9));A.forge.co=workLife(A.forge,rr(11,14));
 ['axiom','penny','vox','linxi'].forEach(id=>{A[id].co=restLife(A[id],first[id]);});
}

/* ---------- step ---------- */
function step(){
 T+=DT;
 for(const a of ACTORS){
  a.co.next();
  if(a.riding){a.x=a.riding.x;a.y=a.riding.y-8;}
  a.animT+=DT;if(a.pop>0)a.pop-=DT;if(a.talk>0)a.talk-=DT*0.6;
  a.wk+=(((T-a.lastWalk)<0.07?1:0)-a.wk)*Math.min(1,10*DT);
  {/* snap-fast when reversing so faceV never lags into a moonwalk */
   const flip=a.face*a.faceV<0;const k=flip?60:14;
   a.faceV+=(a.face-a.faceV)*Math.min(1,k*DT);
   if(flip&&Math.abs(a.face-a.faceV)<0.2)a.faceV=a.face;}
  if(a.id!=='gushen'){const tg=a.mode==='standing'?1:0;a.xf+=clamp(tg-a.xf,-DT*2,DT*2);}
 }
 /* de-overlap: standing people closer than 46px in x are nudged apart in depth */
 for(const a of ACTORS){
  if(a.mode!=='standing'||a.riding){a.yo+=(0-a.yo)*Math.min(1,6*DT);continue;}
  let push=0;
  for(const b of ACTORS){if(b===a||b.mode!=='standing'||b.riding)continue;
   if(Math.abs(a.x-b.x)<52&&Math.abs(a.y-b.y)<10){
    /* whoever is walking steps to the near side; the one standing still keeps its spot */
    const am=a.wk>.5,bm=b.wk>.5;
    push+=am&&!bm?1.4:(!am&&bm?0:(ACTORS.indexOf(a)<ACTORS.indexOf(b)?1:-1));}}
  a.yo+=(clamp(push,-1.4,1.4)*10-a.yo)*Math.min(1,8*DT);
 }
 for(const sd in CAR){const c=CAR[sd];c.door+=clamp(c.doorT-c.door,-DT/.6,DT/.6);}
 for(const id in R){
  const r=R[id];let awake=0,nap=0;
  for(const a of ACTORS){
   if(a.id==='gushen')continue;
   if(a.mode==='seated'){if(a.id===id){if(a.cat==='nap')nap++;else awake++;}}
   else{if(a.y>r.top-30&&a.y<=r.bottom+4&&a.x>r.x0+8&&a.x<r.x0+r.w-8&&!a.riding)awake++;}
  }
  const tgt=awake?1:(nap?.55:0);
  if(tgt>=r.Lt||r.hold<=0){if(tgt<r.Lt&&r.hold<=0){r.Lt=tgt;}else if(tgt>=r.Lt){r.Lt=tgt;r.hold=.9;}}
  if(tgt<r.Lt&&r.hold>0){r.hold-=DT;if(r.hold<=0)r.Lt=tgt;}
  if(tgt>=r.Lt)r.hold=.9;
  /* two-pole smoothing = eased in/out gradient */
  r.Ls+=(r.Lt-r.Ls)*(1-Math.exp(-DT*2.4));
  r.L+=(r.Ls-r.L)*(1-Math.exp(-DT*5));
 }
}

/* ---------- camera / opening / interaction state ---------- */
let OT0=0;
const CAM={S:1,tx:0,ty:0};
const FOC={room:null,k:0,kT:0,S:1.13,tx:0,ty:0};
const OX=760,OY=430;
const building=$('building');
building.style.transformOrigin=OX+'px '+OY+'px';
const OPEN_ORDER=['hub','lumen','forge','axiom','penny','vox','linxi'];
function ramp(k,OT){const t=OT-0.5-OPEN_ORDER.indexOf(k)*0.34;return eo3(t/1.2);}
const intro=[];
(function(){const tb=$('topbar');intro.push({el:tb.children[0],t:.95,dx:0,dy:-10},{el:tb.children[1],t:1.1,dx:0,dy:-10});
 [...$('side').children].forEach((p,i)=>intro.push({el:p,t:1.3+i*.13,dx:26,dy:0}));intro.push({el:document.querySelector('.foot'),t:2.1,dx:0,dy:0});})();
let introDone=false;

/* ---------- render ---------- */
const sparkEls={};
function mkSparks(id,n,col){const arr=[];for(let i=0;i<n;i++){const s=document.createElement('i');s.className='spark';s.style.background=col[i%col.length];s.style.boxShadow='0 0 8px '+col[i%col.length];(id==='gushen'?HUBEL:R[id].el).appendChild(s);arr.push(s);}sparkEls[id]=arr;}
mkSparks('lumen',6,['#F6D58E','#6EE7B7','#F7C7C7']);mkSparks('forge',6,['#6EE7B7','#9ED8F4']);mkSparks('gushen',9,['#6EE7B7','#F6D58E','#9ED8F4']);
const monitors=[...document.querySelectorAll('.monitor')];
const plates={};IDS.forEach(id=>{plates[id]=(id==='gushen'?HUBEL:R[id].el).querySelector('.plate');});
const dots={};IDS.forEach(id=>{dots[id]=plates[id].querySelector('.dot');});
const obstacles=[];
function measureObstacles(){obstacles.length=0;IDS.forEach(id=>{const room=id==='gushen'?{x0:548,top:36}:R[id];const p=plates[id];obstacles.push({x:room.x0+p.offsetLeft,y:room.top+p.offsetTop,w:p.offsetWidth,h:p.offsetHeight});});}
function depthScale(y){const b=y<340?328:y<620?608:918;return clamp(0.9+0.1*((y-(b-44))/28),0.9,1);}
function headOf(a){
 if(a.id==='gushen')return {x:HUBX,y:308};
 const r=R[a.id];const e=sm(a.xf);
 const hs={x:r.cx,y:r.bottom-2-SEATH[a.id]+4};
 if(e<.01)return hs;
 const y=a.y+a.yo,s=depthScale(y);const bob=Math.abs(Math.sin(a.ph*Math.PI))*5*a.wk;
 const hd={x:a.x,y:y-a.sh*s-bob+6};
 if(e>.99)return hd;
 return {x:hs.x+(hd.x-hs.x)*e,y:hs.y+(hd.y-hs.y)*e};
}
const measureCache={};
function bubW(a){if(a.bubTxt!==a.text){a.bubS.textContent=a.text;a.bubTxt=a.text;if(!measureCache[a.text])measureCache[a.text]=a.bub.offsetWidth;a.bubW=measureCache[a.text];}return a.bubW;}
const PRI={chat:0,active:1,work:2,nap:3};
function bhit(x,y,w,pad,placed){
 for(const o of obstacles)if(x<o.x+o.w+6&&x+w>o.x-6&&y<o.y+o.h&&y+36>o.y)return o;
 for(const p of placed)if(x<p.x+p.w+pad&&x+w>p.x-pad&&y<p.y+36+pad&&y+36>p.y-pad)return p;
 return null;
}
function layoutBubbles(items){
 items.sort((p,q)=>(PRI[p.a.bst]-PRI[q.a.bst])||(p.ax-q.ax));
 const placed=[];
 for(const it of items){
  const x0=clamp(it.ax-it.w/2,34,1488-it.w);let done=false;
  for(let lane=0;lane<4&&!done;lane++){
   const y=it.by0-lane*44;if(y<2)break;
   const pad=lane<it.a.lane?22:6;let x=x0,tries=0,o;
   while((o=bhit(x,y,it.w,pad,placed))&&obstacles.includes(o)&&tries++<3){x=clamp(o.x+o.w+8,34,1488-it.w);}
   if(!o){it.x=x;it.y=y;it.lane=lane;done=true;}
  }
  if(!done){let x=x0;for(let g=0;g<4;g++){const p=bhit(x,it.by0,it.w,6,placed);if(!p)break;x=clamp(p.x+p.w+8,34,1488-it.w);}it.x=x;it.y=it.by0;it.lane=0;}
  placed.push({x:it.x,y:it.y,w:it.w});
 }
}
/* helpers for hit-testing / hover card */
function actorBox(a){
 if(a.id==='gushen'){const S=SEATS.gushen;return {x:HUBX-S.w*.32,y:380,w:S.w*.64,h:420};}
 const r=R[a.id],e=sm(a.xf);
 if(e<.5){const S=SEATS[a.id];return {x:r.cx-S.w*.42,y:r.bottom-2-S.h,w:S.w*.84,h:S.h};}
 const y=a.y+a.yo,s=depthScale(y);return {x:a.x-a.sw*s*.5,y:y-a.sh*s,w:a.sw*s,h:a.sh*s};
}
function locText(a){if(a.riding)return '电梯里';const z=a.zone;if(z.kind==='room')return ROOMN[z.id];if(z.kind==='hub')return ROOMN.gushen;return '电梯厅';}
const HOV={a:null,k:0,room:null};
const OWN_ROOM_RECTS=()=>Object.values(R).map(r=>({id:r.id,x:r.x0,y:r.top,w:r.w,h:r.h})).concat([{id:'gushen',x:548,y:36,w:424,h:882}]);
function camToShell(cx,cy){ // client px -> shell coords
 const fr=$('fit').getBoundingClientRect(),k=fr.width/1920;
 const sx=(cx-fr.left)/k,sy=(cy-fr.top)/k;
 return {x:(sx-28-OX-CAM.tx)/CAM.S+OX,y:(sy-78-OY-CAM.ty)/CAM.S+OY,sx,sy};
}
function shellToStage(x,y){return {x:28+OX+(x-OX)*CAM.S+CAM.tx,y:78+OY+(y-OY)*CAM.S+CAM.ty};}

let lastSig='';let lastSec=-1,dayStr='';
function render(){
 const t=T,OT=T-OT0;FRAME++;const LITE=QUAL==='lite';
 /* ---- camera ---- */
 const so=1+.045*(1-eo3(OT/3.6));
 const fk=FOC.k;
 CAM.S=so*(1+(FOC.S-1)*fk);CAM.tx=FOC.tx*fk;CAM.ty=FOC.ty*fk;
 if(CAM.S!==building._S||CAM.tx!==building._tx||CAM.ty!==building._ty){building._S=CAM.S;building._tx=CAM.tx;building._ty=CAM.ty;
  building.style.transform=(CAM.S===1&&!CAM.tx&&!CAM.ty)?'none':`translate(${CAM.tx.toFixed(2)}px,${CAM.ty.toFixed(2)}px) scale(${CAM.S.toFixed(4)})`;}
 /* ---- intro of chrome ---- */
 if(!introDone){
  if(OT>3.2){introDone=true;intro.forEach(it=>{it.el.style.opacity='';it.el.style.visibility='';it.el.style.transform='';});bubLayer.style.visibility='';document.body.classList.add('ready');}
  else intro.forEach(it=>{const e=eo3((OT-it.t)/.8);it.el.style.visibility=e>.01?'visible':'hidden';it.el.style.opacity=e.toFixed(3);it.el.style.transform=`translate(${(it.dx*(1-e)).toFixed(1)}px,${(it.dy*(1-e)).toFixed(1)}px)`;});
 }
 const worldOp=sm((OT-.9)/1.6);const bubOp=sm((OT-2.3)/.8);
 W(world,'opacity',worldOp.toFixed(3));if(!introDone){W(bubLayer,'visibility',bubOp>.01?'visible':'hidden');}W(bubLayer,'opacity',bubOp.toFixed(3));
 for(const a of ACTORS){
  if(a.id==='gushen'){
   const S=SEATS.gushen;const bob=Math.sin(t*1.6)*3;let rot=Math.sin(t*.9)*.5;
   if(a.anim==='sip'){const k=Math.sin(Math.min(1,a.animT/3.2)*Math.PI);rot-=3*k;}
   W(S.el,'transform',`translateY(${bob.toFixed(2)}px) rotate(${rot.toFixed(2)}deg) scale(${(1+Math.sin(t*1.6)*.004).toFixed(4)})`);
  }else{
   const S=SEATS[a.id];const e=sm(a.xf);
   /* seated layer */
   if(e<.999){
    W(S.sp,'display','');W(S.sp,'opacity',(1-e).toFixed(3));
    let tr='';
    if(a.cat==='nap'){const k=Math.sin(t*1.9+a.ph0);tr=`translateY(${(k*-1.2).toFixed(2)}px) scale(${(1+k*.007).toFixed(4)},${(1+k*.012).toFixed(4)})`;}
    else{const k=Math.sin(t*9+a.ph0);tr=`translate(${(k*.6).toFixed(2)}px,${(-Math.abs(Math.sin(t*5.3))*1.2).toFixed(2)}px) rotate(${(Math.sin(t*3.1)*.35).toFixed(2)}deg)`;}
    if(e>0)tr+=` translateY(${(-10*e).toFixed(2)}px) scaleY(${(1+.05*e).toFixed(3)})`;
    W(S.el,'transform',tr);
   }else{W(S.sp,'display','none');W(S.el,'transform','');}
   if(S.fn)W(S.fn,'opacity',clamp(e*1.8,0,1).toFixed(3));
   /* standing layer */
   if(e>.003){
    W(a.el,'display','');W(a.sdw,'display','');
    const y=a.y+a.yo,s=depthScale(y);
    const wb=Math.abs(Math.sin(a.ph*Math.PI));const bob=wb*5*a.wk;
    let rot=Math.sin(a.ph*Math.PI)*2.4*a.wk+Math.sin(t*1.3+a.ph0)*.7*(1-a.wk);
    let sx=a.faceV,sy=1+Math.sin(t*2.2+a.ph0)*.011*(1-a.wk)+(wb*-.012)*a.wk,dx=0,dy=0;
    sy*=.8+.2*e;sx*=.92+.08*e;dy+=(1-e)*16;
    if(a.anim==='stretch'){const k=clamp(Math.sin(clamp(a.animT/2.7,0,1)*Math.PI)*1.6,0,1);sy*=1+.1*k;sx*=1-.05*k;rot+=3.5*k*Math.sign(a.faceV||1);dy-=3*k;}
    if(a.anim==='sip'){const k=clamp(Math.sin(clamp(a.animT/3.2,0,1)*Math.PI)*1.4,0,1);rot+=-3*k;}
    if(a.anim==='look'){rot+=Math.sin(a.animT*1.1)*1.6;}
    if(a.anim==='read'){dy+=Math.sin(a.animT*1.6)*1.2;rot+=Math.sin(a.animT*.8)*.8;}
    if(a.talk>0&&a.bst==='chat'&&a.mode==='standing'){dy-=Math.abs(Math.sin(t*9))*2.2;}
    W(a.el,'transform',`translate(${(a.x-a.sw/2+dx).toFixed(1)}px,${(y-a.sh+dy-bob).toFixed(1)}px) scale(${(sx*s).toFixed(3)},${(sy*s).toFixed(3)}) rotate(${rot.toFixed(2)}deg)`);
    W(a.el,'opacity',e.toFixed(3));
    W(a.el,'zIndex',a.riding?'2':String(Math.round(y)));
    W(a.sdw,'transform',`translate(${(a.x-39).toFixed(1)}px,${(y-6).toFixed(1)}px) scale(${(s*(1-bob*.03)).toFixed(3)},1)`);W(a.sdw,'opacity',e.toFixed(3));W(a.sdw,'zIndex',a.riding?'1':String(Math.round(y)-1));
   }else{W(a.el,'display','none');W(a.sdw,'display','none');}
  }
  const ce=a.cupEl,be=a.bookEl;
  if(a.prop==='cup'){
   W(ce,'display','block');let cx,cy;
   if(a.propAt){cx=a.propAt.x-9;cy=a.propAt.y-20;}
   else if(a.id==='gushen'){cx=HUBX+30;cy=640;}
   else{const y=a.y+a.yo,s=depthScale(y);const bob=Math.abs(Math.sin(a.ph*Math.PI))*5*a.wk;cx=a.x+a.face*21*s-9;cy=y-a.sh*s*.40-bob-12;if(a.anim==='sip'){const k=clamp(Math.sin(clamp(a.animT/3.2,0,1)*Math.PI)*1.4,0,1);cy-=14*k;cx-=a.face*5*k;}}
   const st=ce.children;for(let i=0;i<2;i++){const p=((t*0.9+i*.5)%1);st[i].style.opacity=(Math.sin(p*Math.PI)*.8).toFixed(2);st[i].style.transform=`translateY(${(-p*10).toFixed(1)}px)`;}
   ce.style.transform=`translate(${cx.toFixed(1)}px,${cy.toFixed(1)}px)`;ce.style.zIndex=a.id==='gushen'?30:Math.round(a.y)+2;
  }else W(ce,'display','none');
  if(a.prop==='book'){const y=a.y+a.yo,s=depthScale(y);const bob=Math.sin(a.animT*1.6)*1.2;W(be,'display','block');be.style.transform=`translate(${(a.x-17+a.face*3).toFixed(1)}px,${(y-a.sh*s*.44+bob).toFixed(1)}px) rotate(-4deg)`;be.style.zIndex=Math.round(y)+2;}else W(be,'display','none');
  const dc=a.cat;const dEl=dots[a.id];if(dEl._c!==dc){dEl.className='dot '+dc;dEl._c=dc;}
 }
 /* ---- lights (opening ramp x sim light x focus dim) ---- */
 const fdim=.5*fk;
 for(const id in R){const r=R[id];
  const base=r.L*ramp(id,OT);const dim=(FOC.room&&FOC.room!==id)?fdim:0;
  const L=base*(1-dim);
  W(r.warm,'opacity',L.toFixed(3));W(r.scrim,'opacity',(1-L).toFixed(3));W(r.edge,'opacity',L.toFixed(3));
  r.eff=base;
  r.hv+=(r.hvT-r.hv)*.2;W(r.hl,'opacity',(r.hv*(FOC.room===id?.35:1)).toFixed(3));
 }
 {const hr=ramp('hub',OT);const dim=(FOC.room&&FOC.room!=='gushen')?fdim:0;W(hubScrim,'opacity',(1-hr*(1-dim)).toFixed(3));A.gushen.eff=hr;
  hubHv+=(hubHvT-hubHv)*.2;W(hubHl,'opacity',hubHv.toFixed(3));}
 for(const sp of SPILLS){const l=sp.key==='hub'?ramp('hub',OT):R[sp.key].eff;W(sp.el,'opacity',(l*.95).toFixed(3));}
 /* ---- cars + doors ---- */
 for(const sd of ['L','R']){const c=CAR[sd],e=cars[sd];const tr=`translateY(${(c.y-190).toFixed(1)}px)`;
  W(e.car,'transform',tr);W(e.cdr,'transform',tr);e.car.style.top='0px';e.cdr.style.top='0px';
  W(e.cab,'height',Math.max(0,c.y-190-22).toFixed(0)+'px');
  const d=sm(c.door);W(e.dl,'transform',`scaleX(${(1-d*.9).toFixed(3)})`);W(e.dr,'transform',`scaleX(${(1-d*.9).toFixed(3)})`);W(e.cg,'opacity',(d*.9).toFixed(3));
  for(const f of [1,2,3]){const on=(Math.abs(c.y-(FY[f]+8))<6);if(e.labels[f]._on!==on){e.labels[f].classList.toggle('on',on);e.labels[f]._on=on;}}}
 /* ---- ambient ---- */
 monitors.forEach((m,i)=>{W(m,'opacity',(.8+.2*Math.sin(t*2.3+i*1.7)).toFixed(2));});
 if(!LITE||FRAME%6===0)for(const n of NIGHT){
  W(n.sd,'opacity',(1-SKY.N).toFixed(2));W(n.su,'opacity',(SKY.D*.85).toFixed(2));W(n.sw,'opacity',((1-SKY.N)*.28).toFixed(2));
  for(const s of n.stars){const v=(.35+.65*(.5+.5*Math.sin(t*s.sp+s.p)))*SKY.N;W(s.el,'opacity',(Math.round(v*20)/20).toString());}
  for(const b of n.blink){const v=(.12+.8*sm(.5+1.2*Math.sin(t*b.sp+b.p)))*(.35+.65*SKY.N);W(b.el,'opacity',(Math.round(v*20)/20).toString());}
  for(const c of n.cars){const ph=((t+c.off)%c.P)/6.5;if(ph<1){const x=c.dir>0?-10+ph*(n.Wd+20):n.Wd+10-ph*(n.Wd+20);c.el.setAttribute('transform',`translate(${x.toFixed(1)},${c.y})${c.dir<0?' scale(-1,1)':''}`);W(c.el,'opacity',(sm(ph*8)*sm((1-ph)*8)).toFixed(2));}else W(c.el,'opacity','0');}
 }
 const r1=1+Math.sin(t*1.8)*.025;W($('ring1'),'transform',`translateX(-50%) scale(${r1.toFixed(3)})`);W($('ring2'),'transform',`translateX(-50%) scale(${(1+Math.sin(t*1.8+1.2)*.03).toFixed(3)})`);
 if(!LITE)MOTES.forEach((m,i)=>{const p=((t*.035+i/MOTES.length)%1);const side=i%2;const bx=side?(742-548)+0:0;const cx=(side?424-10-75:10+75)+Math.sin(t*.5+i*2)*18+(((i*37)%60)-30)*(.3+p*.9);const y=860-p*540;W(m,'transform',`translate(${cx.toFixed(1)}px,${y.toFixed(1)}px)`);W(m,'opacity',(Math.sin(p*Math.PI)*.55*ramp('hub',OT)).toFixed(2));});
 ['lumen','forge','gushen'].forEach(id=>{const arr=sparkEls[id];const a=A[id];const on=a.cat==='work'||(id==='gushen');
  arr.forEach((s,i)=>{if(!on||(a.mode!=='seated'&&a.mode!=='fixed')||a.xf>.05){W(s,'opacity','0');return;}const p=((t*.5+i/arr.length)%1);let bx,by;
   if(id==='gushen'){bx=212+(i-4)*40+Math.sin(t+i)*10;by=560-p*150;}
   else{const r=R[id];bx=r.w/2+(id==='lumen'?-6:-70)+(i%3)*22;by=r.h-110-p*55;}
   s.style.transform=`translate(${(bx+Math.sin((p+i)*6)*12).toFixed(1)}px,${by.toFixed(1)}px)`;W(s,'opacity',(Math.sin(p*Math.PI)*.85).toFixed(2));});});
 /* ---- grain (12 Hz, film-like) ---- */
 const gf=Math.floor(t*12);if(!LITE&&gf!==render._gf){render._gf=gf;const h1=((gf*2654435761)>>>0)%64,h2=((gf*40503+977)>>>0)%64;$('grainW').style.transform=`translate(${h1-64}px,${h2-64}px)`;}
 /* ---- bubbles ---- */
 if(!obstacles.length)measureObstacles();
 const items=[];
 for(const a of ACTORS){const h=headOf(a);const w=bubW(a);if(a.bub._c!==a.bst){a.bub.className='bub '+a.bst;a.bub._c=a.bst;}items.push({a,w,ax:h.x,ay:h.y,by0:h.y-36-10,x:0,y:0,lane:0});}
 layoutBubbles(items);
 for(const it of items){const a=it.a;a.lane=it.lane;
  if(a.bx===null){a.bx=it.x;a.by=it.y;}else{const k=.3;a.bx+=(it.x-a.bx)*k;a.by+=(it.y-a.by)*k;}
  W(a.bub,'transform',`translate(${a.bx.toFixed(1)}px,${a.by.toFixed(1)}px)`);
  const tl=clamp(it.ax-a.bx-6,10,it.w-18);W(a.bubT,'left',tl.toFixed(0)+'px');
  if(it.lane>0){W(a.bubL,'display','block');W(a.bubL,'left',(tl+5).toFixed(0)+'px');W(a.bubL,'height',Math.max(0,it.by0-a.by+4).toFixed(0)+'px');}else W(a.bubL,'display','none');
  W(a.bub,'zIndex',a===HOV.a?'9':'1');
  /* inside the car the bubble has nowhere honest to sit (lanes push it over the next room); fade it while riding */
  a.bubV=(a.bubV===undefined?1:a.bubV)+(((a.riding?0:1))-(a.bubV===undefined?1:a.bubV))*.18;W(a.bub,'opacity',a.bubV>.98?'':a.bubV.toFixed(2));
 }
 updateHover();
 updateSide();
}
/* ---------- hover card ---------- */
function updateHover(){
 const a=HOV.a;const card=$('hcard');
 if(!a){HOV.k+=(0-HOV.k)*.25;if(HOV.k<.02){HOV.k=0;if(card._on){card._on=false;card.style.display='none';hring.style.opacity='0';}}
  else{W(card,'opacity',HOV.k.toFixed(3));W(hring,'opacity',(HOV.k).toFixed(3));}return;}
 HOV.k+=(1-HOV.k)*.25;
 if(!card._on){card._on=true;card.style.display='block';}
 if(card._id!==a.id){card._id=a.id;$('hc-img').src=AL.avs[a.id];$('hc-n').textContent=a.name;$('hc-r').textContent=ROLE[a.id];}
 const st=a.text+(a.bst==='chat'?'':'');
 $('hc-s').textContent=st;$('hc-d').style.background=CATC[a.cat]||'#64748B';
 $('hc-l').textContent='位置｜'+locText(a);
 const bx=actorBox(a);const tp=shellToStage(bx.x+bx.w/2,bx.y);
 let X=tp.x+30,Y=tp.y-60;if(X+244>1900)X=tp.x-30-244;Y=clamp(Y,86,960);
 card.style.transform=`translate(${X.toFixed(0)}px,${Y.toFixed(0)}px)`;W(card,'opacity',HOV.k.toFixed(3));
 /* ring at feet (shell coords, in world layer) */
 let fx,fy;if(a.id==='gushen'){fx=HUBX;fy=812;}else if(sm(a.xf)<.5){fx=R[a.id].cx;fy=R[a.id].bottom-6;}else{fx=a.x;fy=a.y+a.yo;}
 hring.style.transform=`translate(${fx.toFixed(1)}px,${(fy-10).toFixed(1)}px)`;hring.style.zIndex=Math.round(fy)-2;W(hring,'opacity',HOV.k.toFixed(3));
}
/* ---------- sidebar ---------- */
let SCHED=[];function loadSched(){SCHED=(OD.routines&&OD.routines.length?OD.routines:[]).map(r=>[r.time,r.name,r.status||'']);}loadSched();
const avsEl=$('avs');IDS.forEach(id=>{const im=document.createElement('img');im.src=AL.avs[id];im.alt=NAMES[id];avsEl.appendChild(im);});
const baseNow=params.has('now')?+params.get('now'):Date.now();
function nowMs(){return REC?baseNow+T*1000:Date.now();}
const pad2=n=>String(n).padStart(2,'0');
function tpDate(ms){return new Date(ms+8*3600e3);}
let lastSched='',lastStat='';
function updateSide(){
 const ms=nowMs();const sec=Math.floor(ms/1000);
 if(sec!==lastSec){lastSec=sec;const d=tpDate(ms);const hh=pad2(d.getUTCHours()),mm=pad2(d.getUTCMinutes()),ss=pad2(d.getUTCSeconds());
  $('clk').textContent=hh+':'+mm;$('clks').textContent=':'+ss;
  $('clkd').textContent=(d.getUTCMonth()+1)+'月'+d.getUTCDate()+'日 周'+'日一二三四五六'[d.getUTCDay()]+'｜台北实时';
  $('badge').textContent='台北 '+hh+':'+mm;
  skyAt(ms);const sub='剖面'+SKY.name+'｜没有任务也会自己动';if($('sub').textContent!==sub)$('sub').textContent=sub;
  const cur=d.getUTCHours()*60+d.getUTCMinutes();
  const today=tpDay(d),mk=$('m-k');
  const WD='日一二三四五六';
  if(MEET){const s0=hm(MEET.start),e0=hm(MEET.end),sh=Math.floor(s0/60);
   $('m-title').textContent=MEET.title;$('m-time').textContent=MEET.start+'–'+MEET.end;
   if(today===MEET.day){
    if(mk)mk.textContent='今日会议';
    const st=cur<s0?'待开始':cur<e0?'进行中':'已结束';$('m-st').textContent=st;
    $('m-rm').textContent=cur<s0?('距开始 '+Math.floor((s0-cur)/60)+' 小时 '+((s0-cur)%60)+' 分'):cur<e0?('已进行 '+(cur-s0)+' 分钟'):'今天已散会';
    const lo=Math.min(12,sh);$('m-now').style.left=clamp((cur/60-lo)/(24-lo)*100,0,99)+'%';$('m-now').style.display='';
   }else{
    const past=today>MEET.day;if(mk)mk.textContent=past?'最近一场会议':'下一场会议';
    $('m-st').textContent=past?'已结束':'待开始';
    const dd=new Date(MEET.day+'T00:00:00Z');
    $('m-rm').textContent=(dd.getUTCMonth()+1)+'月'+dd.getUTCDate()+'日 周'+WD[dd.getUTCDay()]+(MEET.room?'｜'+MEET.room:'')+(past?'｜已散会':'');
    $('m-now').style.display='none';
   }
  }else{if(mk)mk.textContent='会议';$('m-st').textContent='暂无';$('m-title').textContent='暂无安排';$('m-time').textContent='';$('m-rm').textContent='';$('m-now').style.display='none';}
  const sday=OD.routines_day===today;
  const html=SCHED.map(s=>{const tag=(sday&&s[2]==='ok')?'<b class="ok">✓</b>':(sday&&s[2]==='fail')?'<b class="no">✗</b>':'';return `<li><span class="tm">${s[0]}</span><span>${s[1]} ${tag}</span></li>`;}).join('');
  $('sch-n').textContent=SCHED.length+' 项';
  if(html!==lastSched){lastSched=html;$('sched').innerHTML=html;}
 }
 let w=0,ac=0,nap=0;const sig=[];
 ACTORS.forEach(a=>{if(a.cat==='work')w++;else if(a.cat==='active')ac++;else nap++;sig.push(a.cat);});
 let dark=0,lit=0;for(const id in R){if(R[id].L<.12)dark++;else lit++;}
 const sg=sig.join()+'|'+dark+'|'+A.gushen.stext+A.lumen.stext+A.forge.stext;
 if(sg!==lastStat){lastStat=sg;
  $('bigN').textContent=w+'/7';
  $('cnt').innerHTML=`<div><i style="background:#FBBF24"></i>干活<b>${w} 人</b></div><div><i style="background:#34D399"></i>走动聊天<b>${ac} 人</b></div><div><i style="background:#64748B"></i>小睡<b>${nap} 人</b></div><div><i style="background:#1E2A44;border:1px solid #6B7FA6"></i>熄灯<b>${dark} 间</b></div>`;
  [...avsEl.children].forEach((im,i)=>{const c=ACTORS[i].cat;if(im._c!==c){im.className=c;im._c=c;}});
  $('g-title').textContent='调度中枢｜'+(lit+1)+' 间亮灯、'+dark+' 间熄灯';
  $('gt-gushen').textContent=A.gushen.stext;$('gt-lumen').textContent=A.lumen.stext;$('gt-forge').textContent=A.forge.stext;
 }
 if(feedDirty){feedDirty=false;$('feed').innerHTML=feedList.map(f=>{const d=tpDate(f.t);return `<li><span class="ft">${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}</span><span><span class="who">${f.name}</span> ${f.text.replace(' zZ','')}</span></li>`;}).join('');}
 const pu=$('pulse');W(pu,'opacity',(.45+.55*Math.sin(T*3.2)*.5+.275).toFixed(2));
}
/* ---------- interaction (live only; never in rec) ---------- */
function fitStage(){const k=Math.min(innerWidth/1920,innerHeight/1080);const f=$('fit');
 if(Math.abs(k-1)<.001&&innerWidth===1920&&innerHeight===1080){f.style.transform='none';}
 else f.style.transform=`translate(${((innerWidth-1920*k)/2).toFixed(1)}px,${((innerHeight-1080*k)/2).toFixed(1)}px) scale(${k.toFixed(4)})`;}
fitStage();
if(!REC){
 addEventListener('resize',fitStage);
 let mouse=null;
 document.addEventListener('mousemove',e=>{mouse={x:e.clientX,y:e.clientY};});
 document.addEventListener('mouseleave',()=>{mouse=null;});
 function pickAt(){
  if(!mouse||(performance.now()-T0real)<3200){return {a:null,room:null};}
  const p=camToShell(mouse.x,mouse.y);
  let best=null,bd=1e9;
  for(const a of ACTORS){const b=actorBox(a);if(p.x>=b.x&&p.x<=b.x+b.w&&p.y>=b.y&&p.y<=b.y+b.h){const d=Math.abs(p.x-(b.x+b.w/2))+(a.id==='gushen'?400:0)-(a.mode==='standing'?200:0);if(d<bd){bd=d;best=a;}}}
  let room=null;for(const r of OWN_ROOM_RECTS()){if(p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h)room=r.id;}
  return {a:best,room};
 }
 const T0real=performance.now();
 setInterval(()=>{const h=pickAt();HOV.a=h.a;HOV.room=h.room;
  for(const id in R)R[id].hvT=(h.room===id&&!h.a&&FOC.room!==id)?1:0;
  hubHvT=(h.room==='gushen'&&!h.a&&FOC.room!=='gushen')?1:0;
  document.body.style.cursor=(h.a||h.room)?'pointer':'default';},50);
 function focusRoom(id){
  if(!id){FOC.room=null;FOC.kT=0;$('hint').style.opacity='0';setTimeout(()=>{if(!FOC.room)$('hint').style.display='none';},400);return;}
  const rr_=OWN_ROOM_RECTS().find(r=>r.id===id);const cx=rr_.x+rr_.w/2,cy=rr_.y+Math.min(rr_.h,400)/2+(id==='gushen'?120:0);
  FOC.room=id;FOC.kT=1;FOC.tx=(cx-OX)*(.55-FOC.S);FOC.ty=(cy-OY)*(.55-FOC.S);
  const h=$('hint');h.style.display='block';requestAnimationFrame(()=>{h.style.opacity='1';});
 }
 document.addEventListener('click',e=>{mouse={x:e.clientX,y:e.clientY};if((performance.now()-T0real)<3200)return;const h=pickAt();if(h.room&&FOC.room!==h.room)focusRoom(h.room);else focusRoom(null);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')focusRoom(null);});
 window.__focus=focusRoom;
}
/* ---------- quality toggle (live only) ---------- */
(function initQuality(){
 if(REC)return;
 const stage=document.querySelector('.stage');
 const b=document.createElement('button');b.type='button';b.id='q-btn';b.title='切换画质（Q）';stage.appendChild(b);
 const tip=document.createElement('div');tip.id='q-tip';tip.textContent='画面有点卡？点这里切到流畅';stage.appendChild(tip);
 function paint(){b.innerHTML='画质<b>'+(QUAL==='hi'?'高品质':'流畅')+'</b>';b.setAttribute('aria-label','画质：'+(QUAL==='hi'?'高品质':'流畅')+'，点击切换');document.body.classList.toggle('lite',QUAL==='lite');}
 function set(q){QUAL=q;try{localStorage.setItem('office-quality',q);}catch(e){}tip.classList.remove('on');paint();}
 b.addEventListener('click',e=>{e.stopPropagation();set(QUAL==='hi'?'lite':'hi');});
 document.addEventListener('keydown',e=>{if((e.key==='q'||e.key==='Q')&&!e.metaKey&&!e.ctrlKey)set(QUAL==='hi'?'lite':'hi');});
 paint();
 /* watchdog: after the opening, sample 4 s of frames; if it runs under 42 fps on high quality, suggest (never force) lite */
 let n=0,t0=0;
 (function probe(now){if(!t0){t0=now+4000;}
  if(now<t0){requestAnimationFrame(probe);return;}
  if(!probe.s){probe.s=now;n=0;}n++;
  if(now-probe.s<4000){requestAnimationFrame(probe);return;}
  const fps=n*1000/(now-probe.s);window.__fps=fps;
  if(fps<42&&QUAL==='hi'){tip.classList.add('on');setTimeout(()=>tip.classList.remove('on'),9000);}
 })(performance.now());
})();
/* ---------- BGM (seamless ambient loop) ---------- */
/* the mp3 holds a 24 s strictly periodic loop plus a 1 s tail; Web Audio loops
   [0.5, 24.5) sample-accurately, so encoder padding never lands on the seam */
const BGM={on:false,ctx:null,gain:null,buf:null,src:null};
(function initBgm(){
 if(REC)return;
 const data=(window.ASSETS_LIVE&&ASSETS_LIVE.bgm)||'';
 if(!data)return;
 const VOL=0.30,LOOP_A=0.5,LOOP_B=24.5,FADE=.6;
 const stage=document.querySelector('.stage');
 const btn=document.createElement('button');
 btn.id='bgm-btn';btn.type='button';btn.title='背景音乐（M）';btn.setAttribute('aria-label','切换背景音乐');btn.setAttribute('aria-pressed','false');
 btn.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9v6h3l5 4V5L7 9H4zm11.5 3a3.5 3.5 0 0 0-1.8-3.05v6.1A3.5 3.5 0 0 0 15.5 12zM14 4.23v2.06a5.5 5.5 0 0 1 0 11.42v2.06A7.5 7.5 0 0 0 14 4.23z"/></svg>';
 stage.appendChild(btn);
 const hint=document.createElement('button');hint.type='button';hint.id='bgm-hint';hint.textContent='点击开声';stage.appendChild(hint);
 function paint(){btn.classList.toggle('muted',!BGM.on);btn.classList.toggle('on',BGM.on);btn.setAttribute('aria-pressed',String(BGM.on));
  hint.style.opacity=BGM.on?'0':'1';hint.style.pointerEvents=BGM.on?'none':'auto';}
 const AC=window.AudioContext||window.webkitAudioContext;
 let fallback=null;
 async function prepare(){
  if(BGM.buf||fallback)return true;
  if(!AC){fallback=new Audio(data);fallback.loop=true;fallback.volume=VOL;return true;}
  try{
   if(!BGM.ctx){BGM.ctx=new AC();BGM.gain=BGM.ctx.createGain();BGM.gain.gain.value=0;BGM.gain.connect(BGM.ctx.destination);}
   const bin=atob(data.slice(data.indexOf(',')+1));const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
   BGM.buf=await new Promise((ok,no)=>BGM.ctx.decodeAudioData(u.buffer,ok,no));return true;
  }catch(e){fallback=new Audio(data);fallback.loop=true;fallback.volume=VOL;return true;}
 }
 async function setOn(on){
  on=!!on;
  if(on){
   await prepare();
   if(fallback){try{await fallback.play();}catch(e){BGM.on=false;paint();return;}BGM.on=true;paint();return;}
   try{await BGM.ctx.resume();}catch(e){}
   if(BGM.ctx.state!=='running'){BGM.on=false;paint();return;}
   if(!BGM.src){const s=BGM.ctx.createBufferSource();s.buffer=BGM.buf;s.loop=true;s.loopStart=LOOP_A;s.loopEnd=Math.min(LOOP_B,BGM.buf.duration);s.connect(BGM.gain);s.start(0,LOOP_A);BGM.src=s;}
   const g=BGM.gain.gain,n=BGM.ctx.currentTime;g.cancelScheduledValues(n);g.setValueAtTime(g.value,n);g.linearRampToValueAtTime(VOL,n+FADE);
  }else{
   if(fallback)fallback.pause();
   else if(BGM.ctx){const g=BGM.gain.gain,n=BGM.ctx.currentTime;g.cancelScheduledValues(n);g.setValueAtTime(g.value,n);g.linearRampToValueAtTime(0,n+FADE*.6);}
  }
  BGM.on=on;paint();
 }
 btn.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();setOn(!BGM.on);});
 hint.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();setOn(true);});
 document.addEventListener('keydown',e=>{if((e.key==='m'||e.key==='M')&&!e.metaKey&&!e.ctrlKey)setOn(!BGM.on);});
 paint();
 /* autoplay with sound is usually blocked: try once, otherwise keep the hint up */
 prepare().then(()=>{if(BGM.ctx&&BGM.ctx.state==='running')setOn(true);});
 window.__bgm=BGM;
})();

/* ---------- boot ---------- */
function boot(pre){
 seed=params.has('seed')?+params.get('seed'):seed;rnd=mulberry32(seed);
 skyAt(nowMs());initLives();
 const n=Math.round((pre||0)/DT);for(let i=0;i<n;i++)step();
 OT0=params.has('ot0')?+params.get('ot0'):T;
 measureObstacles();render();
 window.__ready=true;
}
window.__tick=function(frames){for(let i=0;i<(frames||1);i++)step();render();};
window.__sim={get T(){return T;},get OT(){return T-OT0;},get seed(){return seed;},A,R,CAM,HOV,FOC,CAR,MACH};
const pre=params.has('pre')?+params.get('pre'):(REC?0:4);
function go(){
 boot(pre);
 if(!REC){let last=performance.now(),acc=0;
  (function loop(now){const d=Math.min(.1,(now-last)/1000);last=now;acc+=d;let n=0;while(acc>=DT&&n<6){step();acc-=DT;n++;}
   FOC.k+=(FOC.kT-FOC.k)*(1-Math.exp(-d*5));if(Math.abs(FOC.kT-FOC.k)<.001)FOC.k=FOC.kT;
   render();requestAnimationFrame(loop);})(last);}
}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>setTimeout(go,50));else go();
})();
