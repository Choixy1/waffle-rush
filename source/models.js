/* 와플 대소동 공용 3D 모델: 캐릭터, 주방 기구, 재료 (2차: 매끈한 마감) */
(function(){
"use strict";
const T=THREE;
const PAL={
  navy:'#2456c4', navyD:'#173f95', navyL:'#4a7fe0', gold:'#f7b52c', goldD:'#dc931c',
  waffleEdge:'#d58a22', butter:'#fff1a6', face:'#13265c', blush:'#ff9d4a', tongue:'#ff7f45',
  wood:'#c98a4f', woodL:'#dba46a', woodD:'#a36a38', board:'#f2d3a0',
  counter:'#2f62c8', counterD:'#2753b0', steel:'#d3dae6', steelD:'#9aa6bb',
  red:'#ea4a4f', green:'#45b26b', greenD:'#2f8a50', cream:'#fffaf0',
};

/* 재질: 매끈한 스탠다드 (sRGB 색 보정) */
const lin=h=>new T.Color(h).convertSRGBToLinear();
const mc={};
// 반짝임을 줄이려고 모든 재질을 무광에 가깝게 맞춰요
const soft=p=>{ p.roughness=Math.max(.82,p.roughness==null?.82:p.roughness); p.metalness=(p.metalness||0)*.3; return p; };
function mat(c,o){ const k=c+JSON.stringify(o||{}); if(mc[k]) return mc[k]; const p=soft(Object.assign({roughness:.62,metalness:0},o||{})); p.color=lin(c); return mc[k]=new T.MeshStandardMaterial(p); }
function flat(c,o){ const k='f'+c+JSON.stringify(o||{}); if(mc[k]) return mc[k]; const p=Object.assign({},o||{}); p.color=lin(c); return mc[k]=new T.MeshBasicMaterial(p); }
function tmat(tex,o){ return new T.MeshStandardMaterial(soft(Object.assign({map:tex,roughness:.62,metalness:0},o||{}))); }
const gc={}; const G=(k,f)=>gc[k]||(gc[k]=f());
function mesh(geo,m,x=0,y=0,z=0,cast=true){ const o=new T.Mesh(geo,m); o.position.set(x,y,z); o.castShadow=cast; o.receiveShadow=true; return o; }
function rbox(w,h,d,r=.08,bev=.03){
  return G(`rb${w}_${h}_${d}_${r}_${bev}`,()=>{
    const s=new T.Shape(), x=-w/2+bev, y=-d/2+bev, W=w-2*bev, D=d-2*bev, rr=Math.max(.001,Math.min(r,W/2,D/2));
    s.moveTo(x+rr,y); s.lineTo(x+W-rr,y); s.absarc(x+W-rr,y+rr,rr,-Math.PI/2,0); s.lineTo(x+W,y+D-rr); s.absarc(x+W-rr,y+D-rr,rr,0,Math.PI/2);
    s.lineTo(x+rr,y+D); s.absarc(x+rr,y+D-rr,rr,Math.PI/2,Math.PI); s.lineTo(x,y+rr); s.absarc(x+rr,y+rr,rr,Math.PI,Math.PI*1.5);
    const g=new T.ExtrudeGeometry(s,{depth:Math.max(.001,h-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:1,curveSegments:3});
    g.rotateX(-Math.PI/2); g.translate(0,bev-h/2,0); g.computeVertexNormals(); return g;
  });
}
// 윗면 UV를 0..1로 맞춘 둥근 상자 (텍스처용)
function rboxUV(w,h,d,r,bev){
  return G(`rbuv${w}_${h}_${d}_${r}_${bev}`,()=>{ const g=rbox(w,h,d,r,bev).clone(); const uv=g.attributes.uv, p=g.attributes.position;
    for(let i=0;i<uv.count;i++){ uv.setXY(i,(p.getX(i)+w/2)/w,(-p.getZ(i)+d/2)/d); } uv.needsUpdate=true; return g; });
}
// 작은 물체는 면을 덜 나눠요 (느린 기기에서 그리는 양을 줄여요)
const segFor=(r,s)=>Math.min(s,r<.03?8:r<.08?12:r<.16?18:r<.3?24:s);
const cyl=(a,b,h,s=32)=>{ s=segFor(Math.max(a,b),s); return G(`c${a}_${b}_${h}_${s}`,()=>new T.CylinderGeometry(a,b,h,s)); };
const sph=(r,s=18)=>{ s=Math.min(s,r<.03?8:r<.08?10:14); return G(`s${r}_${s}`,()=>new T.SphereGeometry(r,s,Math.max(6,s*.7|0))); };
const circ=(r,s=32,a0=0,a1=Math.PI*2)=>G(`ci${r}_${s}_${a0}_${a1}`,()=>new T.CircleGeometry(r,s,a0,a1));
const tor=(R,r,rs=10,ts=40,arc=Math.PI*2)=>(rs=Math.min(rs,r<.012?5:r<.03?7:rs),ts=Math.min(ts,Math.max(12,Math.round(R*120))),G(`t${R}_${r}_${rs}_${ts}_${arc}`,()=>new T.TorusGeometry(R,r,rs,ts,arc)));
function capsule(r,len,s=24){ return G(`cap${r}_${len}`,()=>{ const pts=[]; for(let i=0;i<=8;i++){ const a=-Math.PI/2+i/8*Math.PI/2; pts.push(new T.Vector2(Math.max(.0001,Math.cos(a)*r),Math.sin(a)*r-len/2)); } for(let i=0;i<=8;i++){ const a=i/8*Math.PI/2; pts.push(new T.Vector2(Math.max(.0001,Math.cos(a)*r),Math.sin(a)*r+len/2)); } return new T.LatheGeometry(pts,s); }); }

/* 텍스처 */
function canvasTex(w,h,draw){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; draw(cv.getContext('2d'),w,h); const t=new T.CanvasTexture(cv); t.anisotropy=4; t.encoding=T.sRGBEncoding; return t; }
function rr(x,X,Y,W,H,R){ x.beginPath(); x.moveTo(X+R,Y); x.arcTo(X+W,Y,X+W,Y+H,R); x.arcTo(X+W,Y+H,X,Y+H,R); x.arcTo(X,Y+H,X,Y,R); x.arcTo(X,Y,X+W,Y,R); x.closePath(); }
function waffleFace(base,cell,deep,hi,n,pad){
  return canvasTex(512,512,(x,w)=>{
    x.fillStyle=base; x.fillRect(0,0,w,w);
    const g=w*.035, s=(w-2*pad-g*(n-1))/n;
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){ const X=pad+i*(s+g),Y=pad+j*(s+g);
      const gr=x.createLinearGradient(0,Y,0,Y+s); gr.addColorStop(0,deep); gr.addColorStop(.45,cell); gr.addColorStop(1,cell);
      x.fillStyle=gr; rr(x,X,Y,s,s,s*.24); x.fill();
      x.strokeStyle=hi; x.lineWidth=w*.008; rr(x,X+1,Y+1,s-2,s-2,s*.24); x.stroke(); }
    const v=x.createRadialGradient(w*.4,w*.35,w*.05,w*.5,w*.5,w*.7); v.addColorStop(0,'rgba(255,240,190,.25)'); v.addColorStop(1,'rgba(160,80,10,.12)'); x.fillStyle=v; x.fillRect(0,0,w,w);
  });
}
function gownTex(main,stripe){ return canvasTex(512,256,(x,w,h)=>{ x.fillStyle=main; x.fillRect(0,0,w,h);
    x.strokeStyle=stripe; x.lineWidth=5; for(let i=0;i<16;i++){ const X=(i+.5)/16*w; x.beginPath(); x.moveTo(X,h*.45); x.lineTo(X,h*.85); x.stroke(); }
    x.fillStyle=PAL.gold; x.beginPath(); x.moveTo(w*.5-w*.075,0); x.lineTo(w*.5,h*.48); x.lineTo(w*.5+w*.075,0); x.lineTo(w*.5+w*.045,0); x.lineTo(w*.5,h*.36); x.lineTo(w*.5-w*.045,0); x.closePath(); x.fill();
    x.fillStyle=PAL.goldD; x.fillRect(0,h*.86,w,h*.07); }); }
const TEX={
  head:waffleFace('#f7bf4c','#eaa232','#cf7f1c','rgba(255,225,150,.55)',5,52),
  waffle:waffleFace('#f5b543','#e29a2c','#c9791a','rgba(255,220,140,.5)',4,40),
  waffleWarn:waffleFace('#c98034','#a2601f','#7d4513','rgba(230,170,100,.35)',4,40),
  burnt:waffleFace('#3e271a','#2a1910','#160c06','rgba(110,80,60,.3)',4,40),
  wchoco:waffleFace('#7a4a2e','#5e3520','#40200e','rgba(210,160,120,.35)',4,40),
  mold:waffleFace('#3c3f4d','#2b2d38','#1c1d25','rgba(120,125,145,.4)',4,30),
  floor:canvasTex(512,512,(x,w)=>{ const h=w/2; x.fillStyle='#d4a76c'; x.fillRect(0,0,w,w); [['#f5dcae',0,0],['#e8bf84',h,0],['#e8bf84',0,h],['#f5dcae',h,h]].forEach(([c,X,Y])=>{ x.fillStyle=c; rr(x,X+5,Y+5,h-10,h-10,18); x.fill(); }); }),
  wood:canvasTex(512,512,(x,w)=>{ const n=4,ph=w/n; for(let i=0;i<n;i++){ x.fillStyle=['#d0925a','#c7884f','#d39a60','#c58650'][i]; x.fillRect(0,i*ph,w,ph); x.strokeStyle='rgba(140,85,40,.18)'; x.lineWidth=3; for(let k=0;k<3;k++){ x.beginPath(); const y=i*ph+ph*(.25+k*.25); x.moveTo(0,y); x.bezierCurveTo(w*.3,y-6,w*.6,y+6,w,y-2); x.stroke(); } x.fillStyle='rgba(110,60,25,.45)'; x.fillRect(0,i*ph,w,4); } }),
  gown:gownTex(PAL.navy,'rgba(15,40,110,.35)'),
  serve:canvasTex(256,256,(x,w)=>{ x.fillStyle='#f7b52c'; x.fillRect(0,0,w,w); for(let i=0;i<5;i++){ x.fillStyle='rgba(255,235,170,.9)'; rr(x,10+i*49,14,30,w-28,12); x.fill(); } }),
  awning:canvasTex(256,64,(x,w,h)=>{ for(let i=0;i<8;i++){ x.fillStyle=i%2?'#ffffff':PAL.navy; x.fillRect(i*w/8,0,w/8,h); } }),
  bin:canvasTex(256,128,(x,w,h)=>{ x.fillStyle=PAL.green; x.fillRect(0,0,w,h); x.fillStyle='rgba(20,90,45,.22)'; for(let i=0;i<12;i++) x.fillRect(i*w/12+8,h*.18,6,h*.64); }),
};
[TEX.floor,TEX.wood].forEach(t=>{ t.wrapS=t.wrapT=T.RepeatWrapping; });

/* SVG 아이콘 → 팻말 */
const ICON={
 waffle:'<rect x="3" y="3" width="18" height="18" rx="5" fill="#f2b33d" stroke="#a8661a" stroke-width="1.4"/><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" stroke="#c98a24" stroke-width="1.7"/>',
 batter:'<path d="M3.5 10h17l-2 8.5a3 3 0 0 1-3 2.3h-7a3 3 0 0 1-3-2.3z" fill="#5c8fe0" stroke="#2c56b8" stroke-width="1.3"/><ellipse cx="12" cy="10" rx="8.5" ry="2.4" fill="#ffe2a0" stroke="#2c56b8" stroke-width="1.3"/><path d="M15 9.5l4-7" stroke="#8a5a2a" stroke-width="1.8" stroke-linecap="round"/>',
 cream:'<ellipse cx="12" cy="18" rx="8" ry="3.4" fill="#fff" stroke="#c9bba3" stroke-width="1.2"/><ellipse cx="12" cy="13.6" rx="6" ry="3" fill="#fff" stroke="#c9bba3" stroke-width="1.2"/><path d="M12 4.5c2.6 1.8 4 3.7 3.4 5.6c-.5 1.2-1.9 1.5-3.4 1.5s-2.9-.3-3.4-1.5c-.6-1.9.8-3.8 3.4-5.6z" fill="#fff" stroke="#c9bba3" stroke-width="1.2"/>',
 syrup:'<rect x="5.5" y="7.5" width="13" height="13.5" rx="3.2" fill="#e8a033" stroke="#94560f" stroke-width="1.3"/><rect x="6.8" y="3.2" width="10.4" height="4.3" rx="1.5" fill="#86b7a6" stroke="#4f7d6c" stroke-width="1"/><circle cx="12" cy="14.6" r="3.1" fill="#d63a2f"/><path d="M12 11.6v-1.6" stroke="#3d8b3d" stroke-width="1.5" stroke-linecap="round"/>',
 choco:'<path d="M7 9.5c1.8 0 3.2 1.5 3.2 3.4c0 1.4-1.4 2.4-3.2 2.4s-3.2-1-3.2-2.4c0-1.9 1.4-3.4 3.2-3.4z" fill="#5a3320"/><path d="M16 4.5c1.8 0 3.2 1.5 3.2 3.4c0 1.4-1.4 2.4-3.2 2.4s-3.2-1-3.2-2.4c0-1.9 1.4-3.4 3.2-3.4z" fill="#6e4027"/><path d="M15 13.5c1.8 0 3.2 1.5 3.2 3.4c0 1.4-1.4 2.4-3.2 2.4s-3.2-1-3.2-2.4c0-1.9 1.4-3.4 3.2-3.4z" fill="#45261a"/>',
 strawberry:'<path d="M12 21.5C6.3 17.6 4.6 12.8 6 9.4c1.4-2.6 10.6-2.6 12 0c1.4 3.4-.3 8.2-6 12.1z" fill="#e5383b" stroke="#a51d22" stroke-width="1"/><path d="M6.8 8.6l2.6-3.2l2.6 2.1l2.6-2.1l2.6 3.2z" fill="#3fa34d"/><g fill="#ffe08a"><circle cx="9.5" cy="12" r=".75"/><circle cx="14.5" cy="12" r=".75"/><circle cx="12" cy="14.8" r=".75"/><circle cx="9.8" cy="17.2" r=".65"/><circle cx="14.2" cy="17.2" r=".65"/></g>',
 banana:'<path d="M4.5 6.5c1.6 8.6 9.6 13.3 16.5 10c-.9-1.3-2-1.8-3.2-1.7c-5.6.9-9.7-2.6-11.4-8.6z" fill="#ffd43b" stroke="#b88a00" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.1 6.8L4 4.5" stroke="#6b4b1a" stroke-width="2.2" stroke-linecap="round"/>',
 chocobar:'<rect x="2.5" y="6" width="19" height="12" rx="2.2" fill="#5a3320"/><path d="M8.5 6v12M14.5 6v12M2.5 12h12" stroke="#3a1f12" stroke-width="1.3"/><rect x="13.5" y="5" width="8.5" height="14" rx="1.6" fill="#d63a2f"/><rect x="13.5" y="10.4" width="8.5" height="3.2" fill="#f7b52c"/>',
 plate:'<circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#2c56b8" stroke-width="1.6"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#c9d6f0" stroke-width="1.4"/>',
 cheese:'<path d="M4 9l8-4l8 4v9l-8 4l-8-4z" fill="#ffd34d" stroke="#c99a12" stroke-width="1.2" stroke-linejoin="round"/><path d="M4 9l8 4l8-4M12 13v9" stroke="#c99a12" stroke-width="1.2" fill="none"/><circle cx="8" cy="14" r="1.2" fill="#f0b82a"/><circle cx="16.5" cy="15" r="1.4" fill="#f0b82a"/>',
 cwaffle:'<rect x="3" y="3" width="18" height="18" rx="5" fill="#7a4a2e" stroke="#3d2114" stroke-width="1.4"/><path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" stroke="#4a2818" stroke-width="1.7"/>',
 milk:'<path d="M6.5 8.5L9 4h6l2.5 4.5V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20z" fill="#fff" stroke="#2c56b8" stroke-width="1.3" stroke-linejoin="round"/><path d="M9 4l-2.5 4.5h11L15 4" fill="#5c8fe0" stroke="#2c56b8" stroke-width="1.3" stroke-linejoin="round"/><rect x="6.5" y="11.5" width="11" height="5" fill="#cfe0ff"/><path d="M9.5 14h5" stroke="#2c56b8" stroke-width="1.4" stroke-linecap="round"/>',
 cup:'<path d="M6 5h12l-1.6 15a1.6 1.6 0 0 1-1.6 1.4H9.2a1.6 1.6 0 0 1-1.6-1.4z" fill="#e8f4ff" stroke="#6b9fd8" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.2 8h7.6" stroke="#b9d6f2" stroke-width="1.2"/>',
 shake:'<path d="M14 2.5l-1.6 6" stroke="#e5484d" stroke-width="1.8" stroke-linecap="round"/><path d="M6 8h12l-1.6 12.4a1.6 1.6 0 0 1-1.6 1.4H9.2a1.6 1.6 0 0 1-1.6-1.4z" fill="#f6a7c0" stroke="#c4577a" stroke-width="1.3" stroke-linejoin="round"/><path d="M5.4 8.2c0-2.6 3-3.4 6.6-3.4s6.6.8 6.6 3.4z" fill="#fff" stroke="#c9bba3" stroke-width="1.1"/>',
 blender:'<path d="M7 3h10l-1.3 11H8.3z" fill="#d6ecff" stroke="#6b9fd8" stroke-width="1.3" stroke-linejoin="round"/><path d="M8.6 9h6.8l-.6 5H9.2z" fill="#f6a7c0"/><rect x="6" y="14" width="12" height="7" rx="2.2" fill="#38b2a0" stroke="#22806f" stroke-width="1.2"/><circle cx="12" cy="17.5" r="1.6" fill="#fff"/><rect x="6.5" y="1.8" width="11" height="2.2" rx="1" fill="#22806f"/>',
 trash:'<path d="M6 8h12l-1.2 12a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z" fill="#fff"/><rect x="4.5" y="5" width="15" height="2.6" rx="1.3" fill="#fff"/><rect x="10" y="3" width="4" height="2.4" rx="1" fill="#fff"/>',
};
const iconCache={};
function signTex(k,bg='#fffaf0',fg='#173f95'){
  const key=k+bg; if(iconCache[key]) return iconCache[key];
  const cv=document.createElement('canvas'); cv.width=cv.height=256; const x=cv.getContext('2d');
  x.fillStyle=fg; rr(x,6,6,244,244,56); x.fill(); x.fillStyle=bg; rr(x,18,18,220,220,46); x.fill();
  const t=new T.CanvasTexture(cv); t.encoding=T.sRGBEncoding; t.anisotropy=4; iconCache[key]=t;
  const img=new Image(); img.onload=()=>{ x.drawImage(img,40,40,176,176); t.needsUpdate=true; };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="176" height="176">${ICON[k]}</svg>`);
  return t;
}
const signM={};
function sign(k,size,bg,fg){ const key=k+'|'+bg+'|'+fg; const sm=signM[key]||(signM[key]=new T.MeshBasicMaterial({map:signTex(k,bg,fg),transparent:true})); return new T.Mesh(G('pl'+size,()=>new T.PlaneGeometry(size,size)),sm); }

/* =============== 캐릭터 =============== */
function makeChef(opt){
  opt=opt||{};
  const root=new T.Group(), body=new T.Group(); root.add(body); root.userData.dyn=true;
  const C=opt.colors||{main:PAL.navy,dark:PAL.navyD}; const navy=mat(C.main), navyD=mat(C.dark), gold=mat(PAL.gold,{roughness:.45}), skin=mat('#f6b740');
  const gownT=opt.colors?gownTex(C.main,C.stripe||'rgba(0,0,0,.2)'):TEX.gown;

  const feet=[-1,1].map(s=>{ const f=mesh(sph(.1),skin,s*.12,.05,.04); f.scale.set(1,.6,1.3); body.add(f); return f; });
  // 가운: 매끈한 종 모양 + 칠한 금색 칼라
  const prof=[[0,.09],[.3,.09],[.335,.11],[.345,.15],[.33,.24],[.3,.35],[.26,.45],[.21,.54],[.15,.6],[.07,.625],[0.0001,.63]].map(p=>new T.Vector2(p[0],p[1]));
  body.add(mesh(G('gown',()=>{ const g=new T.LatheGeometry(prof,32); g.rotateY(Math.PI); return g; }),tmat(gownT,{roughness:.7})));
  // 머리: 둥근 모서리 와플
  const head=new T.Group(); head.position.set(0,.86,0); body.add(head);
  const HR=.355, HD=.12, HB=.055;
  const headGeo=G('head',()=>{ const s=new T.Shape(); s.absarc(0,0,HR,0,Math.PI*2,false); const g=new T.ExtrudeGeometry(s,{depth:HD,bevelEnabled:true,bevelThickness:HB,bevelSize:HB,bevelSegments:4,curveSegments:30}); g.translate(0,0,-HD/2);
    const uv=g.attributes.uv,p=g.attributes.position,R=HR+HB; for(let i=0;i<uv.count;i++) uv.setXY(i,(p.getX(i)+R)/(2*R),(p.getY(i)+R)/(2*R)); uv.needsUpdate=true; g.computeVertexNormals(); return g; });
  head.add(mesh(headGeo,[tmat(TEX.head,{roughness:.55}),mat(PAL.waffleEdge,{roughness:.55})]));
  // 얼굴
  const face=new T.Group(); face.position.z=HD/2+HB+.002; head.add(face);
  const faceM=flat(PAL.face), white=flat('#ffffff');
  const eyes=[-1,1].map(s=>{ const g=new T.Group(); g.position.set(s*.13,.035,0); const e=new T.Mesh(circ(.058),faceM); e.scale.y=1.3; g.add(e);
    const h1=new T.Mesh(circ(.022,20),white); h1.position.set(-.016,.036,.001); g.add(h1); const h2=new T.Mesh(circ(.01,14),white); h2.position.set(.018,-.034,.001); g.add(h2); face.add(g); return g; });
  [-1,1].forEach(s=>{ const b=new T.Mesh(G('brow',()=>{ const sh=new T.Shape(); sh.absarc(0,0,.055,Math.PI*.22,Math.PI*.78,false); sh.absarc(0,0,.04,Math.PI*.78,Math.PI*.22,true); return new T.ShapeGeometry(sh,16); }),faceM); b.position.set(s*.13,.11,0); b.rotation.z=s<0?.12:-.12; face.add(b); });
  const mouth=new T.Group(); mouth.position.set(0,-.08,0); face.add(mouth);
  mouth.add(new T.Mesh(G('mouth',()=>{ const sh=new T.Shape(); sh.moveTo(-.085,0); sh.quadraticCurveTo(0,.012,.085,0); sh.absarc(0,0,.085,0,-Math.PI,true); return new T.ShapeGeometry(sh,24); }),faceM));
  const tongue=new T.Mesh(G('tongue',()=>{ const sh=new T.Shape(); sh.absellipse(0,-.05,.042,.026,0,Math.PI*2,false); return new T.ShapeGeometry(sh,20); }),flat(PAL.tongue)); tongue.position.z=.001; mouth.add(tongue);
  [-1,1].forEach(s=>{ const c=new T.Mesh(circ(.05),flat(PAL.blush,{transparent:true,opacity:.7})); c.position.set(s*.235,-.06,0); c.scale.y=.72; face.add(c); });
  // 버터
  const butter=new T.Group(); butter.position.set(-.235,.29,.03); butter.rotation.z=.62; head.add(butter);
  butter.add(mesh(rbox(.19,.075,.15,.05,.03),mat(PAL.butter,{roughness:.35})));
  butter.add(mesh(capsule(.022,.06),mat(PAL.butter,{roughness:.35}),.05,-.06,.06));
  // 학사모
  const cap=new T.Group(); cap.position.set(0,.35,0); head.add(cap);
  cap.add(mesh(cyl(.2,.23,.13,40),navy,0,0,0));
  cap.add(mesh(rbox(.64,.04,.64,.035,.015),navyD,0,.085,0));
  cap.add(mesh(cyl(.035,.035,.025,20),gold,0,.115,0));
  cap.add(mesh(rbox(.29,.014,.03,.01,.005),gold,.155,.112,0,false));
  const tassel=new T.Group(); tassel.position.set(.3,.11,0); cap.add(tassel);
  tassel.add(mesh(cyl(.013,.013,.16,10),gold,0,-.08,0,false));
  tassel.add(mesh(cyl(.022,.05,.11,16),gold,0,-.2,0));
  // 팔
  const arms=[-1,1].map(s=>{
    const a=new T.Group(); a.position.set(s*.235,.5,.0); body.add(a);
    a.add(mesh(capsule(.075,.12),navy,0,-.1,0));
    a.add(mesh(cyl(.083,.083,.04,24),gold,0,-.19,0,false));
    a.add(mesh(sph(.072),skin,0,-.25,0));
    a.userData.side=s; return a; });
  const holdSlot=new T.Group(); holdSlot.position.set(0,.5,.4); root.add(holdSlot);
  const blob=new T.Mesh(circ(.36),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.14,depthWrite:false})); blob.rotation.x=-Math.PI/2; blob.position.y=.004; root.add(blob);

  const st={anim:'idle',carry:false,t:0,phase:0,blinkT:2.5,blinking:0,cheerT:0};
  function setAnim(a){ if(a==='cheer'&&st.anim!=='cheer') st.cheerT=0; st.anim=a; }
  const lerp=(a,b,k)=>a+(b-a)*k;
  function update(dt){
    st.t+=dt; const t=st.t, a=st.anim, k=Math.min(1,dt*14);
    let by=0, rz=0, rx=0, sy=1, sxz=1, armX=[0,0], armZ=[.42,.42], spin=0;
    if(a==='idle'){ by=Math.sin(t*2.4)*.01; sy=1+Math.sin(t*2.4)*.015; armX=[Math.sin(t*2.4)*.05,-Math.sin(t*2.4)*.05]; }
    if(a==='walk'||a==='dash'){ st.phase+=dt*(a==='dash'?22:11); const p=st.phase; by=Math.abs(Math.sin(p))*.06; rz=Math.sin(p)*.08; armX=[Math.sin(p)*.6,-Math.sin(p)*.6];
      feet[0].position.z=.04+Math.sin(p)*.08; feet[1].position.z=.04-Math.sin(p)*.08; feet[0].position.y=.05+Math.max(0,Math.cos(p))*.04; feet[1].position.y=.05+Math.max(0,-Math.cos(p))*.04; }
    else feet.forEach(f=>{ f.position.z=lerp(f.position.z,.04,k); f.position.y=lerp(f.position.y,.05,k); });
    if(a==='dash'){ rx=.32; sy=.94; sxz=1.04; armX=[1,1]; armZ=[.8,.8]; }
    if(a==='chop'){ by=Math.abs(Math.sin(t*14))*.015; armX=[-1.2,-.95+Math.sin(t*18)*.6]; armZ=[.2,.18]; rx=.06; }
    if(a==='wash'){ armX=[-1.05+Math.sin(t*12)*.18,-1.05+Math.cos(t*12)*.18]; armZ=[.22+Math.cos(t*12)*.12,.22+Math.sin(t*12)*.12]; rz=Math.sin(t*6)*.04; }
    if(a==='cheer'){ st.cheerT+=dt; const c=st.cheerT; by=Math.abs(Math.sin(c*7))*.25; armZ=[2.4+Math.sin(c*14)*.18,2.4-Math.sin(c*14)*.18]; spin=c<.9?c/.9*Math.PI*2:0; sy=1+Math.sin(c*14)*.04; }
    if(st.carry&&a!=='chop'&&a!=='wash'&&a!=='cheer'){ armX=[-1.25,-1.25]; armZ=[.16,.16]; }
    body.position.y=a==='cheer'?by:lerp(body.position.y,by,k*1.5);
    body.rotation.z=lerp(body.rotation.z,rz,k); body.rotation.x=lerp(body.rotation.x,rx,k); body.rotation.y=spin;
    body.scale.set(lerp(body.scale.x,sxz,k),lerp(body.scale.y,sy,k),lerp(body.scale.z,sxz,k));
    arms.forEach((ar,i)=>{ ar.rotation.x=lerp(ar.rotation.x,armX[i],k); ar.rotation.z=lerp(ar.rotation.z,ar.userData.side*armZ[i],k); });
    st.blinkT-=dt; if(st.blinkT<=0){ st.blinking=.12; st.blinkT=2+Math.random()*2.5; }
    const ey=st.blinking>0?.12:1; if(st.blinking>0) st.blinking-=dt; eyes.forEach(e=>e.scale.y=ey);
    mouth.scale.set(a==='cheer'?1.1:1,a==='cheer'?1.3:a==='dash'?.75:1,1);
    tassel.rotation.z=Math.sin(t*3.2)*.12+(a==='walk'?Math.sin(st.phase)*.2:0);
    tassel.rotation.x=a==='dash'?-.7:a==='walk'?-.2:0;
    holdSlot.position.y=.48+body.position.y;
    blob.scale.setScalar(1-body.position.y*.8);
    if(opt.faceCam){ let ry=root.rotation.y; while(ry>Math.PI)ry-=Math.PI*2; while(ry<-Math.PI)ry+=Math.PI*2; head.rotation.y+=(-ry*opt.faceCam-head.rotation.y)*k; head.rotation.x=-(opt.tilt||0); }
  }
  function faceDir(fx,fz,dt){ const tg=Math.atan2(fx,fz); let d=tg-root.rotation.y; while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2; root.rotation.y+=d*Math.min(1,dt*16); }
  return {root,body,update,setAnim,faceDir,holdSlot,state:st};
}

/* =============== 재료 / 접시 =============== */
function strawShape(){ const s=new T.Shape(); s.moveTo(0,-.072); s.bezierCurveTo(.065,-.045,.08,.03,.048,.058); s.quadraticCurveTo(.024,.075,0,.064); s.quadraticCurveTo(-.024,.075,-.048,.058); s.bezierCurveTo(-.08,.03,-.065,-.045,0,-.072); return s; }
const strawSliceTex=canvasTex(256,256,(x,w)=>{ const k=w/.16, ox=w/2, oy=w*.47;
  const path=(sc)=>{ x.beginPath(); const P=(a,b)=>[ox+a*k*sc,oy-b*k*sc]; x.moveTo(...P(0,-.072)); x.bezierCurveTo(...P(.065,-.045),...P(.08,.03),...P(.048,.058)); x.quadraticCurveTo(...P(.024,.075),...P(0,.064)); x.quadraticCurveTo(...P(-.024,.075),...P(-.048,.058)); x.bezierCurveTo(...P(-.08,.03),...P(-.065,-.045),...P(0,-.072)); x.closePath(); };
  x.fillStyle='#d8262c'; x.fillRect(0,0,w,w);
  path(1); x.fillStyle='#e8343a'; x.fill();
  path(.8); x.fillStyle='#ff8f97'; x.fill();
  path(.58); x.fillStyle='#ffd3d6'; x.fill();
  x.fillStyle='#fff4f4'; x.beginPath(); x.ellipse(ox,oy-6,w*.045,w*.17,0,0,7); x.fill();
  x.strokeStyle='rgba(255,255,255,.7)'; x.lineWidth=3; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; x.beginPath(); x.moveTo(ox,oy-6); x.lineTo(ox+Math.cos(a)*w*.2,oy-6+Math.sin(a)*w*.26); x.stroke(); }
  x.fillStyle='#ffe08a'; for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; x.beginPath(); x.ellipse(ox+Math.cos(a)*w*.34*(.95),oy+Math.sin(a)*w*.36*(.95)-4,3,4.5,a,0,7); x.fill(); }
});
function strawSlice(){ return G('strawslice',()=>{ const g=new T.ExtrudeGeometry(strawShape(),{depth:.012,bevelEnabled:true,bevelThickness:.01,bevelSize:.006,bevelSegments:2,curveSegments:10});
  const uv=g.attributes.uv,p=g.attributes.position; for(let i=0;i<uv.count;i++) uv.setXY(i,(p.getX(i)+.08)/.16,(p.getY(i)+.0752)/.16); uv.needsUpdate=true; g.rotateX(-Math.PI/2); g.computeVertexNormals(); return g; }); }
const strawSliceMat=[tmat(strawSliceTex,{roughness:.4}),mat('#e8343a',{roughness:.4})];
const halfSph=r=>G('hs'+r,()=>new T.SphereGeometry(r,16,8,0,Math.PI*2,0,Math.PI/2));
const wMats={};
function waffleMesh(kind){
  kind=kind||'ok';
  if(!wMats[kind]){ const tex=kind==='burnt'?TEX.burnt:kind==='warn'?TEX.waffleWarn:kind==='choco'?TEX.wchoco:TEX.waffle; wMats[kind]=[tmat(tex,{roughness:.6}),mat(kind==='burnt'?'#2e1c12':kind==='warn'?'#9b5c20':kind==='choco'?'#5e3520':'#d98a22',{roughness:.6})]; }
  const g=new T.Group(); g.add(mesh(rboxUV(.5,.1,.5,.1,.035),wMats[kind],0,.05,0)); return g;
}
function addTopping(g,k,y){
  if(k==='cheese'){ const cg=G('cube',()=>rbox(.07,.07,.07,.015,.012)), cm=mat('#ffd34d',{roughness:.45}); [[-.12,.02,.3],[.13,-.02,-.2],[.02,-.15,.6],[-.05,.15,.1]].forEach(p=>{ const c=mesh(cg,cm,p[0],y+.035,p[1]); c.rotation.y=p[2]; g.add(c); }); }
  if(k==='cream'){ const w=mat('#ffffff',{roughness:.4}); g.add(mesh(sph(.11),w,0,y+.04,0)); g.add(mesh(sph(.08),w,0,y+.12,0)); g.add(mesh(G('crtip',()=>new T.ConeGeometry(.055,.09,12)),w,0,y+.2,0)); g.add(mesh(sph(.035),mat(PAL.red,{roughness:.3}),0,y+.26,0)); }
  if(k==='syrup'){ g.add(mesh(G('syr',()=>{ const s=new T.Shape(); const N=60; for(let i=0;i<=N;i++){ const a=i/N*Math.PI*2, r=.185+Math.sin(a*6)*.025; i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(Math.cos(a)*r,Math.sin(a)*r); } const ge=new T.ExtrudeGeometry(s,{depth:.006,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2}); ge.rotateX(-Math.PI/2); return ge; }),mat('#e2841c',{roughness:.15}),0,y+.006,0,false)); }
  if(k==='choco'){ const chip=G('chip2',()=>{ const c=new T.ConeGeometry(.03,.04,8); c.translate(0,.02,0); return c; }); [[-.15,-.06],[.1,-.16],[.17,.04],[-.08,.08],[.02,-.08],[-.17,-.17],[.08,.08],[-.02,.19]].forEach(p=>g.add(mesh(chip,mat('#3d2114',{roughness:.35}),p[0],y,p[1]))); }
  if(k==='strawberry'){ [[-.13,.12,.5],[.13,.12,-.5],[0,.155,0]].forEach(p=>{ const m=mesh(strawSlice(),strawSliceMat,p[0],y+.014,p[1]); m.rotation.y=p[2]+Math.PI; m.scale.setScalar(1.3); g.add(m); }); }
  if(k==='banana'){ [[-.14,-.13],[.14,-.13],[0,-.17]].forEach(p=>g.add(mesh(bananaSlice(),bananaSliceMat,p[0],y+.018,p[1]))); }
}
function plateMesh(n,dirty){
  const g=new T.Group();
  const pg=G('plate',()=>{ const pts=[[0.0001,0],[.22,0],[.25,.012],[.27,.03],[.33,.045],[.345,.052],[.34,.058],[.3,.05],[.25,.04],[0.0001,.038]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,32); });
  for(let i=0;i<n;i++){ const y=i*.05; g.add(mesh(pg,mat(dirty?'#d6d0c4':'#ffffff',{roughness:.3}),0,y,0));
    const ring=mesh(tor(.305,.008,6,48),mat(dirty?'#b7a88c':PAL.navyL,{roughness:.3}),0,y+.05,0,false); ring.rotation.x=Math.PI/2; g.add(ring); }
  if(dirty){ [[.1,.06,.045],[-.08,-.07,.035],[-.11,.09,.025]].forEach(p=>{ const d=new T.Mesh(circ(p[2],20),flat('#a88a5c',{transparent:true,opacity:.55})); d.scale.set(1.4,1,1); d.rotation.x=-Math.PI/2; d.position.set(p[0],(n-1)*.05+.041,p[1]); g.add(d); }); }
  return g;
}
/* ---- 쉐이크 유리컵 ---- */
const SHAKE_COL={milk:'#f7f2e6',strawberry:'#f5a3bb',banana:'#f4dc84',choco:'#9b6b4b','banana,choco':'#b98b5d','banana,strawberry':'#f6b9a0'};
function shakeColor(food){ const k=(food||[]).filter(f=>f!=='milk').sort().join(','); return SHAKE_COL[k||'milk']||'#f2d6c8'; }
const glassM=new T.MeshStandardMaterial({color:lin('#e6f3ff'),transparent:true,opacity:.42,roughness:.25,depthWrite:false});
const glassDirtyM=new T.MeshStandardMaterial({color:lin('#d8c9ab'),transparent:true,opacity:.62,roughness:.6,depthWrite:false});
const cupGeo=()=>G('cupg',()=>{ const pts=[[0.0001,0],[.085,0],[.09,.01],[.12,.3],[.112,.3],[.082,.018],[0.0001,.018]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,32); });
function cupMesh(n,dirty,food){
  const g=new T.Group(); n=Math.max(1,n||1);
  for(let i=0;i<n;i++){ const c=new T.Mesh(cupGeo(),dirty?glassDirtyM:glassM); c.position.y=i*.05; c.renderOrder=2; g.add(c); }
  if(dirty) g.add(mesh(cyl(.07,.07,.012,20),mat('#b59a72'),0,(n-1)*.05+.025,0,false));
  if(food&&food.length){ const top=(n-1)*.05; const col=shakeColor(food);
    g.add(mesh(G('cupfill',()=>new T.CylinderGeometry(.108,.082,.25,28)),mat(col),0,top+.14,0,false));
    const cr=mat('#ffffff'); g.add(mesh(sph(.075,16),cr,0,top+.285,0,false)); g.add(mesh(sph(.05,14),cr,.03,top+.32,.02,false));
    const st=mesh(cyl(.012,.012,.3,10),mat('#e5484d'),.04,top+.38,-.02,false); st.rotation.z=-.3; g.add(st);
    if(food.includes('strawberry')){ const s=mesh(strawSlice(),strawSliceMat,-.05,top+.33,.03,false); s.rotation.x=-1.1; s.scale.setScalar(1.2); g.add(s); }
    if(food.includes('banana')){ const b=mesh(bananaSlice(),bananaSliceMat,.05,top+.33,.05,false); b.rotation.x=-.9; g.add(b); }
    if(food.includes('choco')){ const chip=G('chip2',()=>{ const c=new T.ConeGeometry(.03,.04,8); c.translate(0,.02,0); return c; }); [[-.02,.0],[.03,.04],[0,-.04]].forEach(p=>g.add(mesh(chip,mat('#3d2114'),p[0],top+.345,p[1],false))); }
  }
  return g;
}
function milkMesh(){
  const g=new T.Group(); g.add(mesh(rbox(.18,.26,.18,.02,.01),mat('#ffffff'),0,.13,0));
  g.add(mesh(rbox(.184,.06,.184,.015,.008),mat('#5c8fe0'),0,.07,0,false));
  const roof=mesh(G('milkroof',()=>{ const s=new T.Shape(); s.moveTo(-.09,0); s.lineTo(0,.08); s.lineTo(.09,0); s.lineTo(-.09,0); const e=new T.ExtrudeGeometry(s,{depth:.18,bevelEnabled:false}); e.translate(0,0,-.09); return e; }),mat('#5c8fe0'),0,.26,0); g.add(roof);
  g.add(mesh(rbox(.02,.05,.17,.006,.004),mat('#4a7bd0'),0,.355,0,false));
  return g;
}
/* ---- 딸기 (통) ---- */
const STRAW_PROF=[[0.0001,-.15],[.028,-.146],[.055,-.13],[.083,-.1],[.108,-.062],[.128,-.02],[.142,.022],[.147,.055],[.141,.082],[.125,.103],[.098,.118],[.062,.127],[.028,.13],[0.0001,.13]];
function strawBodyGeo(){ return G('straw2',()=>{ const g=new T.LatheGeometry(STRAW_PROF.map(p=>new T.Vector2(p[0],p[1])),48); const p=g.attributes.position, cols=[];
  const top=lin('#ff8a86'), mid=lin('#ea3a40'), tip=lin('#c9222b'), c=new T.Color();
  for(let i=0;i<p.count;i++){ const y=p.getY(i); if(y>.09) c.copy(mid).lerp(top,Math.min(1,(y-.09)/.04)*.6); else if(y<-.06) c.copy(mid).lerp(tip,Math.min(1,(-.06-y)/.09)); else c.copy(mid); cols.push(c.r,c.g,c.b); }
  g.setAttribute('color',new T.Float32BufferAttribute(cols,3)); g.computeVertexNormals(); return g; }); }
function leafGeo(){ return G('sleaf',()=>{ const s=new T.Shape(); s.moveTo(0,0); s.quadraticCurveTo(.045,.06,.115,0); s.quadraticCurveTo(.045,-.06,0,0);
  const g=new T.ExtrudeGeometry(s,{depth:.004,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,curveSegments:6}); g.rotateX(-Math.PI/2); return g; }); }
function strawberryWhole(){
  const g=new T.Group(), body=new T.Group(); body.position.y=.15; g.add(body);
  body.add(mesh(strawBodyGeo(),mat('#ffffff',{vertexColors:true,roughness:.32})));
  const seedG=G('seed',()=>{ const s=new T.SphereGeometry(.009,5,4); s.scale(1,1.7,.6); return s; }), seedM=mat('#ffe27a',{roughness:.3});
  const rows=[[.06,-.1],[.1,-.055],[.13,-.01],[.145,.035],[.138,.075]];
  rows.forEach(([r0,y],ri)=>{ const n=Math.round(r0*90); for(let k=0;k<n;k++){ const a=(k+(ri%2)*.5)/n*Math.PI*2;
    // 가장 가까운 프로파일에서 반지름 찾기
    let r=r0; for(let j=1;j<STRAW_PROF.length;j++){ const A=STRAW_PROF[j-1],B=STRAW_PROF[j]; if(y>=A[1]&&y<=B[1]){ r=A[0]+(B[0]-A[0])*(y-A[1])/(B[1]-A[1]); break; } }
    const s=mesh(seedG,seedM,Math.sin(a)*(r-.002),y,Math.cos(a)*(r-.002),false); s.lookAt(new T.Vector3(Math.sin(a)*2,y+(.05-y)*.3,Math.cos(a)*2));  body.add(s); } });
  const cal=new T.Group(); cal.position.y=.14; body.add(cal);
  for(let i=0;i<7;i++){ const arm=new T.Group(); arm.rotation.y=i/7*Math.PI*2+.2; cal.add(arm); const lf=mesh(leafGeo(),mat(i%2?'#4caf50':'#5cbd5a',{roughness:.5}),.01,0,0); lf.rotation.z=-.18-(i%3)*.05; arm.add(lf); }
  cal.add(mesh(cyl(.025,.03,.02,16),mat('#3f9a45'),0,.008,0));
  const stem=mesh(G('sstem',()=>{ const c=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.005,.03,0),new T.Vector3(.02,.055,.004)]); return new T.TubeGeometry(c,8,.009,8,false); }),mat('#3f9a45'),0,.01,0); cal.add(stem);
  return g;
}
/* ---- 바나나 ---- */
function bananaGeo(){ return G('banana2',()=>{
  const N=40, RS=20, curvePts=[]; for(let i=0;i<=8;i++){ const a=-.95+i/8*1.9; curvePts.push(new T.Vector3(Math.sin(a)*.22,.05*(a/.95)*(a/.95),Math.cos(a)*.22-.22)); }
  const curve=new T.CatmullRomCurve3(curvePts); const fr=curve.computeFrenetFrames(N,false);
  const pos=[],col=[],idx=[]; const green=lin('#b9cf45'), yel=lin('#ffd43b'), deep=lin('#f2bb22'), brown=lin('#6b4b1a'), c=new T.Color();
  const rad=t=>{ if(t<.1) return .02+(.028)*(t/.1); if(t>.93) return .048*Math.max(.25,(1-t)/.07); return .048+.012*Math.sin(Math.PI*(t-.1)/.83); };
  for(let i=0;i<=N;i++){ const t=i/N, P=curve.getPointAt(t), Nn=fr.normals[i], Bn=fr.binormals[i], r=rad(t);
    if(t<.18) c.copy(green).lerp(yel,t/.18); else if(t>.94) c.copy(yel).lerp(brown,(t-.94)/.06); else c.copy(yel);
    for(let j=0;j<=RS;j++){ const th=j/RS*Math.PI*2; const rr=r*(1-.07*Math.cos(5*th)); const cx=Math.cos(th)*rr, cy=Math.sin(th)*rr;
      pos.push(P.x+Nn.x*cx+Bn.x*cy, P.y+Nn.y*cx+Bn.y*cy, P.z+Nn.z*cx+Bn.z*cy);
      const ridge=1-.08*(.5+.5*Math.cos(5*th)); const cc=c.clone().lerp(deep,.25*(1-ridge)/.08); col.push(cc.r,cc.g,cc.b); } }
  for(let i=0;i<N;i++) for(let j=0;j<RS;j++){ const a=i*(RS+1)+j,b=a+RS+1; idx.push(a,a+1,b,b,a+1,b+1); }
  [0,N].forEach((i,e)=>{ const P=curve.getPointAt(i/N); const ci=pos.length/3; pos.push(P.x,P.y,P.z); const cc=e?brown:green; col.push(cc.r,cc.g,cc.b);
    for(let j=0;j<RS;j++){ const a=i*(RS+1)+j; e?idx.push(ci,a+1,a):idx.push(ci,a,a+1); } });
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(pos,3)); g.setAttribute('color',new T.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
  g.userData.start=curve.getPointAt(0); g.userData.tan=curve.getTangentAt(0); return g; }); }
function bananaOne(){
  const g=new T.Group(); const geo=bananaGeo();
  const b=mesh(geo,mat('#ffffff',{vertexColors:true,roughness:.45})); g.add(b);
  const s=geo.userData.start, tn=geo.userData.tan;
  const stem=mesh(cyl(.014,.02,.07,10),mat('#7a8a2a',{roughness:.6})); stem.position.copy(s).addScaledVector(tn,-.03); stem.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),tn.clone().negate()); g.add(stem);
  const cap=mesh(cyl(.016,.016,.012,10),mat('#5a4a1e')); cap.position.copy(s).addScaledVector(tn,-.066); cap.quaternion.copy(stem.quaternion); g.add(cap);
  return g;
}
function bananaBunch(){
  const g=new T.Group(); const s=bananaGeo().userData.start;
  [-.42,0,.42].forEach((a,i)=>{ const one=bananaOne(); one.position.set(-s.x,-s.y+i%2*.03,-s.z); const pv=new T.Group(); pv.add(one); pv.rotation.y=a; pv.rotation.z=(i-1)*.08; g.add(pv); });
  return g;
}
const bananaSliceTex=canvasTex(128,128,(x,w)=>{ x.fillStyle='#fdf0c2'; x.fillRect(0,0,w,w); const g2=x.createRadialGradient(w/2,w/2,4,w/2,w/2,w/2); g2.addColorStop(0,'#f6e39a'); g2.addColorStop(.5,'#fdf0c2'); g2.addColorStop(.92,'#fff6d8'); g2.addColorStop(1,'#f0d27a'); x.fillStyle=g2; x.fillRect(0,0,w,w);
  x.fillStyle='#b38a4a'; for(let i=0;i<3;i++){ const a=i/3*Math.PI*2-Math.PI/2; x.beginPath(); x.ellipse(w/2+Math.cos(a)*9,w/2+Math.sin(a)*9,3,5,a,0,7); x.fill(); } });
const bananaSliceMat=[mat('#f3d77d',{roughness:.5}),tmat(bananaSliceTex,{roughness:.5}),tmat(bananaSliceTex,{roughness:.5})];
function bananaSlice(){ return G('bslice',()=>new T.CylinderGeometry(.06,.06,.035,32)); }

const chocoTex=canvasTex(256,128,(x,w,h)=>{ x.fillStyle='#4a2818'; x.fillRect(0,0,w,h); for(let i=0;i<4;i++)for(let j=0;j<2;j++){ const X=6+i*62,Y=6+j*60; const gr=x.createLinearGradient(X,Y,X+50,Y+50); gr.addColorStop(0,'#7a4a2e'); gr.addColorStop(1,'#5a3320'); x.fillStyle=gr; rr(x,X,Y,52,50,8); x.fill(); } });
function chocoBar(){ const g=new T.Group();
  g.add(mesh(rboxUV(.36,.05,.2,.025,.012),[tmat(chocoTex,{roughness:.35}),mat('#4a2818',{roughness:.4})],0,.025,0));
  g.add(mesh(rbox(.17,.064,.212,.02,.01),mat('#d63a2f',{roughness:.45}),.1,.032,0));
  g.add(mesh(rbox(.05,.066,.214,.01,.005),mat(PAL.gold,{roughness:.35,metalness:.2}),.1,.032,0,false));
  return g; }
function itemMesh(it){
  const g=new T.Group(); if(!it) return g;
  switch(it.k){
    case 'batter':{
      const bowl=G('bowl',()=>{ const pts=[[0.0001,0],[.12,0],[.15,.01],[.2,.07],[.225,.15],[.23,.17],[.215,.17],[.2,.12],[0.0001,.12]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,28); });
      g.add(mesh(bowl,mat('#5c8fe0',{roughness:.35})));
      g.add(mesh(cyl(.205,.205,.012,40),mat(it.choco?'#6e4027':'#ffe3a6',{roughness:.3}),0,.15,0,false));
      const wh=new T.Group(); wh.position.set(.06,.16,0); wh.rotation.z=-.45; g.add(wh);
      wh.add(mesh(cyl(.014,.014,.2,10),mat('#9a6a3a'),0,.13,0));
      for(let i=0;i<3;i++){ const l=mesh(tor(.035,.006,6,20),mat(PAL.steel,{metalness:.5,roughness:.3}),0,.01,0); l.rotation.y=i*Math.PI/3; l.scale.y=1.5; wh.add(l); }
    } break;
    case 'cheese': {
      g.add(mesh(cyl(.2,.16,.05,40),mat('#ffffff',{roughness:.3}),0,.025,0)); g.add(mesh(G('cring',()=>new T.TorusGeometry(.185,.01,6,40)),mat(PAL.navyL),0,.05,0,false)).children;
      const cg=G('cube2',()=>rbox(.08,.08,.08,.018,.014)), cm=mat('#ffd34d',{roughness:.45});
      [[-.07,.09,-.05,.2],[.07,.09,-.04,-.3],[0,.09,.08,.5],[-.06,.09,.09,.9],[.08,.09,.08,0],[0,.17,.01,.4]].forEach(p=>{ const c=mesh(cg,cm,p[0],p[1]-.04+.01,p[2]); c.rotation.y=p[3]; g.add(c); });
    } break;
    case 'waffle': g.add(waffleMesh(it.burnt?'burnt':it.choco?'choco':'ok')); ['syrup','choco','strawberry','banana','cheese','cream'].forEach(k=>{ if((it.top||[]).includes(k)) addTopping(g,k,.1); }); break;
    case 'cream': g.add(mesh(cyl(.13,.11,.15,40),mat('#ffffff',{roughness:.35}),0,.075,0)); g.add(mesh(cyl(.132,.124,.05,40),mat(PAL.navyL),0,.05,0)); addTopping(g,'cream',.13); break;
    case 'syrup':
      g.add(mesh(rbox(.24,.26,.24,.1,.04),mat('#e99a2e',{roughness:.2}),0,.13,0));
      g.add(mesh(cyl(.09,.09,.06,32),mat('#7fb3a1'),0,.29,0));
      { const lb=sign('syrup',.15,'#fff6dd','#c0731a'); lb.position.set(0,.13,.122); g.add(lb); }
      break;
    case 'choco': {
      if(!it.cut){ const bars=it.pile?[[-.04,-.08,.15],[.03,.1,-.2]]:[[0,0,.1]]; bars.forEach(p=>{ const b=chocoBar(); b.position.set(p[0],0,p[1]); b.rotation.y=p[2]; g.add(b); }); }
      else { const mound=mesh(G('mound2',()=>new T.SphereGeometry(.17,20,8,0,Math.PI*2,0,Math.PI/2)),mat('#5a3320',{roughness:.5}),0,0,0); mound.scale.y=.4; g.add(mound);
        const chip=G('chip2',()=>{ const c=new T.ConeGeometry(.03,.04,8); c.translate(0,.02,0); return c; }), cm=mat('#3d2114',{roughness:.35});
        for(let i=0;i<14;i++){ const a=i*2.39, r=.03+((i*37)%10)/10*.12; const yy=Math.sqrt(Math.max(0,1-(r/.17)**2))*.17*.4-.012; const c=mesh(chip,cm,Math.cos(a)*r,yy,Math.sin(a)*r); c.rotation.set(((i*13)%7-3)*.05,a,((i*17)%7-3)*.05); g.add(c); } }
    } break;
    case 'strawberry':
      if(!it.cut){ if(it.pile){ [[-.1,.04,.3],[.1,.02,-.4],[0,-.1,1.2]].forEach(p=>{ const b=strawberryWhole(); b.position.set(p[0],0,p[1]); b.rotation.y=p[2]; b.scale.setScalar(.82); g.add(b); }); } else g.add(strawberryWhole()); }
      else { [[-.13,.03,.35],[.1,-.08,-.3],[.1,.12,.9]].forEach(p=>{ const m=mesh(strawSlice(),strawSliceMat,p[0],.016,p[1]); m.rotation.y=p[2]; m.scale.setScalar(1.6); g.add(m); }); }
      break;
    case 'banana':
      if(!it.cut){ if(it.pile){ const bb=bananaBunch(); bb.position.set(-.06,0,-.04); g.add(bb); } else { const b1=bananaOne(); b1.position.z=.08; g.add(b1); } }
      else { [[-.1,0],[.04,.05],[.12,-.06],[-.02,-.1]].forEach(p=>g.add(mesh(bananaSlice(),bananaSliceMat,p[0],.018,p[1]))); }
      break;
    case 'milk': if(it.pile){ [[-.1,-.05],[.1,.06]].forEach(p=>{ const c=milkMesh(); c.position.set(p[0],0,p[1]); c.rotation.y=p[0]*3; g.add(c); }); } else g.add(milkMesh()); break;
    case 'cup': g.add(cupMesh(it.n||1,it.dirty,it.food)); break;
    case 'plate': {
      g.add(plateMesh(it.n||1,it.dirty)); let y=((it.n||1)-1)*.05+.04; const f=it.food||[];
      if(f.includes('waffle')||f.includes('cwaffle')){ const w=waffleMesh(f.includes('cwaffle')?'choco':'ok'); w.position.y=y; g.add(w); y+=.1; }
      ['syrup','choco','strawberry','banana','cheese','cream'].forEach(k=>{ if(f.includes(k)) addTopping(g,k,y); });
    } break;
  }
  return g;
}

/* =============== 주방 기구 =============== */
const TOP_Y=.9;
function counterBase(g,topMat){
  g.add(mesh(rbox(.94,.82,.94,.06,.025),mat(PAL.counter),0,.41,0));
  g.add(mesh(rbox(.74,.5,.02,.05,.008),mat(PAL.counterD),0,.42,.465,false));
  g.add(mesh(rbox(.16,.035,.03,.017,.01),mat(PAL.gold,{roughness:.3,metalness:.3}),0,.6,.48,false));
  g.add(mesh(rbox(.94,.06,.94,.04,.02),mat(PAL.counterD),0,.03,0,false));
  g.add(mesh(rboxUV(1,.1,1,.05,.025),topMat||tmat(TEX.wood,{roughness:.55}),0,.85,0));
}
// 컨베이어 벨트: 고무 벨트 무늬가 흘러가요 (모든 벨트가 같은 텍스처를 써서 한 번에 움직여요)
const beltTex=canvasTex(128,256,(x,w,h)=>{ x.fillStyle='#3d4150'; x.fillRect(0,0,w,h);
  for(let i=0;i<4;i++){ const y=i*h/4; x.fillStyle='rgba(0,0,0,.18)'; x.fillRect(0,y,w,4);
    x.strokeStyle='#f2c45a'; x.lineWidth=9; x.lineCap='round'; x.lineJoin='round'; x.beginPath(); x.moveTo(w*.3,y+h/8+16); x.lineTo(w*.5,y+h/8-8); x.lineTo(w*.7,y+h/8+16); x.stroke(); } });
beltTex.wrapS=beltTex.wrapT=T.RepeatWrapping;
const beltMat=new T.MeshStandardMaterial({map:beltTex,roughness:.9});
/* 바닥 칸: 사람을 미는 바닥 벨트, 미끄러운 빙판, (가게 테마의) 구멍 */
const floorBeltTex=beltTex.clone(); floorBeltTex.needsUpdate=true; floorBeltTex.wrapS=floorBeltTex.wrapT=T.RepeatWrapping;
const floorBeltMat=new T.MeshStandardMaterial({map:floorBeltTex,roughness:.9});
const iceTex=canvasTex(128,128,(x,w,h)=>{ const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,'#e4f6ff'); g.addColorStop(1,'#b9e3fb'); x.fillStyle=g; x.fillRect(0,0,w,h);
  x.strokeStyle='rgba(255,255,255,.85)'; x.lineWidth=5; x.lineCap='round'; x.beginPath(); x.moveTo(22,40); x.lineTo(52,18); x.moveTo(30,56); x.lineTo(44,46); x.moveTo(78,104); x.lineTo(108,82); x.stroke();
  x.strokeStyle='rgba(120,180,220,.5)'; x.lineWidth=3; x.strokeRect(2,2,w-4,h-4); });
function makeFloorTile(kind,dir){
  const g=new T.Group();
  if(kind==='belt'){ const d=dir||[1,0], tr=new T.Group(); tr.rotation.y=Math.atan2(-d[0],-d[1]); g.add(tr);
    const pl=new T.Mesh(G('fbeltpl',()=>{ const p=new T.PlaneGeometry(.94,1); p.rotateX(-Math.PI/2); return p; }),floorBeltMat); pl.position.y=.006; pl.receiveShadow=true; tr.add(pl);
    [-1,1].forEach(sx=>tr.add(mesh(rbox(.05,.03,1,.012,.008),mat(PAL.gold),sx*.475,.016,0,false))); }
  else if(kind==='ice'){ const pl=new T.Mesh(G('icepl',()=>{ const p=new T.PlaneGeometry(1,1); p.rotateX(-Math.PI/2); return p; }),new T.MeshStandardMaterial({map:iceTex,roughness:.25,metalness:0})); pl.position.y=.005; pl.receiveShadow=true; g.add(pl); }
  else if(kind==='hole'){ const pl=new T.Mesh(G('holepl',()=>{ const p=new T.PlaneGeometry(1,1); p.rotateX(-Math.PI/2); return p; }),flat('#151a28')); pl.position.y=-.001; g.add(pl); }
  return g;
}
function makeStation(type,opt){
  opt=opt||{};
  const g=new T.Group(), holder=new T.Group(); holder.position.y=TOP_Y; g.add(holder); const parts={};
  switch(type){
    case 'counter': counterBase(g); break;
    case 'belt': {
      counterBase(g,mat('#4a4f60'));
      const d=opt.dir||[1,0], tr=new T.Group(); tr.rotation.y=Math.atan2(-d[0],-d[1]); tr.position.y=.9; g.add(tr);
      const pl=new T.Mesh(G('beltpl',()=>{ const p=new T.PlaneGeometry(.78,.98); p.rotateX(-Math.PI/2); return p; }),beltMat); pl.position.y=.006; pl.receiveShadow=true; tr.add(pl);
      [-1,1].forEach(sx=>tr.add(mesh(rbox(.07,.06,.98,.03,.012),mat(PAL.gold),sx*.43,.02,0)));
      holder.position.y=.92; break; }
    case 'crate': {
      g.add(mesh(rbox(.94,.8,.94,.06,.025),mat(PAL.woodL),0,.4,0));
      g.add(mesh(rbox(.74,.56,.02,.05,.008),mat(PAL.wood),0,.43,.465,false));
      g.add(mesh(rbox(.94,.06,.94,.04,.02),mat(PAL.woodD),0,.03,0,false));
      g.add(mesh(rboxUV(1,.1,1,.05,.025),mat(PAL.woodD),0,.85,0));
      g.add(mesh(rbox(.82,.01,.82,.04,.004),mat('#6e4220',{roughness:.9}),0,.902,0,false));
      const sg=sign(opt.give==='choco'?'chocobar':opt.give,.36); sg.position.set(0,.43,.477); g.add(sg);
      holder.add(itemMesh({k:opt.give,cut:false,pile:true})); holder.position.y=.905;
      break; }
    case 'machine': {
      counterBase(g);
      const iron=new T.Group(); iron.position.y=.9; g.add(iron);
      iron.add(mesh(rbox(.8,.13,.74,.14,.04),mat(PAL.gold,{roughness:.35}),0,.065,0));
      iron.add(mesh(rboxUV(.62,.02,.56,.1,.008),[tmat(TEX.mold,{roughness:.5}),mat('#2b2d38')],0,.125,0,false));
      const lamp=mesh(sph(.032),flat('#5a5f73'),.3,.07,.37,false); iron.add(lamp);
      const lidP=new T.Group(); lidP.position.set(0,.135,-.33); iron.add(lidP);
      const lid=new T.Group(); lidP.add(lid);
      lid.add(mesh(rbox(.8,.12,.72,.14,.05),mat(PAL.gold,{roughness:.35}),0,.06,.33));
      lid.add(mesh(cyl(.13,.13,.012,40),mat(PAL.goldD,{roughness:.35}),0,.123,.33,false));
      lid.add(mesh(cyl(.08,.08,.014,40),mat(PAL.gold,{roughness:.35}),0,.125,.33,false));
      lid.add(mesh(rbox(.26,.05,.07,.025,.02),mat('#3a3d4c',{roughness:.4}),0,.06,.71));
      { const hinge=mesh(cyl(.03,.03,.7,16),mat('#3a3d4c'),0,0,-.005); hinge.rotation.z=Math.PI/2; lid.add(hinge); }
      parts.lid=lidP; parts.lamp=lamp; holder.position.y=1.045; break; }
    case 'board':
      counterBase(g);
      g.add(mesh(rbox(.72,.045,.54,.1,.015),mat(PAL.board,{roughness:.6}),-.04,.922,0));
      { const hole=new T.Mesh(circ(.03,20),flat('#c9a46d')); hole.rotation.x=-Math.PI/2; hole.position.set(-.33,.946,-.19); g.add(hole); }
      g.add(mesh(rbox(.06,.012,.26,.03,.005),mat(PAL.steel,{metalness:.6,roughness:.25}),.4,.906,.1,false));
      g.add(mesh(rbox(.065,.04,.15,.03,.015),mat(PAL.navyD),.4,.92,-.12));
      holder.position.set(-.04,.945,0); break;
    case 'serve': {
      counterBase(g,tmat(TEX.serve,{roughness:.45}));
      if(opt.bell){ const b=new T.Group(); b.position.set(.3,.9,-.3); g.add(b); b.add(mesh(cyl(.13,.13,.025,32),mat(PAL.navyD),0,.012,0)); b.add(mesh(halfSph(.1),mat(PAL.gold,{metalness:.5,roughness:.25}),0,.025,0)); b.add(mesh(sph(.025),mat(PAL.goldD,{metalness:.5,roughness:.25}),0,.13,0)); }
      if(opt.awning){ const aw=mesh(G('awn',()=>{ const ge=new T.CylinderGeometry(.24,.24,1.04,32,1,true,0,Math.PI); ge.rotateZ(Math.PI/2); return ge; }),tmat(TEX.awning,{side:T.DoubleSide,roughness:.6}),0,1.72,0); aw.rotation.x=-.4; g.add(aw);
        [-1,1].forEach(s=>g.add(mesh(cyl(.035,.035,.85,16),mat(PAL.navyD),s*.46,1.32,-.38))); }
      holder.position.y=.905; break; }
    case 'return': {
      counterBase(g,mat('#e2e8f2',{roughness:.4}));
      const sg=sign('plate',.32); sg.position.set(0,.42,.477); g.add(sg); break; }
    case 'sink':
      counterBase(g,mat(PAL.steel,{metalness:.35,roughness:.35}));
      g.add(mesh(rbox(.7,.01,.64,.12,.004),mat(PAL.steelD,{metalness:.35,roughness:.35}),0,.902,0,false));
      g.add(mesh(rbox(.64,.01,.58,.1,.004),mat('#7fcaf2',{roughness:.1,transparent:true,opacity:.92}),0,.906,0,false));
      [[.18,.12,.05],[-.2,-.06,.04],[.06,-.18,.035],[-.06,.17,.03],[.22,-.12,.025]].forEach(p=>g.add(mesh(sph(p[2]),mat('#ffffff',{roughness:.2,transparent:true,opacity:.9}),p[0],.91,p[1],false)));
      g.add(mesh(cyl(.035,.04,.22,20),mat(PAL.steelD,{metalness:.6,roughness:.25}),0,1.0,-.4));
      { const sp=mesh(tor(.08,.025,12,24,Math.PI),mat(PAL.steelD,{metalness:.6,roughness:.25}),0,1.11,-.32); sp.rotation.y=Math.PI/2; g.add(sp); }
      holder.position.y=.9; break;
    case 'rack':
      counterBase(g);
      g.add(mesh(rbox(.76,.03,.6,.05,.01),mat(PAL.steelD,{metalness:.4,roughness:.3}),0,.915,0,false));
      for(let i=0;i<6;i++){ [-.26,.26].forEach(z=>g.add(mesh(cyl(.012,.012,.18,10),mat(PAL.steel,{metalness:.5,roughness:.3}),-.3+i*.12,1.0,z))); }
      holder.position.y=.93; break;
    case 'mixer': {
      counterBase(g);
      const pink=mat('#e866b0',{roughness:.35}), pinkD=mat('#c94a95',{roughness:.35}), steel=mat(PAL.steel,{metalness:.6,roughness:.22});
      const mx=new T.Group(); mx.position.set(0,.9,-.04); g.add(mx);
      mx.add(mesh(rbox(.5,.08,.66,.14,.035),pink,0,.04,0));
      mx.add(mesh(rbox(.22,.56,.22,.09,.05),pink,0,.34,-.22));
      const head=new T.Group(); head.position.set(0,.62,-.22); mx.add(head);
      head.add(mesh(rbox(.3,.24,.64,.12,.09),pink,0,.04,.2));
      head.add(mesh(rbox(.312,.06,.05,.03,.02),steel,0,.04,.06,false));
      head.add(mesh(cyl(.05,.06,.04,24),pinkD,0,.04,.53).rotateX(Math.PI/2));
      const knob=mesh(sph(.035,16),steel,.16,.06,-.02); head.add(knob);
      const beater=new T.Group(); beater.position.set(0,-.08,.42); head.add(beater);
      beater.add(mesh(cyl(.012,.012,.16,10),steel,0,-.08,0));
      for(let i=0;i<3;i++){ const l=mesh(tor(.045,.007,6,20),steel,0,-.2,0); l.rotation.y=i*Math.PI/3; l.scale.y=1.6; beater.add(l); }
      const bowl=G('mbowl',()=>{ const pts=[[0.0001,0],[.09,0],[.12,.015],[.165,.08],[.18,.17],[.185,.2],[.172,.2],[.16,.14],[0.0001,.14]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,28); });
      mx.add(mesh(bowl,steel,0,.08,.2));
      const fill=new T.Group(); fill.position.set(0,.08+.15,.2); mx.add(fill);
      parts.beater=beater; parts.head=head; parts.mixer=mx; parts.fill=fill; break; }
    case 'cuprack':
      counterBase(g);
      g.add(mesh(rbox(.7,.03,.7,.08,.01),mat('#cfe3f7'),0,.915,0,false));
      [-.24,0,.24].forEach(x=>g.add(mesh(rbox(.04,.02,.62,.01,.006),mat('#9fbfe0'),x,.935,0,false)));
      holder.position.y=.94; break;
    case 'blender': {
      counterBase(g);
      const bl=new T.Group(); bl.position.set(0,.9,0); g.add(bl);
      const mint=mat('#38b2a0'), mintD=mat('#22806f');
      bl.add(mesh(rbox(.42,.2,.42,.1,.04),mint,0,.1,0));
      bl.add(mesh(cyl(.05,.05,.02,20),mat('#ffffff'),0,.12,.215).rotateX(Math.PI/2));
      bl.add(mesh(cyl(.15,.16,.04,32),mintD,0,.22,0));
      const jar=new T.Group(); jar.position.y=.24; bl.add(jar);
      const jg=G('jar',()=>{ const pts=[[0.0001,0],[.12,0],[.125,.01],[.16,.42],[.15,.42],[.115,.015],[0.0001,.015]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,32); });
      const jm=new T.Mesh(jg,glassM); jm.renderOrder=2; jar.add(jm);
      jar.add(mesh(cyl(.165,.165,.04,32),mintD,0,.44,0)); jar.add(mesh(rbox(.06,.05,.06,.02,.01),mintD,0,.48,0));
      const handle=mesh(rbox(.04,.26,.05,.02,.01),mintD,.185,.24,0); jar.add(handle);
      const fill=new T.Group(); jar.add(fill);
      parts.jar=jar; parts.fill=fill; parts.blender=bl; break; }
    case 'trash':
      g.add(mesh(cyl(.36,.3,.8,48),tmat(TEX.bin,{roughness:.5}),0,.4,0));
      g.add(mesh(cyl(.385,.385,.08,48),mat(PAL.greenD,{roughness:.45}),0,.8,0));
      { const hole=new T.Mesh(circ(.31,40),flat('#1d2b22')); hole.rotation.x=-Math.PI/2; hole.position.y=.842; g.add(hole); }
      { const sg=sign('trash',.24,PAL.greenD,'#ffffff'); sg.position.set(0,.42,.338); sg.rotation.x=-.075; g.add(sg); }
      holder.position.y=.86; break;
  }
  if(type!=='crate') holder.userData.dyn=true; Object.values(parts).forEach(p=>{ if(p&&p.userData) p.userData.dyn=true; });
  return {g,holder,parts};
}
function setMixer(st,contents,done,mixing,dt,t){
  const sig=contents.join(',')+(done?'|done':'');
  if(st._msig!==sig){ st._msig=sig; const f=st.parts.fill; f.clear();
    if(done) { f.add(mesh(cyl(.165,.165,.02,40),mat('#6e4027',{roughness:.25}),0,0,0,false)); f.add(mesh(sph(.06,20),mat('#7a4a2e',{roughness:.25}),0,0,0,false)).children; }
    else { if(contents.includes('batter')) f.add(mesh(cyl(.155,.155,.02,40),mat('#ffe3a6',{roughness:.3}),0,-.01,0,false));
      if(contents.includes('choco')){ const chip=G('chip2',()=>{ const c=new T.ConeGeometry(.03,.04,8); c.translate(0,.02,0); return c; }); for(let i=0;i<8;i++){ const a=i*2.39,r=.03+(i%4)*.03; f.add(mesh(chip,mat('#3d2114',{roughness:.35}),Math.cos(a)*r,-.005,Math.sin(a)*r,false)); } } } }
  if(mixing){ st.parts.beater.rotation.y+=dt*24; st.parts.mixer.rotation.z=Math.sin(t*40)*.012; st.parts.head.rotation.x=0; }
  else { st.parts.mixer.rotation.z=0; st.parts.head.rotation.x+=((contents.length?0:-.45)-st.parts.head.rotation.x)*.15; }
}
function setBlender(st,contents,done,blending,dt,t){
  const sig=contents.join(',')+(done?'|done':'');
  if(st._bsig!==sig){ st._bsig=sig; const f=st.parts.fill; f.clear();
    if(done){ const h=.32; f.add(mesh(G('bfill',()=>new T.CylinderGeometry(.148,.118,1,28)),mat(shakeColor(contents)),0,.02+h/2,0,false)).children; f.children[0].scale.y=h; }
    else { let y=.02;
      if(contents.includes('milk')){ const c=mesh(G('bfill',()=>new T.CylinderGeometry(.148,.118,1,28)),mat('#f7f2e6'),0,y+.09,0,false); c.scale.y=.18; c.scale.x=c.scale.z=.9; f.add(c); y+=.18; }
      if(contents.includes('strawberry')) [[-.04,.02],[.05,-.03]].forEach(p=>{ const s=mesh(strawSlice(),strawSliceMat,p[0],y+.01,p[1],false); s.scale.setScalar(1.3); f.add(s); });
      if(contents.includes('banana')) [[.03,.04],[-.05,-.02]].forEach(p=>f.add(mesh(bananaSlice(),bananaSliceMat,p[0],y+.02,p[1],false)));
      if(contents.includes('choco')){ const chip=G('chip2',()=>{ const c=new T.ConeGeometry(.03,.04,8); c.translate(0,.02,0); return c; }); [[0,0],[.05,.04],[-.04,.05],[.02,-.05]].forEach(p=>f.add(mesh(chip,mat('#3d2114'),p[0],y,p[1],false))); }
    } }
  if(blending){ st.parts.blender.rotation.z=Math.sin(t*46)*.014; st.parts.fill.rotation.y+=dt*18; } else { st.parts.blender.rotation.z=0; }
}
function setMachine(st,state,t){
  const target=state==='cooking'?0:-1.2; const lid=st.parts.lid;
  lid.rotation.x+=(target-lid.rotation.x)*.2; if(state==='cooking') lid.rotation.x=Math.sin(t*28)*.012;
  const col=state==='cooking'?'#ffb11f':state==='done'?'#3fd06e':state==='warn'?((t*6|0)%2?'#ff3b3b':'#ffc2c2'):state==='burnt'?'#2a2a30':'#6a7088';
  st.parts.lamp.material=flat(col);
}
function makeFloor(w,h){
  const tex=TEX.floor.clone(); tex.needsUpdate=true; tex.wrapS=tex.wrapT=T.RepeatWrapping; tex.repeat.set(w/2,h/2);
  const m=new T.Mesh(new T.PlaneGeometry(w,h).rotateX(-Math.PI/2),tmat(tex,{roughness:.8})); m.receiveShadow=true; return m;
}
/* 조명: 거의 위에서 비추는 부드러운 빛, 짧고 또렷한 그림자 */
function setupRenderer(r){ r.outputEncoding=T.sRGBEncoding; r.shadowMap.enabled=true; r.shadowMap.type=T.PCFShadowMap; }
function setupLights(scene,c,size,span){
  scene.add(new T.HemisphereLight(lin('#fff8ec'),lin('#c9ad86'),.9));
  const d=new T.DirectionalLight(lin('#fff6ea'),.6); d.position.set(c.x-2.2,c.y+11,c.z+4.5); d.target.position.copy(c); scene.add(d,d.target);
  d.castShadow=true; d.shadow.mapSize.set(size,size); Object.assign(d.shadow.camera,{left:-span,right:span,top:span,bottom:-span,near:2,far:30});
  d.shadow.bias=-.0004; d.shadow.normalBias=.02; d.shadow.radius=4; return d;
}

/* 움직이지 않는 물체를 재질별로 한 덩어리로 합쳐서 그리는 횟수를 줄여요 (userData.dyn 은 건너뜀) */
// 같은 모양의 재질이면 하나로 봐요
function mkey(o){ const a=o.material; return [a.type,a.color?a.color.getHexString():'',a.roughness,a.metalness,a.map?a.map.uuid:'',a.side,a.vertexColors?1:0,a.emissive?a.emissive.getHexString():'',a.opacity,a.polygonOffset?1:0,a.depthWrite?1:0,o.castShadow?1:0,o.receiveShadow?1:0].join('|'); }
function bake(root){
  root.updateMatrixWorld(true);
  const inv=new T.Matrix4().copy(root.matrixWorld).invert();
  const groups=new Map(), done=[];
  const ok=o=>o.isMesh&&!o.isSkinnedMesh&&!Array.isArray(o.material)&&o.children.length===0&&o.visible&&!o.material.transparent&&!o.userData.keep&&o.geometry&&o.geometry.attributes.position;
  (function walk(o){ if(o.userData.dyn||!o.visible) return;
    if(ok(o)){ const k=mkey(o); let gr=groups.get(k); if(!gr){ gr={mat:o.material,cast:o.castShadow,recv:o.receiveShadow,items:[]}; groups.set(k,gr); }
      gr.items.push({g:o.geometry,m:new T.Matrix4().multiplyMatrices(inv,o.matrixWorld)}); done.push(o); return; }
    o.children.slice().forEach(walk); })(root);
  const v=new T.Vector3(), nm=new T.Matrix3();
  let made=0;
  groups.forEach(gr=>{
    if(gr.items.length<2){ return; }
    const useUV=!!(gr.mat.map), useCol=!!gr.mat.vertexColors;
    let n=0; const geos=gr.items.map(it=>{ const g=it.g.index?it.g.toNonIndexed():it.g; n+=g.attributes.position.count; return g; });
    if(useCol&&geos.some(g=>!g.attributes.color)) return;
    const P=new Float32Array(n*3), N=new Float32Array(n*3), U=useUV?new Float32Array(n*2):null, C=useCol?new Float32Array(n*3):null;
    let o=0;
    gr.items.forEach((it,gi)=>{ const g=geos[gi], p=g.attributes.position, q=g.attributes.normal, uv=g.attributes.uv, col=g.attributes.color, c=p.count;
      nm.getNormalMatrix(it.m); const flip=it.m.determinant()<0;
      for(let i=0;i<c;i++){ const j=flip?(i-i%3)+(2-i%3):i; const d=o+i;
        v.fromBufferAttribute(p,j).applyMatrix4(it.m); P[d*3]=v.x; P[d*3+1]=v.y; P[d*3+2]=v.z;
        if(q){ v.fromBufferAttribute(q,j).applyMatrix3(nm).normalize(); N[d*3]=v.x; N[d*3+1]=v.y; N[d*3+2]=v.z; }
        if(U&&uv){ U[d*2]=uv.getX(j); U[d*2+1]=uv.getY(j); }
        if(C){ C[d*3]=col.getX(j); C[d*3+1]=col.getY(j); C[d*3+2]=col.getZ(j); } }
      o+=c; });
    const bg=new T.BufferGeometry(); bg.setAttribute('position',new T.BufferAttribute(P,3)); bg.setAttribute('normal',new T.BufferAttribute(N,3));
    if(U) bg.setAttribute('uv',new T.BufferAttribute(U,2)); if(C) bg.setAttribute('color',new T.BufferAttribute(C,3));
    bg.computeBoundingSphere(); bg.computeBoundingBox();
    const mm=new T.Mesh(bg,gr.mat); mm.castShadow=gr.cast; mm.receiveShadow=gr.recv; mm.matrixAutoUpdate=false; mm.userData.baked=true; root.add(mm); made++;
    gr.items.forEach(it=>it.done=true);
    gr.done=true;
  });
  let removed=0;
  done.forEach(o=>{ const k=mkey(o); const gr=groups.get(k); if(gr&&gr.done){ o.parent.remove(o); removed++; } });
  // 남은 고정 물체는 매 프레임 행렬 계산을 건너뛰어요
  (function walk(o){ if(o.userData.dyn) return; if(o!==root){ o.matrixAutoUpdate=false; } o.children.forEach(walk); })(root);
  return {made,removed};
}

/* 가볍게 모드: 무광 스탠다드 재질을 훨씬 가벼운 램버트 재질로 바꿔 끼워요 (되돌릴 수 있어요) */
const lowC=new WeakMap();
function lowOf(m){ if(!m||!m.isMeshStandardMaterial) return m; let l=lowC.get(m);
  if(!l){ l=new T.MeshLambertMaterial({color:m.color,map:m.map,emissive:m.emissive,emissiveMap:m.emissiveMap,emissiveIntensity:m.emissiveIntensity,transparent:m.transparent,opacity:m.opacity,side:m.side,vertexColors:m.vertexColors,depthWrite:m.depthWrite,depthTest:m.depthTest,alphaTest:m.alphaTest,polygonOffset:m.polygonOffset,polygonOffsetFactor:m.polygonOffsetFactor,polygonOffsetUnits:m.polygonOffsetUnits,visible:m.visible});
    l.userData.hi=m; lowC.set(m,l); }
  return l; }
const hiOf=m=>m&&m.userData&&m.userData.hi||m;
function setLowMat(root,on){ const f=on?lowOf:hiOf; root.traverse(o=>{ if(!o.isMesh||!o.material) return; o.material=Array.isArray(o.material)?o.material.map(f):f(o.material); }); }
window.WK={floorBeltTex,makeFloorTile,setLowMat,setBlender,cupMesh,beltTex,bake,T,PAL,lin,mat,toon:mat,flat,mesh,rbox,cyl,sph,circ,makeChef,makeStation,setMachine,setMixer,itemMesh,plateMesh,waffleMesh,makeFloor,setupRenderer,setupLights,ICON,TEX};
})();
