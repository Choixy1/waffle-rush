# 소스(src.html + models.js + env.js)로 사이트용 index.html을 만들어요: python3 source/build_site.py
import os, re
d=os.path.dirname(os.path.abspath(__file__))
s=open(os.path.join(d,'src.html'),encoding='utf-8').read()
s=s.replace('/*__MODELS__*/',open(os.path.join(d,'models.js'),encoding='utf-8').read()+'\n'+open(os.path.join(d,'env.js'),encoding='utf-8').read())
s=re.sub(r'^// 테스트용 훅\n','',s,flags=re.M); s=re.sub(r'^window\.__game=.*\n','',s,flags=re.M)
TH='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
s=s.replace(TH,'<script src="peerjs.min.js"></script>\n'+TH)
head='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="description" content="친구와 함께 와플과 쉐이크를 만드는 3D 요리 게임"><style>html,body{margin:0;height:100%}</style></head><body>'
open(os.path.join(d,'..','index.html'),'w',encoding='utf-8').write(head+s+'</body></html>')
