/* 와플 대소동 배경: 가게 홀, 손님, 창고, 바깥 거리 */
(function(){
"use strict";
const {T,PAL,lin,mat,flat,mesh,rbox,cyl,sph,circ,itemMesh,ICON,bake}=WK;
const G={}; const geo=(k,f)=>G[k]||(G[k]=f());
const TEXT_TEX=[];
function canvasTex(w,h,draw,text){ const cv=document.createElement('canvas'); cv.width=w; cv.height=h; draw(cv.getContext('2d'),w,h); const t=new T.CanvasTexture(cv); if(text) TEXT_TEX.push({cv,draw,t}); t.encoding=T.sRGBEncoding; t.anisotropy=8; return t; }
function rr(x,X,Y,W,H,R){ x.beginPath(); x.moveTo(X+R,Y); x.arcTo(X+W,Y,X+W,Y+H,R); x.arcTo(X+W,Y+H,X,Y+H,R); x.arcTo(X,Y+H,X,Y,R); x.arcTo(X,Y,X+W,Y,R); x.closePath(); }
function tmat(tex,o){ const p=Object.assign({map:tex,roughness:.85},o||{}); p.roughness=Math.max(.82,p.roughness); p.metalness=(p.metalness||0)*.3; return new T.MeshStandardMaterial(p); }
const FONT='900 1px "Nunito","Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif'.replace('900 1px ','');

/* ---------- 텍스처 ---------- */
const TX={
  plank:canvasTex(512,512,(x,w)=>{ const n=8,ph=w/n; for(let i=0;i<n;i++){ x.fillStyle=['#b97a45','#c3854f','#b07140','#bf8048'][i%4]; x.fillRect(0,i*ph,w,ph); x.fillStyle='rgba(90,50,20,.35)'; x.fillRect(0,i*ph,w,3); const off=(i*137)%w; x.fillRect(off,i*ph,3,ph); } }),
  sidewalk:canvasTex(256,256,(x,w)=>{ x.fillStyle='#c9c4bb'; x.fillRect(0,0,w,w); x.fillStyle='#d9d4cc'; for(let i=0;i<2;i++)for(let j=0;j<2;j++){ rr(x,i*w/2+4,j*w/2+4,w/2-8,w/2-8,10); x.fill(); } }),
  road:canvasTex(512,256,(x,w,h)=>{ x.fillStyle='#5b6170'; x.fillRect(0,0,w,h); x.fillStyle='#f4f1e6'; for(let i=0;i<4;i++) x.fillRect(i*w/4+20,h/2-5,w/8,10); }),
  menu:canvasTex(512,320,(x,w,h)=>{ x.fillStyle='#2f3a33'; rr(x,0,0,w,h,26); x.fill(); x.strokeStyle='#b98a52'; x.lineWidth=14; rr(x,7,7,w-14,h-14,22); x.stroke();
    x.fillStyle='#ffe9a8'; x.font=`900 44px ${FONT}`; x.textAlign='center'; x.fillText('오늘의 와플',w/2,70);
    x.font=`700 30px ${FONT}`; x.textAlign='left'; const items=[['생크림 와플','3,000'],['사과시럽 와플','3,000'],['딸기 와플','4,500'],['바나나 와플','4,500']];
    items.forEach((it,i)=>{ x.fillStyle='#ffffff'; x.fillText(it[0],48,125+i*46); x.textAlign='right'; x.fillStyle='#ffd36b'; x.fillText(it[1],w-48,125+i*46); x.textAlign='left'; }); },true),
  sign:canvasTex(1024,256,(x,w,h)=>{ x.fillStyle='#173f95'; rr(x,0,0,w,h,60); x.fill(); x.strokeStyle='#f7b52c'; x.lineWidth=16; rr(x,10,10,w-20,h-20,52); x.stroke();
    x.fillStyle='#ffffff'; x.font=`900 124px ${FONT}`; x.textAlign='center'; x.textBaseline='middle'; x.fillText('와플 대소동',w/2+60,h/2+8);
    x.fillStyle='#f4b23e'; rr(x,90,58,140,140,30); x.fill(); x.strokeStyle='#c9791a'; x.lineWidth=8; x.beginPath(); for(let i=1;i<3;i++){ x.moveTo(90+i*140/3,58); x.lineTo(90+i*140/3,198); x.moveTo(90,58+i*140/3); x.lineTo(230,58+i*140/3);} x.stroke(); },true),
  clock:canvasTex(128,128,(x,w)=>{ x.fillStyle='#fffaf0'; x.beginPath(); x.arc(64,64,58,0,7); x.fill(); x.lineWidth=8; x.strokeStyle='#173f95'; x.stroke(); x.fillStyle='#173f95'; for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; x.beginPath(); x.arc(64+Math.cos(a)*44,64+Math.sin(a)*44,3.5,0,7); x.fill(); } }),
};
TX.plank.wrapS=TX.plank.wrapT=T.RepeatWrapping; TX.sidewalk.wrapS=TX.sidewalk.wrapT=T.RepeatWrapping; TX.road.wrapS=T.RepeatWrapping;
function facadeTex(base,trim,awn){ return canvasTex(256,384,(x,w,h)=>{ x.fillStyle=base; x.fillRect(0,0,w,h); x.fillStyle=trim; x.fillRect(0,0,w,14);
  for(let r=0;r<2;r++) for(let c=0;c<2;c++){ x.fillStyle='#fff8e8'; rr(x,30+c*110,40+r*95,86,72,10); x.fill(); x.fillStyle='#9fd0f0'; rr(x,38+c*110,48+r*95,70,56,6); x.fill(); x.fillStyle='rgba(255,255,255,.5)'; x.fillRect(42+c*110,52+r*95,14,48); }
  x.fillStyle=awn; for(let i=0;i<8;i++){ x.fillStyle=i%2?'#ffffff':awn; x.fillRect(i*w/8,240,w/8,36); } x.fillStyle='#fff8e8'; rr(x,20,290,w-40,86,8); x.fill(); x.fillStyle='#8fc5e8'; rr(x,28,298,w-56,70,6); x.fill(); }); }

/* ---------- 손님 ---------- */
const SKINS=['#ffd9b8','#f3c49c','#e8b48a','#ffe2c6'];
const COLORS=['#ff8fa3','#7cc8a4','#ffb84d','#9b8cff','#5cc3f0','#ff7a59','#f3d34a','#6fd1c1'];
function bubbleTex(k){ let tex; tex=canvasTex(160,170,(x)=>{ x.fillStyle='#ffffff'; rr(x,8,8,144,124,34); x.fill(); x.beginPath(); x.moveTo(60,128); x.lineTo(80,160); x.lineTo(100,128); x.fill(); x.strokeStyle='#173f95'; x.lineWidth=6; rr(x,8,8,144,124,34); x.stroke();
  const img=new Image(); img.onload=()=>{ x.drawImage(img,34,22,92,92); tex.needsUpdate=true; }; img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="92" height="92">${ICON[k]}</svg>`); }); return tex; }
function makeBubble(k){ const tex=bubbleTex(k); const s=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:true})); s.scale.set(.42,.45,1); return s; }
function makeCustomer(seed){
  const rnd=(n)=>{ seed=(seed*9301+49297)%233280; return Math.floor(seed/233280*n); };
  const col=COLORS[rnd(COLORS.length)], skin=SKINS[rnd(SKINS.length)], hat=rnd(4);
  const root=new T.Group(), body=new T.Group(); root.add(body); root.userData.dyn=true;
  const bm=mat(col,{roughness:.55});
  const torso=mesh(sph(.21,18),bm,0,.3,0); torso.scale.set(1,1.1,.92); body.add(torso);
  const head=new T.Group(); head.position.y=.66; body.add(head);
  head.add(mesh(sph(.19,18),mat(skin,{roughness:.6})));
  const fm=flat('#26304f');
  [-1,1].forEach(s=>{ const e=new T.Mesh(circ(.026,16),fm); e.scale.y=1.3; e.position.set(s*.065,.02,.188); head.add(e);
    const b=new T.Mesh(circ(.03,16),flat('#ff9d8a',{transparent:true,opacity:.6})); b.position.set(s*.11,-.04,.176); b.rotation.y=s*.5; head.add(b); });
  const m=new T.Mesh(geo('cm',()=>{ const sh=new T.Shape(); sh.absarc(0,0,.03,Math.PI,0,true); sh.lineTo(-.03,0); return new T.ShapeGeometry(sh,12); }),fm); m.position.set(0,-.045,.19); head.add(m);
  const hm=mat(COLORS[(rnd(COLORS.length))],{roughness:.55});
  if(hat===0){ head.add(mesh(geo('beanie',()=>new T.SphereGeometry(.2,18,9,0,Math.PI*2,0,Math.PI/2)),hm,0,.04,0)); head.add(mesh(sph(.05,16),mat('#ffffff'),0,.25,0)); head.add(mesh(cyl(.2,.2,.05,28),mat('#ffffff'),0,.05,0)); }
  if(hat===1){ head.add(mesh(geo('capd',()=>new T.SphereGeometry(.195,18,9,0,Math.PI*2,0,Math.PI/2)),hm,0,.06,0)); const br=mesh(cyl(.13,.13,.02,24),hm,0,.07,.16); br.scale.z=.8; head.add(br); }
  if(hat===2){ [-1,1].forEach(s=>{ const h2=mesh(sph(.07,16),mat('#5a3d2b'),s*.13,.13,-.02); head.add(h2); }); head.add(mesh(geo('hair',()=>new T.SphereGeometry(.198,18,9,0,Math.PI*2,0,Math.PI*.42)),mat('#5a3d2b'),0,.01,-.01)); }
  if(hat===3){ head.add(mesh(geo('hair2',()=>new T.SphereGeometry(.198,18,9,0,Math.PI*2,0,Math.PI*.4)),mat('#2e2620'),0,.01,-.01)); const bow=new T.Group(); bow.position.set(.1,.15,.05); [-1,1].forEach(s=>{ const l=mesh(sph(.045,12),hm,s*.045,0,0); l.scale.set(1,.7,.6); bow.add(l); }); head.add(bow); }
  const feet=[-1,1].map(s=>{ const f=mesh(sph(.065,16),mat('#4a4f63'),s*.09,.04,.03); f.scale.set(1,.6,1.3); body.add(f); return f; });
  const arms=[-1,1].map(s=>{ const a=mesh(sph(.065,16),bm,s*.21,.32,0); a.scale.set(.8,1.2,.8); body.add(a); return a; });
  const blob=new T.Mesh(circ(.26),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.14,depthWrite:false})); blob.rotation.x=-Math.PI/2; blob.position.y=.004; root.add(blob);
  bake(head);
  const st={mode:'idle',t:Math.random()*10,ph:0};
  function update(dt){
    st.t+=dt; const tt=st.t;
    if(st.mode==='walk'){ st.ph+=dt*10; body.position.y=Math.abs(Math.sin(st.ph))*.05; body.rotation.z=Math.sin(st.ph)*.08; feet[0].position.z=.03+Math.sin(st.ph)*.06; feet[1].position.z=.03-Math.sin(st.ph)*.06; arms[0].position.z=Math.sin(st.ph)*.06; arms[1].position.z=-Math.sin(st.ph)*.06; }
    else if(st.mode==='sit'){ body.position.y=Math.abs(Math.sin(tt*3))*.015; body.rotation.z=0; feet.forEach(f=>f.visible=false); arms.forEach((a,i)=>{ a.position.z=.12; a.position.y=.36+(i?Math.max(0,Math.sin(tt*4))*.08:0); }); head.rotation.x=Math.sin(tt*4)*.06-.05; }
    else if(st.mode==='wait'){ body.position.y=Math.abs(Math.sin(tt*2.2))*.02; body.rotation.z=Math.sin(tt*1.5)*.05; head.rotation.z=Math.sin(tt*1.2)*.08; }
    else { body.position.y=Math.sin(tt*2)*.008; body.rotation.z=0; }
  }
  return {root,update,st,head};
}

/* ---------- 소품 ---------- */
function table(x,z){ const g=new T.Group(); g.position.set(x,0,z);
  g.add(mesh(cyl(.5,.5,.06,40),mat('#fffaf0',{roughness:.5}),0,.72,0)); g.add(mesh(cyl(.52,.52,.03,40),mat(PAL.navyL),0,.69,0));
  g.add(mesh(cyl(.05,.05,.66,16),mat('#3a3d4c'),0,.36,0)); g.add(mesh(cyl(.25,.28,.04,28),mat('#3a3d4c'),0,.02,0)); return g; }
function chair(x,z,rot){ const g=new T.Group(); g.position.set(x,0,z); g.rotation.y=rot;
  g.add(mesh(cyl(.2,.2,.07,28),mat(PAL.gold,{roughness:.5}),0,.44,0)); g.add(mesh(cyl(.035,.035,.42,12),mat('#3a3d4c'),0,.21,0)); g.add(mesh(cyl(.16,.18,.03,24),mat('#3a3d4c'),0,.015,0)); return g; }
function plant(x,z,s=1){ const g=new T.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  g.add(mesh(cyl(.2,.15,.3,24),mat('#d9774b'),0,.15,0)); g.add(mesh(cyl(.21,.21,.05,24),mat('#c3653c'),0,.3,0));
  [[0,.55,0,.22],[.12,.45,.08,.15],[-.12,.47,-.05,.16],[.02,.7,.05,.13]].forEach(p=>g.add(mesh(sph(p[3],18),mat('#5cb85c',{roughness:.7}),p[0],p[1],p[2]))); return g; }
function lamp(x,z,h){ const g=new T.Group(); g.position.set(x,h,z); const sw=new T.Group(); sw.userData.dyn=true; g.add(sw);
  sw.add(mesh(cyl(.008,.008,.8,6),mat('#2e2e38'),0,-.4,0,false));
  sw.add(mesh(geo('shade',()=>{ const pts=[[0.0001,0],[.06,0],[.22,-.18],[.24,-.2],[0.0001,-.2]].map(p=>new T.Vector2(p[0],p[1])); return new T.LatheGeometry(pts,32); }),mat(PAL.navy,{roughness:.4,side:T.DoubleSide}),0,-.8,0,false));
  sw.add(mesh(sph(.07,16),new T.MeshBasicMaterial({color:lin('#fff3c4')}),0,-.98,0,false));
  return {g,sw}; }
function tree(x,z,s=1){ const g=new T.Group(); g.position.set(x,0,z); g.scale.setScalar(s);
  g.add(mesh(cyl(.08,.11,1.1,14),mat('#8a5a35'),0,.55,0)); [[0,1.4,0,.5],[.3,1.2,.1,.35],[-.28,1.25,-.05,.36],[0,1.75,0,.32]].forEach(p=>g.add(mesh(sph(p[3],20),mat('#4fae5e',{roughness:.75}),p[0],p[1],p[2]))); return g; }
function streetLamp(x,z){ const g=new T.Group(); g.position.set(x,0,z); g.add(mesh(cyl(.05,.07,2.4,14),mat('#2f3a55'),0,1.2,0)); g.add(mesh(sph(.16,18),new T.MeshBasicMaterial({color:lin('#fff1b8')}),0,2.5,0)); g.add(mesh(cyl(.18,.12,.06,18),mat('#2f3a55'),0,2.38,0)); return g; }

/* ---------- 배경 전체 ---------- */
// KW, KH: 주방 크기 / serveZ: 서빙대 줄 위치
function makeEnvironment(KW,KH,opt){
  opt=opt||{};
  const root=new T.Group(); const upd=[];
  const L=-4.2, R=KW+6.2, B=-1.15, F=KH+1.2; // 가게 경계
  // 가게 바닥 (나무)
  const fw=R-L, fd=F-B; const ftex=TX.plank.clone(); ftex.needsUpdate=true; ftex.wrapS=ftex.wrapT=T.RepeatWrapping; ftex.repeat.set(fw/2,fd/2);
  const floor=new T.Mesh(new T.PlaneGeometry(fw,fd).rotateX(-Math.PI/2),tmat(ftex)); floor.position.set((L+R)/2,-.004,(B+F)/2); floor.receiveShadow=true; root.add(floor);
  // 바깥 땅, 인도, 차도
  const ground=new T.Mesh(new T.PlaneGeometry(120,120).rotateX(-Math.PI/2),mat('#a8d8a0')); ground.position.set(KW/2,-.03,KH/2); ground.receiveShadow=true; root.add(ground);
  const sw=TX.sidewalk.clone(); sw.needsUpdate=true; sw.wrapS=sw.wrapT=T.RepeatWrapping; sw.repeat.set(30,1.5);
  const side=new T.Mesh(new T.PlaneGeometry(60,3).rotateX(-Math.PI/2),tmat(sw)); side.position.set(KW/2,-.01,B-1.6); side.receiveShadow=true; root.add(side);
  const rd=TX.road.clone(); rd.needsUpdate=true; rd.wrapS=T.RepeatWrapping; rd.repeat.set(10,1);
  const road=new T.Mesh(new T.PlaneGeometry(60,3.6).rotateX(-Math.PI/2),tmat(rd)); road.position.set(KW/2,-.02,B-4.9); road.receiveShadow=true; root.add(road);
  // 뒷벽 (낮은 벽 + 큰 창틀)
  const wallW=R-L;
  root.add(mesh(rbox(wallW,1.05,.3,.05,.03),mat('#ffe1b3'),(L+R)/2,.525,B));
  root.add(mesh(rbox(wallW+.04,.14,.34,.05,.03),mat(PAL.navy),(L+R)/2,1.07,B));
  for(let x=L+.1;x<=R;x+=2.4){ root.add(mesh(rbox(.12,1.3,.14,.04,.02),mat('#fffaf0'),x,1.8,B)); }
  root.add(mesh(rbox(wallW,.16,.2,.04,.02),mat('#fffaf0'),(L+R)/2,2.48,B));
  // 간판
  const sg=new T.Mesh(new T.PlaneGeometry(3.6,.9),new T.MeshBasicMaterial({map:TX.sign,transparent:true})); sg.position.set(KW/2,2.95,B+.02); root.add(sg);
  root.add(mesh(rbox(3.7,.12,.16,.04,.02),mat(PAL.gold),KW/2,2.45,B+.02,false));
  // 옆벽 (낮은 칸막이, 문 자리 비움)
  root.add(mesh(rbox(.24,.9,F-B-2.2,.05,.03),mat('#ffe1b3'),R,.45,(B+F)/2-1.1));
  root.add(mesh(rbox(.24,.9,F-B,.05,.03),mat('#ffe1b3'),L,.45,(B+F)/2));
  // 문 (오른쪽 앞)
  const door=new T.Group(); door.position.set(R,0,F-1); root.add(door);
  door.add(mesh(rbox(.18,2.0,.12,.04,.02),mat(PAL.navyD),0,1.0,-1.05)); door.add(mesh(rbox(.18,2.0,.12,.04,.02),mat(PAL.navyD),0,1.0,1.05)); door.add(mesh(rbox(.2,.16,2.22,.04,.02),mat(PAL.navyD),0,2.05,0));
  door.add(mesh(sph(.06,14),mat(PAL.gold,{metalness:.5,roughness:.3}),0,1.88,0));
  // 메뉴판, 시계
  const mb=new T.Mesh(new T.PlaneGeometry(1.5,.94),new T.MeshBasicMaterial({map:TX.menu,transparent:true})); mb.position.set(KW+3.2,1.75,B+.12); root.add(mb);
  const ck=new T.Mesh(circ(.28,40),new T.MeshBasicMaterial({map:TX.clock,transparent:true})); ck.position.set(-1.8,1.85,B+.12); root.add(ck);
  const hands=[new T.Mesh(new T.PlaneGeometry(.025,.18),flat(PAL.navyD)),new T.Mesh(new T.PlaneGeometry(.02,.24),flat('#e5484d'))];
  hands.forEach(h=>{ h.userData.dyn=true; h.geometry.translate(0,h.geometry.parameters.height/2-.02,0); h.position.set(-1.8,1.85,B+.13); root.add(h); });
  upd.push((dt,tt)=>{ hands[0].rotation.z=-tt*.05; hands[1].rotation.z=-tt*1.2; });

  // 창고 (왼쪽)
  const fr=new T.Group(); fr.position.set(-2.9,0,.4); root.add(fr);
  fr.add(mesh(rbox(1,1.9,.85,.1,.04),mat(PAL.steel,{metalness:.3,roughness:.35}),0,.95,0));
  fr.add(mesh(rbox(.9,.02,.02,.01,.005),mat(PAL.steelD),0,1.2,.43,false));
  fr.add(mesh(rbox(.05,.5,.06,.02,.01),mat(PAL.steelD),.36,1.5,.45)); fr.add(mesh(rbox(.05,.4,.06,.02,.01),mat(PAL.steelD),.36,.8,.45));
  const shelf=new T.Group(); shelf.position.set(-2.9,0,2.2); root.add(shelf);
  for(let i=0;i<3;i++) shelf.add(mesh(rbox(.9,.05,.5,.03,.015),mat(PAL.wood),0,.35+i*.5,0));
  [-.42,.42].forEach(x=>shelf.add(mesh(rbox(.05,1.4,.5,.02,.01),mat(PAL.woodD),x,.7,0)));
  ['#e99a2e','#ff8fa3','#7cc8a4','#ffd43b','#5cc3f0','#e99a2e'].forEach((c,i)=>{ const j=mesh(cyl(.08,.08,.18,20),mat(c,{roughness:.3}),-.27+(i%3)*.27,.48+Math.floor(i/3)*.5,0); shelf.add(j); shelf.add(mesh(cyl(.085,.085,.04,20),mat('#fffaf0'),-.27+(i%3)*.27,.59+Math.floor(i/3)*.5,0)); });
  // 밀가루 포대
  [[-3.1,3.7,0],[-2.55,3.85,.4],[-2.85,3.6,0,.62]].forEach((p,i)=>{ const s=mesh(sph(.3,24),mat('#fbf4e6',{roughness:.8}),p[0],p[3]||.28,p[1]); s.scale.set(1,i===2?.8:1.05,.8); s.rotation.y=p[2]; root.add(s);
    const y=(p[3]||.28)+.3*(i===2?.8:1.05); root.add(mesh(cyl(.07,.12,.12,20),mat('#fbf4e6',{roughness:.8}),p[0],y,p[1])); root.add(mesh(G.tie||(G.tie=new T.TorusGeometry(.075,.018,8,24)),mat('#c98a4f'),p[0],y+.01,p[1]).rotateX(Math.PI/2)); });
  [[-1.4,4.6],[-1.4,5.4]].forEach((p,i)=>{ root.add(mesh(rbox(.6,.45,.6,.05,.02),mat(PAL.woodL),p[0]-1.5,.225,p[1])); });
  root.add(mesh(rbox(.6,.45,.6,.05,.02),mat(PAL.woodL),-2.9,.675,4.6));

  // 홀: 테이블, 의자, 조명
  const dx=KW+.6;
  const tables=[[dx+2.6,1.8],[dx+4.4,3.4],[dx+2.4,4.8]];
  const seated=[];
  tables.forEach(([x,z],ti)=>{ root.add(table(x,z));
    [[-.75,0,Math.PI/2],[.75,0,-Math.PI/2]].forEach(([ox,oz,r],ci)=>{ root.add(chair(x+ox,z+oz,r));
      if((ti+ci)%3!==2){ const c=makeCustomer(ti*7+ci*3+11); c.root.position.set(x+ox*.95,.43,z+oz); c.root.rotation.y=r; c.st.mode='sit'; root.add(c.root); seated.push(c); } });
    const p=itemMesh({k:'plate',n:1,food:ti===1?['waffle','syrup','banana']:['waffle','cream','strawberry']}); p.scale.setScalar(.7); p.position.set(x,.75,z); root.add(p);
    const p2=itemMesh({k:'plate',n:1,food:['waffle','cream','choco']}); p2.scale.setScalar(.6); p2.position.set(x+.2,.75,z+.2); if(ti!==1) root.add(p2);
    const lp=lamp(x,z,3.0); root.add(lp.g); upd.push((dt,tt)=>{ lp.sw.rotation.z=Math.sin(tt*1.3+ti)*.04; });
  });
  seated.forEach(c=>upd.push(dt=>c.update(dt)));
  // 화분
  [[R-.5,B+.5,1.1],[L+.5,F-.6,1],[KW+.9,F-.4,.9],[L+.5,B+.55,1]].forEach(p=>root.add(plant(p[0],p[1],p[2])));

  // 줄 선 손님 (서빙대 앞)
  const serveZ=opt.serveZ!=null?opt.serveZ:1.5;
  const queue=[]; for(let i=0;i<3;i++){ const c=makeCustomer(101+i*17); c.root.position.set(KW+.15+i*.72,0,serveZ+(i%2?.25:-.1)); c.root.rotation.y=-Math.PI/2; c.st.mode='wait'; root.add(c.root); queue.push(c); upd.push(dt=>c.update(dt)); }
  const bub=makeBubble('waffle'); bub.position.set(0,1.15,0); queue[0].root.add(bub);
  upd.push((dt,tt)=>{ bub.position.y=1.15+Math.sin(tt*3)*.04; });

  // 홀을 걸어다니는 손님
  const walkers=[];
  const hallPath=[[R+.8,F-1],[R-.4,F-1],[dx+1.2,F-.4],[dx+1.2,3.0],[dx+3.5,2.6],[dx+5,F-.6],[R-.4,F-1],[R+.8,F-1],[R+1.6,F+.6]];
  for(let i=0;i<2;i++){ const c=makeCustomer(301+i*29); c.st.mode='walk'; root.add(c.root); walkers.push({c,path:hallPath,seg:i*3,u:0,speed:1.1}); }
  // 거리 행인 (좌우로 지나감)
  const street=[];
  for(let i=0;i<7;i++){ const c=makeCustomer(501+i*13); c.st.mode='walk'; root.add(c.root); const dir=i%2?1:-1; street.push({c,dir,x:L-4+((i*5.3)%(R-L+8)),z:B-(i%2?1.2:2.1),speed:.9+((i*37)%10)/20}); }
  upd.push(dt=>{
    walkers.forEach(w=>{ const a=w.path[w.seg], b=w.path[(w.seg+1)%w.path.length]; const len=Math.hypot(b[0]-a[0],b[1]-a[1]); w.u+=dt*w.speed/len; if(w.u>=1){ w.u=0; w.seg=(w.seg+1)%w.path.length; }
      const x=a[0]+(b[0]-a[0])*w.u, z=a[1]+(b[1]-a[1])*w.u; w.c.root.position.set(x,0,z); const ty=Math.atan2(b[0]-a[0],b[1]-a[1]); let d=ty-w.c.root.rotation.y; while(d>Math.PI)d-=Math.PI*2; while(d<-Math.PI)d+=Math.PI*2; w.c.root.rotation.y+=d*Math.min(1,dt*8); w.c.update(dt); });
    street.forEach(s=>{ s.x+=s.dir*s.speed*dt; if(s.x>R+5) s.x=L-5; if(s.x<L-5) s.x=R+5; s.c.root.position.set(s.x,0,s.z); s.c.root.rotation.y=s.dir>0?Math.PI/2:-Math.PI/2; s.c.update(dt); });
  });
  // 차 (천천히 지나감)
  const car=new T.Group(); car.userData.dyn=true; root.add(car);
  car.add(mesh(rbox(1.5,.45,.8,.18,.08),mat('#ff7a59',{roughness:.35}),0,.38,0)); car.add(mesh(rbox(.85,.4,.72,.16,.08),mat('#ff7a59',{roughness:.35}),-.1,.75,0));
  car.add(mesh(rbox(.75,.28,.74,.12,.04),mat('#bfe6ff',{roughness:.1}),-.1,.76,0,false));
  [[-.45,.4],[.45,.4],[-.45,-.4],[.45,-.4]].forEach(p=>{ const w=mesh(cyl(.16,.16,.1,20),mat('#2e2e38'),p[0],.16,p[1]); w.rotation.x=Math.PI/2; car.add(w); });
  let carX=L-6; upd.push(dt=>{ carX+=dt*2.4; if(carX>R+8) carX=L-8; car.position.set(carX,0,B-4.3); });
  // 길 건너 건물, 나무, 가로등
  const fac=[['#ffd1dc','#e86b8a','#e86b8a'],['#d8ecff','#5c8fe0','#5c8fe0'],['#fff0c2','#e8a033','#e8a033'],['#d9f3e3','#45b26b','#45b26b'],['#eadcff','#8a6bd6','#8a6bd6']];
  for(let i=0;i<8;i++){ const f=fac[i%fac.length]; const w=2.6, h=3.2+(i%3)*.5; const b=new T.Mesh(geo('bld'+h,()=>new T.BoxGeometry(w,h,1.6)),[mat(f[0]),mat(f[0]),mat(f[1]),mat(f[0]),tmat(facadeTex(f[0],f[1],f[2])),mat(f[0])]); b.position.set(L-4+i*2.75,h/2,B-8.2); b.castShadow=true; b.receiveShadow=true; root.add(b); }
  for(let x=L-2;x<R+3;x+=3.2){ root.add(tree(x,B-3.0,.9)); }
  for(let x=L-.4;x<R+3;x+=6.4){ root.add(streetLamp(x+1.6,B-.55)); }

  root.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshBasicMaterial) o.castShadow=false; });
  return {root,update:(dt,tt)=>upd.forEach(f=>f(dt,tt)),bounds:{L,R,B,F},queue};
}
// 웹폰트가 늦게 받아지면 간판 글씨를 다시 그려요
window.WK.refreshText=()=>TEXT_TEX.forEach(o=>{ const x=o.cv.getContext('2d'); x.clearRect(0,0,o.cv.width,o.cv.height); o.draw(x,o.cv.width,o.cv.height); o.t.needsUpdate=true; });

/* ---------------- 하늘 테마: 열기구 바구니 안 주방 ---------------- */
const wickerTex=canvasTex(128,128,(x,w,h)=>{ x.fillStyle='#b27a3e'; x.fillRect(0,0,w,h);
  for(let j=0;j<8;j++) for(let i=0;i<8;i++){ const o=(i+j)%2; x.fillStyle=o?'#c98d4c':'#9c6632'; x.fillRect(i*16+1,j*16+(o?1:5),14,10); x.fillStyle='rgba(255,240,200,.25)'; x.fillRect(i*16+2,j*16+(o?2:6),12,2); }
  x.fillStyle='rgba(60,30,10,.35)'; for(let i=0;i<8;i++) x.fillRect(i*16,0,1.5,h); });
wickerTex.wrapS=wickerTex.wrapT=T.RepeatWrapping;
function envelopeTex(a,b){ return canvasTex(256,128,(x,w,h)=>{ const n=8; for(let i=0;i<n;i++){ x.fillStyle=i%2?a:b; x.fillRect(i*w/n,0,w/n+1,h); } x.fillStyle='rgba(255,255,255,.18)'; x.fillRect(0,h*.18,w,6); }); }
// 열기구 하나 (풍선 + 줄 + 바구니), 바구니 윗면 높이 = 0
function balloon(r,cols,basket){ const g=new T.Group();
  const tex=envelopeTex(cols[0],cols[1]); tex.wrapS=T.RepeatWrapping;
  const env=new T.Mesh(geo('env'+r,()=>{ const pts=[]; for(let i=0;i<=16;i++){ const t=i/16, a=-Math.PI/2+t*Math.PI; const rr=Math.cos(a)*r*(t<.5?.62+t*.76:1), y=Math.sin(a)*r*1.12; pts.push(new T.Vector2(Math.max(.001,rr),y)); } return new T.LatheGeometry(pts,24); }),tmat(tex,{roughness:.9}));
  env.position.y=basket*1.2+r*1.5; g.add(env);
  const ring=mesh(cyl(r*.32,r*.32,.08,20),mat('#6b4a2a'),0,env.position.y-r*1.1,0); g.add(ring);
  const bw=basket*1.1; [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz])=>{ const a=new T.Vector3(sx*bw*.45,0,sz*bw*.45), b=new T.Vector3(sx*r*.3,ring.position.y,sz*r*.3); const d=b.clone().sub(a); const L=d.length();
    const rope=mesh(cyl(.018,.018,L,5),mat('#5b4127'),0,0,0,false); rope.position.copy(a).add(b).multiplyScalar(.5); rope.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); g.add(rope); });
  const bk=new T.Mesh(geo('bk'+basket,()=>new T.BoxGeometry(bw,basket*.7,bw)),tmat(wickerTex)); bk.position.y=-basket*.35; g.add(bk);
  g.add(mesh(rbox(bw+.08,.08,bw+.08,.03,.02),mat('#7a4e25'),0,0,0));
  const fl=new T.Mesh(sph(r*.14,10),new T.MeshBasicMaterial({color:0xffa53a,transparent:true,opacity:.85})); fl.position.y=ring.position.y+.15; fl.userData.dyn=true; g.add(fl);
  return {g,fl}; }
function cloud(s,seed){ const g=new T.Group(); const m=mat('#ffffff',{roughness:1}); let sd=seed;
  const r=()=>{ sd=(sd*9301+49297)%233280; return sd/233280; };
  for(let i=0;i<5;i++){ const b=mesh(sph(.5+r()*.5,10),m,(i-2)*.7*s,r()*.3*s,(r()-.5)*.6*s,false); b.scale.setScalar(s); b.receiveShadow=false; g.add(b); }
  g.userData.dyn=true; return g; }
function makeSkyEnvironment(KW,KH,opt){
  opt=opt||{};
  const root=new T.Group(); const upd=[];
  const L=-.5, R=KW-.5, B=-.5, F=KH-.5;
  // 우리 주방을 둘러싼 바구니 벽 (바닥 아래로 내려가요)
  const wt=wickerTex.clone(); wt.needsUpdate=true; wt.wrapS=wt.wrapT=T.RepeatWrapping;
  const wall=(w,d,x,z,rw)=>{ const t=wt.clone(); t.needsUpdate=true; t.repeat.set(rw,1.4); const m=new T.Mesh(new T.BoxGeometry(w,1.6,d),tmat(t)); m.position.set(x,-.75,z); m.receiveShadow=true; root.add(m); };
  wall(KW+.6,.3,(KW-1)/2,B-.15,KW/1.4); wall(KW+.6,.3,(KW-1)/2,F+.15,KW/1.4); wall(.3,KH,L-.15,(KH-1)/2,KH/1.4); wall(.3,KH,R+.15,(KH-1)/2,KH/1.4);
  root.add(mesh(rbox(KW+.7,.1,.4,.04,.02),mat('#7a4e25'),(KW-1)/2,.04,B-.15)); root.add(mesh(rbox(KW+.7,.1,.4,.04,.02),mat('#7a4e25'),(KW-1)/2,.04,F+.15));
  root.add(mesh(rbox(.4,.1,KH+.3,.04,.02),mat('#7a4e25'),L-.15,.04,(KH-1)/2)); root.add(mesh(rbox(.4,.1,KH+.3,.04,.02),mat('#7a4e25'),R+.15,.04,(KH-1)/2));
  // 우리 풍선으로 올라가는 굵은 줄 (네 귀퉁이)
  [[L-.15,B-.15],[R+.15,B-.15],[L-.15,F+.15],[R+.15,F+.15]].forEach(([x,z])=>{ const a=new T.Vector3(x,0,z), b=new T.Vector3((KW-1)/2+(x<KW/2?-1.5:1.5),16,(KH-1)/2-6); const d=b.clone().sub(a), Ln=d.length();
    const rope=mesh(cyl(.035,.035,Ln,6),mat('#5b4127'),0,0,0,false); rope.position.copy(a).add(b).multiplyScalar(.5); rope.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize()); root.add(rope); });
  // 우리 열기구 풍선 (뒤쪽 위)
  { const tex=envelopeTex('#e5484d','#fff1d6'); const big=new T.Mesh(new T.SphereGeometry(7,24,16),tmat(tex,{roughness:.9})); big.position.set((KW-1)/2,17,(KH-1)/2-9); big.scale.set(1,1.1,1); root.add(big); }
  // 손님 바구니에 붙은 발판 (서빙대 쪽, 오른쪽)
  const serveZ=opt.serveZ!=null?opt.serveZ:1.5;
  const deck=new T.Group(); root.add(deck);
  deck.add(mesh(rbox(3.2,.12,2.6,.05,.03),mat('#c98a4f'),KW+1.1,-.06,serveZ+.1));
  for(let i=0;i<5;i++) deck.add(mesh(rbox(.06,.5,.06,.02,.01),mat('#7a4e25'),KW-.3+i*.72,.25,serveZ+1.35));
  deck.add(mesh(rbox(3.0,.06,.08,.02,.01),mat('#7a4e25'),KW+1.1,.5,serveZ+1.35));
  deck.add(mesh(rbox(3.0,.06,.08,.02,.01),mat('#7a4e25'),KW+1.1,.5,serveZ-1.15));
  // 손님 열기구 (오른쪽·뒤쪽에 둥둥) — 안에서 와플을 먹어요
  const seated=[], bobs=[];
  const spots=[[KW+5.2,1.2,-.8,1.6,['#2456c4','#ffffff']],[KW+4.6,KH-1.2,-1.4,1.4,['#f7b52c','#fff1d6']],[-4.4,KH*.45,-1.8,1.5,['#45b26b','#ffffff']],[KW*.55,-5.5,-2.6,1.5,['#8a6bd6','#fff1d6']]];
  spots.forEach(([x,z,y,bs,cols],k)=>{ const b=balloon(2.4,cols,bs); b.g.position.set(x,y,z); b.g.userData.dyn=true; root.add(b.g);
    const tb=mesh(cyl(.32,.32,.05,14),mat('#fffaf0'),0,.42,0); b.g.add(tb); b.g.add(mesh(cyl(.05,.05,.42,8),mat('#7a4e25'),0,.21,0));
    const p=itemMesh({k:'plate',n:1,food:k%2?['waffle','syrup','banana']:['waffle','cream','strawberry']}); p.scale.setScalar(.6); p.position.set(0,.46,0); b.g.add(p);
    [[-.5,0,Math.PI/2],[.5,0,-Math.PI/2]].forEach(([ox,oz,r],ci)=>{ const c=makeCustomer(700+k*11+ci*5); c.root.position.set(ox,0,oz); c.root.rotation.y=r; c.st.mode='sit'; b.g.add(c.root); seated.push(c); });
    bobs.push({g:b.g,y,ph:k*1.7,fl:b.fl}); });
  seated.forEach(c=>upd.push(dt=>c.update(dt)));
  upd.push((dt,tt)=>bobs.forEach(o=>{ o.g.position.y=o.y+Math.sin(tt*.7+o.ph)*.18; o.fl.scale.setScalar(.85+Math.abs(Math.sin(tt*9+o.ph))*.3); }));
  // 구름 (아래와 옆에서 천천히 흘러가요)
  const clouds=[]; for(let i=0;i<14;i++){ const s=.8+((i*37)%10)/8; const c=cloud(s,i*13+5); const below=i<9;
    c.position.set(-10+((i*7.3)%(KW+20)),below?-4-((i*3)%4):-1.2+((i*5)%3),below?((i*5.7)%(KH+10))-5:(i%2?-7:KH+5)); root.add(c); clouds.push({c,v:.25+((i*11)%5)/12}); }
  upd.push(dt=>clouds.forEach(o=>{ o.c.position.x+=o.v*dt; if(o.c.position.x>KW+14) o.c.position.x=-14; }));
  // 줄 선 손님 (발판 위)
  const queue=[]; for(let i=0;i<3;i++){ const c=makeCustomer(101+i*17); c.root.position.set(KW+.15+i*.72,0,serveZ+(i%2?.25:-.1)); c.root.rotation.y=-Math.PI/2; c.st.mode='wait'; root.add(c.root); queue.push(c); upd.push(dt=>c.update(dt)); }
  const bub=makeBubble('waffle'); bub.position.set(0,1.15,0); queue[0].root.add(bub);
  upd.push((dt,tt)=>{ bub.position.y=1.15+Math.sin(tt*3)*.04; });
  root.traverse(o=>{ if(o.isMesh&&o.material&&o.material.isMeshBasicMaterial) o.castShadow=false; });
  return {root,update:(dt,tt)=>upd.forEach(f=>f(dt,tt)),bounds:{L,R,B,F},queue,sky:true};
}
window.WK.makeCustomer=makeCustomer; window.WK.makeEnvironment=makeEnvironment; window.WK.makeSkyEnvironment=makeSkyEnvironment;
})();
