import { cities } from './cities.js';
import { translate, isLanguage } from './i18n.js';

const RAD = Math.PI / 180;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
let geographyPromise;
export function loadGeography() {
  if (!geographyPromise) geographyPromise = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(new URL('../data/world.json', import.meta.url), { signal: controller.signal });
      if (!response.ok) throw new Error('Map request failed: ' + response.status);
      const topology = await response.json();
      if (!topology?.objects?.countries || !globalThis.topojson?.feature) throw new Error('Map data is unavailable');
      return topology;
    } finally { clearTimeout(timeout); }
  })().catch(error => { geographyPromise = null; throw error; });
  return geographyPromise;
}

// Both renderers use this same local Natural Earth map and palette.
export function geographyCanvas(topology) {
  if (!topology?.objects?.countries || !globalThis.topojson?.feature) throw new Error('Map data is unavailable');
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas is unavailable');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0b2433'; ctx.fillRect(0, 0, W, H);
  const trace = (ring, shift) => {
    let previous;
    ring.forEach(([longitude, latitude], index) => {
      let lon = longitude;
      if (previous !== undefined) {
        while (lon - previous > 180) lon -= 360;
        while (lon - previous < -180) lon += 360;
      }
      const x = (lon + 180) / 360 * W + shift, y = (90 - latitude) / 180 * H;
      if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      previous = lon;
    });
    ctx.closePath();
  };
  const countries = globalThis.topojson.feature(topology, topology.objects.countries);
  countries.features.forEach(feature => {
    if (!feature.geometry) return;
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
    for (const polygon of polygons) for (const shift of [-W, 0, W]) {
      ctx.beginPath(); polygon.forEach(ring => trace(ring, shift));
      ctx.fillStyle = '#3d8b85'; ctx.fill('evenodd');
      ctx.strokeStyle = '#7bb9b6'; ctx.lineWidth = .65; ctx.stroke();
    }
  });
  ctx.lineWidth = .5; ctx.strokeStyle = 'rgba(132,190,200,.13)';
  for (let lon = -180; lon < 180; lon += 30) {
    const x = (lon + 180) / 360 * W;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = (90 - lat) / 180 * H;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  return canvas;
}
const vector = (lat, lon) => {
  const p = lat * RAD, l = lon * RAD;
  return [Math.cos(p) * Math.cos(l), Math.sin(p), -Math.cos(p) * Math.sin(l)];
};
export function sunVector(time) {
  const date = new Date(time);
  const day = (time - Date.UTC(date.getUTCFullYear(), 0, 1)) / 86400000 + 1;
  const g = 2 * Math.PI / 365.2422 * (day - 1);
  const d = .006918 - .399912 * Math.cos(g) + .070257 * Math.sin(g) - .006758 * Math.cos(2*g) + .000907 * Math.sin(2*g) - .002697 * Math.cos(3*g) + .00148 * Math.sin(3*g);
  const equation = 229.18 * (.000075 + .001868 * Math.cos(g) - .032077 * Math.sin(g) - .014615 * Math.cos(2*g) - .040849 * Math.sin(2*g));
  return vector(d / RAD, 180 - 15 * (date.getUTCHours() + date.getUTCMinutes()/60 + date.getUTCSeconds()/3600) - equation/4);
}
const dot = (a,b) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function node(tag, className, style, parent) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.assign(el.style, style || {}); parent?.appendChild(el); return el;
}

/** Software globe for browsers without WebGL. This renders actual map geography. */
export async function createCanvasGlobe(container, { onSelect, topology: suppliedTopology, initialView } = {}) {
  const oldStyle = container.getAttribute('style');
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  container.style.overflow = 'hidden';
  const canvas = node('canvas', 'globe-canvas globe-canvas-2d', { width:'100%',height:'100%',display:'block',touchAction:'none',cursor:'grab',outlineOffset:'-3px' }, container);
  canvas.tabIndex = 0;
  canvas.dataset.renderer = 'canvas2d';
  const ctx = canvas.getContext('2d', { alpha:true });
  const labels = node('div','globe-labels',{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'},container);
  const controls = node('div','globe-controls',{position:'absolute',right:'24px',bottom:'28px',display:'flex',gap:'6px'},container);
  const controlStyle = {appearance:'none',border:'1px solid #91bcce24',color:'#bed4df',background:'#0a1524cc',width:'36px',height:'36px',borderRadius:'50%',fontSize:'18px',cursor:'pointer',padding:'0',backdropFilter:'blur(12px)'};
  const rotate = node('button','',controlStyle,controls), zoomIn = node('button','',controlStyle,controls), zoomOut = node('button','',controlStyle,controls), reset = node('button','',controlStyle,controls);
  [rotate,zoomIn,zoomOut,reset].forEach(el=>el.type='button');
  rotate.style.fontSize='12px';zoomIn.textContent='+';zoomOut.textContent='−';reset.textContent='↺';
  const hint = node('div','globe-hint',{position:'absolute',left:'25px',bottom:'40px',color:'#718a9f',fontSize:'10px',letterSpacing:'1.4px',pointerEvents:'none'},container);
  const status = node('div','globe-map-status',{position:'absolute',left:'50%',top:'45%',transform:'translate(-50%,-50%)',color:'#bcd5df',textAlign:'center',fontSize:'13px',lineHeight:'1.8',maxWidth:'320px',width:'80%',zIndex:'3'},container);
  status.setAttribute('role','status');
  const retry = node('button','button',{marginTop:'12px'},status);
  const message = node('p','',{margin:'0'},status);
  status.prepend(message);retry.type='button';retry.hidden=true;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let lang='en', reduced=motion.matches, autoRotate=!reduced, dead=false, visible=true;
  let members=[],pins=[],selectedId=null,time=Date.now(),map=null,mapData=null,mapW=0,mapH=0;
  let width=0,height=0,dpr=1,radius=100,raf=0,lastTime=0,lastPaint=0,pausedUntil=0,resumeTimer=0,dragging=false,pointer=null;
  let bitmap=null,pixels=null,normals=[],bitmapSize=0,dirty=true,loadCount=0;
  const surface=document.createElement('canvas'), surfaceCtx=surface.getContext('2d');
  const view={lon:Number.isFinite(initialView?.lon)?initialView.lon:35,lat:Number.isFinite(initialView?.lat)?clamp(initialView.lat,-72,72):20,zoom:Number.isFinite(initialView?.zoom)?clamp(initialView.zoom,.65,1.5):1},target={...view};
  const t=(zh,en)=>translate(en,lang);
  const stars=Array.from({length:150},(_,i)=>({x:((i*137.508)%360)/360,y:((i*97.37)%280)/280,alpha:.14+(i%4)*.08}));
  const cityVectors=cities.map(c=>vector(c.lat,c.lon));

  function text() {
    rotate.textContent=autoRotate?'Ⅱ':'▶';
    const phrases=[autoRotate?t('暂停自转','Pause rotation'):t('开始自转','Start rotation'),t('放大地球','Zoom in'),t('缩小地球','Zoom out'),t('重置地球视角','Reset globe view')];
    [rotate,zoomIn,zoomOut,reset].forEach((el,i)=>{el.setAttribute('aria-label',phrases[i]);el.title=phrases[i];});
    rotate.setAttribute('aria-pressed',String(autoRotate));
    canvas.setAttribute('aria-label',t('拖动探索 · 滚轮缩放','Drag to explore · scroll to zoom'));
    hint.textContent=t('拖动探索 · 滚轮缩放','Drag to explore · scroll to zoom');
    retry.textContent=t('重新加载地图','Reload map');
    if(!map)message.textContent=retry.hidden?t('正在展开世界地图…','Opening the world map…'):t('地图暂时无法加载，请重试。','Map unavailable. Retry to load it.');
  }
  function requestRender() {
    if(!raf&&!dead&&visible&&!document.hidden&&map)raf=requestAnimationFrame(render);
  }
  function pause(ms=10000) {
    pausedUntil=performance.now()+ms;clearTimeout(resumeTimer);
    if(autoRotate)resumeTimer=setTimeout(()=>{lastTime=0;requestRender();},ms+25);
  }
  function setAutoRotate(value){autoRotate=!!value;pausedUntil=0;lastTime=0;clearTimeout(resumeTimer);text();requestRender();}
  function setLanguage(value){lang=isLanguage(value)?value:'en';text();}
  function resize(){
    width=container.clientWidth;height=container.clientHeight||360;
    dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));
    dirty=true;requestRender();
  }
  function prepBitmap(size){
    bitmapSize=size;surface.width=surface.height=size;
    bitmap=surfaceCtx.createImageData(size,size);pixels=bitmap.data;normals=[];
    const half=size/2;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const nx=(x+.5-half)/half,ny=(half-y-.5)/half,r=nx*nx+ny*ny;
      if(r<=1)normals.push((y*size+x)*4,nx,ny,Math.sqrt(1-r));
    }
  }
  function basis(){
    const p=view.lat*RAD,l=view.lon*RAD,cp=Math.cos(p),sp=Math.sin(p),cl=Math.cos(l),sl=Math.sin(l);
    return {front:[cp*cl,sp,-cp*sl],east:[-sl,0,-cl],north:[-sp*cl,cp,sp*sl]};
  }
  function project(v,b,r=radius){
    return {x:width/2+dot(v,b.east)*r,y:height/2-dot(v,b.north)*r,z:dot(v,b.front)};
  }
  function paint(){
    if(!ctx||!mapData||!surfaceCtx||!width)return;
    const size=width<600?360:480;
    if(bitmapSize!==size)prepBitmap(size);
    radius=Math.min(width*.43,height*.43)*view.zoom;
    const b=basis(),sun=sunVector(time);
    for(let k=0;k<normals.length;k+=4){
      const at=normals[k],sx=normals[k+1],sy=normals[k+2],sz=normals[k+3];
      const x=sx*b.east[0]+sy*b.north[0]+sz*b.front[0],y=sx*b.east[1]+sy*b.north[1]+sz*b.front[1],z=sx*b.east[2]+sy*b.north[2]+sz*b.front[2];
      const u=((Math.atan2(-z,x)+Math.PI)/(Math.PI*2)*mapW)|0;
      const v=((Math.PI/2-Math.asin(clamp(y,-1,1)))/Math.PI*mapH)|0;
      const src=(clamp(v,0,mapH-1)*mapW+clamp(u,0,mapW-1))*4;
      let day=clamp((x*sun[0]+y*sun[1]+z*sun[2]+.12)/.36,0,1);day=day*day*(3-2*day);
      const limb=.86+.14*sz;
      const rim=Math.pow(1-sz,3)*14;
      pixels[at]=clamp(mapData[src]*(.34+.69*day)*limb+rim*.2,0,255);
      pixels[at+1]=clamp(mapData[src+1]*(.49+.64*day)*limb+rim*.8,0,255);
      pixels[at+2]=clamp(mapData[src+2]*(.66+.48*day)*limb+rim,0,255);
      pixels[at+3]=255;
    }
    surfaceCtx.putImageData(bitmap,0,0);
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);
    for(const star of stars){ctx.fillStyle='rgba(150,190,210,'+star.alpha+')';ctx.fillRect(star.x*width,star.y*height,1,1);}
    const halo=ctx.createRadialGradient(width/2,height/2,radius*.95,width/2,height/2,radius*1.10);
    halo.addColorStop(0,'rgba(60,154,190,.22)');halo.addColorStop(.48,'rgba(40,115,160,.13)');halo.addColorStop(1,'rgba(40,115,160,0)');
    ctx.fillStyle=halo;ctx.beginPath();ctx.arc(width/2,height/2,radius*1.1,0,Math.PI*2);ctx.fill();
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(surface,width/2-radius,height/2-radius,radius*2,radius*2);
    ctx.strokeStyle='rgba(105,184,203,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(width/2,height/2,radius,0,Math.PI*2);ctx.stroke();
    cityVectors.forEach(v=>{const p=project(v,b);if(p.z>.02&&dot(v,sun)<-.05){ctx.fillStyle='rgba(251,208,135,.55)';ctx.beginPath();ctx.arc(p.x,p.y,1.1,0,Math.PI*2);ctx.fill();}});
    const occupied=[];
    [...pins].sort((a,b)=>Number(b.member.id===selectedId)-Number(a.member.id===selectedId)).forEach(pin=>{
      const p=project(pin.v,b);pin.screen=p;
      const w=pin.button.offsetWidth||130;
      const x=clamp(p.x,w/2+8,width-w/2-8),y=clamp(p.y-17,42,height-62);
      const box={l:x-w/2,r:x+w/2,t:y-36,b:y};
      const clash=occupied.some(r=>box.l<r.r+7&&box.r>r.l-7&&box.t<r.b+7&&box.b>r.t-7);
      const show=p.z>.12&&!clash&&p.x>0&&p.x<width&&p.y>0&&p.y<height&&occupied.length<8;
      pin.button.style.visibility=show?'visible':'hidden';
      if(p.z>.02){
        ctx.strokeStyle=pin.color+'88';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,6,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle=pin.color;ctx.beginPath();ctx.arc(p.x,p.y,pin.member.id===selectedId?3.7:2.7,0,Math.PI*2);ctx.fill();
      }
      if(show){occupied.push(box);pin.button.style.left=x+'px';pin.button.style.top=y+'px';}
    });
    canvas.dataset.longitude=view.lon.toFixed(3);
    canvas.dataset.mapReady='true';
  }
  function render(now){
    raf=0;if(dead||!visible||document.hidden||!map)return;
    const delta=lastTime?Math.min((now-lastTime)/1000,.1):0;lastTime=now;
    const rotating=autoRotate&&!dragging&&now>=pausedUntil;
    if(rotating){target.lon+=delta*.6;dirty=true;}
    const moving=Math.abs(target.lon-view.lon)>.002||Math.abs(target.lat-view.lat)>.002||Math.abs(target.zoom-view.zoom)>.001;
    const ease=reduced?1:dragging?.7:.18;
    view.lon+=(target.lon-view.lon)*ease;view.lat+=(target.lat-view.lat)*ease;view.zoom+=(target.zoom-view.zoom)*ease;
    if((dirty||moving)&&(!rotating||now-lastPaint>=1000/24)){
      paint();dirty=false;lastPaint=now;
    }
    if(rotating||moving)requestRender();
  }
  function focus(member){
    if(!member||!Number.isFinite(+member.lon)||!Number.isFinite(+member.lat))return;
    selectedId=member.id;let delta=(+member.lon-view.lon)%360;
    if(delta>180)delta-=360;if(delta<-180)delta+=360;
    target.lon=view.lon+delta;target.lat=clamp(+member.lat,-65,65);pause(16000);dirty=true;requestRender();
  }
  function update(nextMembers,instant=Date.now()){
    members=nextMembers.filter(m=>Number.isFinite(+m.lat)&&Number.isFinite(+m.lon));
    time=Number.isFinite(+instant)?+instant:Date.now();labels.replaceChildren();pins=[];
    members.forEach(member=>{
      const color=typeof member.color==='string'&&/^#[\da-f]{6}$/i.test(member.color)?member.color:'#91e8d0';
      const button=node('button','globe-city-label',{position:'absolute',transform:'translate(-50%, -100%)',pointerEvents:'auto',visibility:'hidden',display:'flex',alignItems:'center',gap:'8px',whiteSpace:'nowrap',maxWidth:'220px',padding:'9px 12px',border:'1px solid #7ab5c63d',borderRadius:'24px',background:'rgba(6,18,30,.86)',backdropFilter:'blur(10px)',color:'#dcecef',fontFamily:'inherit',fontSize:'12px',fontWeight:'500',lineHeight:'1.2',cursor:'pointer'},labels);
      button.type='button';button.title=member.name||member.city;button.setAttribute('aria-label',(member.name||member.city)+' · '+(member.displayCity||member.city));
      node('span','',{width:'5px',height:'5px',borderRadius:'50%',background:color,boxShadow:'0 0 9px '+color,flexShrink:'0'},button);
      node('span','',{overflow:'hidden',textOverflow:'ellipsis'},button).textContent=member.displayCity||member.city||member.name;
      if(globalThis.moment?.tz)node('span','',{fontVariantNumeric:'tabular-nums',color:'#9cb1c2',fontSize:'11px',direction:'ltr',unicodeBidi:'isolate'},button).textContent=globalThis.moment.tz(time,member.zone).format('HH:mm');
      button.onclick=()=>{focus(member);onSelect?.(member.id);};
      pins.push({member,button,color,v:vector(+member.lat,+member.lon)});
    });dirty=true;requestRender();
  }
  const onDown=event=>{
    if(event.button!==0)return;pause();dragging=true;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
    canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';
  };
  const onMove=event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer.moved||=Math.abs(dx)+Math.abs(dy)>2;
    target.lon-=dx*.3;target.lat=clamp(target.lat+dy*.28,-72,72);pointer.x=event.clientX;pointer.y=event.clientY;
    dirty=true;requestRender();
  };
  const onUp=event=>{
    if(!pointer||pointer.id!==event.pointerId)return;
    if(!pointer.moved){
      const bounds=canvas.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top;
      const pin=pins.find(p=>p.screen?.z>.02&&Math.hypot(p.screen.x-x,p.screen.y-y)<12);
      if(pin){focus(pin.member);onSelect?.(pin.member.id);}
    }
    pointer=null;dragging=false;canvas.style.cursor='grab';pause();requestRender();
  };
  const onCancel=()=>{pointer=null;dragging=false;canvas.style.cursor='grab';pause();requestRender();};
  const onWheel=event=>{event.preventDefault();pause();target.zoom=clamp(target.zoom-event.deltaY*.001,.65,1.5);dirty=true;requestRender();};
  const onKey=event=>{
    const actions={ArrowLeft:()=>target.lon-=12,ArrowRight:()=>target.lon+=12,ArrowUp:()=>target.lat=clamp(target.lat+9,-72,72),ArrowDown:()=>target.lat=clamp(target.lat-9,-72,72),'+':()=>target.zoom=clamp(target.zoom+.1,.65,1.5),'=':()=>target.zoom=clamp(target.zoom+.1,.65,1.5),'-':()=>target.zoom=clamp(target.zoom-.1,.65,1.5)};
    if(actions[event.key]){event.preventDefault();pause();actions[event.key]();dirty=true;requestRender();}
  };
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointermove',onMove);canvas.addEventListener('pointerup',onUp);canvas.addEventListener('pointercancel',onCancel);canvas.addEventListener('wheel',onWheel,{passive:false});canvas.addEventListener('keydown',onKey);
  rotate.onclick=()=>setAutoRotate(!autoRotate);
  zoomIn.onclick=()=>{pause();target.zoom=clamp(target.zoom+.15,.65,1.5);dirty=true;requestRender();};
  zoomOut.onclick=()=>{pause();target.zoom=clamp(target.zoom-.15,.65,1.5);dirty=true;requestRender();};
  reset.onclick=()=>{Object.assign(target,{lon:35,lat:20,zoom:1});pause();dirty=true;requestRender();};
  const onVisibility=()=>{lastTime=0;if(!document.hidden)requestRender();};
  const onMotion=event=>{reduced=event.matches;if(reduced)setAutoRotate(false);};
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(container);
  const intersection=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;lastTime=0;if(visible)requestRender();});intersection.observe(container);
  document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',onMotion);
  async function load(){
    const ticket=++loadCount;retry.hidden=true;text();
    try{
      if(!ctx||!surfaceCtx)throw new Error('Canvas is unavailable');
      const topology=suppliedTopology||await loadGeography();
      const loaded=geographyCanvas(topology);
      if(dead||ticket!==loadCount)return;
      map=loaded;mapW=map.width;mapH=map.height;mapData=map.getContext('2d').getImageData(0,0,mapW,mapH).data;
      status.hidden=true;dirty=true;requestRender();
    }catch{
      if(dead||ticket!==loadCount)return;
      retry.hidden=false;status.hidden=false;text();
    }
  }
  retry.onclick=load;text();resize();void load();
  return {update,focus,setAutoRotate,setLanguage,destroy(){
    dead=true;++loadCount;cancelAnimationFrame(raf);clearTimeout(resumeTimer);resizeObserver.disconnect();intersection.disconnect();
    document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',onMotion);
    canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointermove',onMove);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('pointercancel',onCancel);canvas.removeEventListener('wheel',onWheel);canvas.removeEventListener('keydown',onKey);
    canvas.remove();labels.remove();controls.remove();hint.remove();status.remove();normals=[];mapData=null;map=null;bitmap=null;pixels=null;
    if(oldStyle===null)container.removeAttribute('style');else container.setAttribute('style',oldStyle);
  }};
}
