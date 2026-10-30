#!/usr/bin/env python3
"""Rebuild index.html from src/ + data.json. A refresh run only rewrites data.json, then runs this."""
import base64, json, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)))
S='src/'
data=json.load(open('data.json',encoding='utf-8'))
base=open(S+'v3-css-base.css').read(); extra=open(S+'v4-extra.css').read(); extra5=open(S+'v5-extra.css').read()
body=open(S+'v5-body.html').read().replace(' hatch-none','')
js=open(S+'v5-main.js').read()
assets=json.load(open(S+'assets-v5.json'))
assets['bgm']='data:audio/mpeg;base64,'+base64.b64encode(open(S+'bgm/office-ambient.mp3','rb').read()).decode()
dj=json.dumps(data,ensure_ascii=False).replace('</','<\\/')
html=f"""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow,noarchive"><link rel="icon" href="data:,"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Coria Xu Grok Bot 团队办公室</title>
<style>
{base}
{extra}
{extra5}
</style></head><body>
{body}
<script type="application/json" id="office-data">{dj}</script>
<script>window.ASSETS_LIVE={json.dumps(assets,ensure_ascii=False)};</script>
<script>
{js}
</script>
</body></html>"""
open('index.html','w',encoding='utf-8').write(html)
print(round(len(html)/1e6,3),'MB')
