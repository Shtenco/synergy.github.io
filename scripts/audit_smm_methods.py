#!/usr/bin/env python3
"""Exhaustive non-destructive SMM method/interaction smoke test.

Does not submit forms or contact authenticated external APIs.
One HTML form per contract; platform UI checks are independent.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"visual-acceptance-results"
OUT.mkdir(exist_ok=True)
errors=[]
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
 for label,width,height in [("desktop",1440,900),("mobile",390,844)]:
  page=browser.new_page(viewport={"width":width,"height":height})
  js=[]
  page.on("pageerror",lambda e:js.append(str(e)))
  response=page.goto("http://127.0.0.1:8765/smm/cabinet.html",wait_until="domcontentloaded")
  page.wait_for_timeout(650)
  result=page.evaluate("""() => {
    const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
    const forms=$$('form[data-t]'),uniques=new Set(forms.map(f=>f.dataset.t));
    const failures=[];
    if(forms.length!==140)failures.push('expected 140 method forms, got '+forms.length);
    if($$('form').length!==144)failures.push('expected 144 total forms');
    if(document.documentElement.dataset.registryCount!==String(forms.length))failures.push('registry mismatch');
    if(!window.SynergySimpleOpen)failures.push('missing navigation API');
    for(const form of forms){
      const code=form.dataset.t;
      if(!window.SynergySimpleOpen?.(code)){failures.push('not routable '+code);continue}
      const card=form.closest('.tool');
      const visible=card && getComputedStyle(card).display!=='none' && card.getClientRects().length>0;
      const selectedView=form.closest('.smm-view');
      if(!visible || !selectedView?.classList.contains('is-active'))failures.push('not visible '+code);
      if(!form.querySelector('button[type="submit"],button:not([type])'))failures.push('no submit control '+code);
    }
    const buttons=$$('button');
    const unnamed=buttons.filter(b=>!b.getAttribute('aria-label')&&!b.textContent.trim()&&!b.getAttribute('title')).length;
    if(unnamed)failures.push('buttons without accessible names: '+unnamed);
    // Search and manual navigation: do not submit any form.
    const search=$('#smm-method-search');search.value='vk_search_groups';search.dispatchEvent(new Event('input',{bubbles:true}));
    const found=$$('#smm-method-list .method-result');
    if(!found.length)failures.push('method search returns no result');
    const count=$('#smm-method-count')?.textContent||'';
    if(!count.match(/\d+ из 140/))failures.push('wrong catalog count '+count);
    return {forms:forms.length,unique:uniques.size,buttons:buttons.length,unnamed,failures,searchResults:found.length};
  }""")
  result["viewport"]=label;result["jsErrors"]=js
  if js: errors.append({"viewport":label,"js":js[:10]})
  if result["failures"]: errors.append({"viewport":label,"issues":result["failures"][:35]})
  checks.append(result)
  page.screenshot(path=str(OUT/("cabinet-methods-"+label+".png")),full_page=False,animations="disabled")
  page.close()
 browser.close()
(OUT/"methods-report.json").write_text(json.dumps({"checks":checks,"issues":errors},ensure_ascii=False,indent=2),encoding="utf8")
for c in checks: print(json.dumps(c,ensure_ascii=False))
sys.exit(bool(errors))
