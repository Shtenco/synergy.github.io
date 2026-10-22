#!/usr/bin/env python3
"""Visual smoke tests for SYNERGY Pages; static-only, no backend claims.

Run with: python -m http.server 8765 & python scripts/visual_acceptance.py
Requires: pip install playwright && python -m playwright install chromium
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys

ROOT=Path(__file__).resolve().parents[1]
BASE="http://127.0.0.1:8765"
PAGES=[
 "index.html","portal/index.html","smm/index.html","cfo/index.html","riskguard/index.html",
 "smm/workspaces.html","smm/studio.html","smm/lead-radar.html",
 "smm/ai-studio.html","smm/caseflow.html","smm/parsing.html",
 "smm/engagement.html","smm/jobs.html","smm/audiences-team.html",
 "smm/caseflow-team.html","investor/index.html","investor-folio/index.html",
 "broker-mesh/index.html","smm/p14.html",
 "smm/vk.html","smm/telegram.html","smm/instagram.html","smm/max.html",
 "smm/threads.html","smm/ok.html","smm/tiktok.html","smm/signal.html","smm/zen.html",
 "smm/cabinet.html",
 "mvp.html","nexus/index.html","archiver.html","ecosystem/architecture.html",
 "avito/index.html","meta-api/index.html","workspace/index.html",
]
VIEWS=[("desktop",1440,900),("tablet",768,1024),("mobile",390,844)]
OUT=ROOT/"visual-acceptance-results";OUT.mkdir(exist_ok=True)
failures=[];report=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox"])
    for mode,w,h in VIEWS:
        context=browser.new_context(viewport={"width":w,"height":h},device_scale_factor=1)
        for route in PAGES:
            page=context.new_page()
            url=f"{BASE}/{route}"
            errors=[]
            page.on("pageerror",lambda err,errors=errors:errors.append(str(err)))
            response=page.goto(url,wait_until="domcontentloaded",timeout=20000)
            page.wait_for_timeout(500)
            status=response.status if response else 0
            metrics=page.evaluate("""() => ({
              viewport:innerWidth,
              document:document.documentElement.scrollWidth,
              body:document.body.scrollWidth,
              styles:[...document.styleSheets].length,
              visibleH1:[...document.querySelectorAll('h1')].filter(x=>x.getClientRects().length>0).length,
              brokenImages:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src),
              navigation:[...document.querySelectorAll('a[href]')].filter(a=>a.getClientRects().length>0).length,
              tinyTargets:[...document.querySelectorAll('a,button')].filter(a=>{
                 let r=a.getBoundingClientRect();
                 return r.width>0&&r.height>0&&r.width<24&&r.height<24
              }).length
            })""")
            # Conversion journey smoke checks: content, interactive persona switching and FAQ.
            if route in ("index.html", "smm/index.html", "avito/index.html",
                         "workspace/index.html", "cfo/index.html", "riskguard/index.html",
                         "investor-folio/index.html"):
                journey=page.locator("#syn-conversion-home, #syn-conversion-product")
                if journey.count()!=1:
                    errors.append("conversion journey container absent")
                else:
                    if route=="index.html":
                        tabs=page.locator("#syn-conversion-home [role=tab]")
                        if tabs.count()!=6:
                            errors.append(f"expected 6 product tabs; found {tabs.count()}")
                        else:
                            tabs.nth(5).click()
                            if page.locator("#cv-panel-folio").is_hidden():
                                errors.append("persona switch to Investor Folio failed")
                            tabs.nth(0).click()
                    else:
                        if page.locator("#syn-conversion-product .cv-next-card").count()!=3:
                            errors.append("missing associative cross-sell paths")
                        if page.locator("#syn-conversion-product details").count()!=4:
                            errors.append("missing FAQ objections")
            slug=route.replace("/","_").replace(".html","")
            page.screenshot(path=str(OUT/f"{slug}-{mode}.png"),full_page=True,timeout=20000,animations="disabled")
            issues=[]
            if status!=200:issues.append(f"HTTP {status}")
            if metrics["document"]>w+4:issues.append(f"horizontal overflow +{metrics['document']-w}px")
            if metrics["visibleH1"]==0:issues.append("no visible h1")
            if metrics["brokenImages"]:issues.append("broken images: "+", ".join(metrics["brokenImages"][:3]))
            if errors:issues.append("JS errors: "+"; ".join(errors[:3]))
            if metrics["tinyTargets"]:issues.append(f"{metrics['tinyTargets']} controls <24px")
            if issues:failures.append({"route":route,"viewport":mode,"issues":issues})
            report.append({"route":route,"viewport":mode,"status":status,**metrics,"jsErrors":errors[:5],"issues":issues})
            page.close()
        context.close()
    browser.close()
(OUT/"report.json").write_text(json.dumps({"checked":len(report),"issues":failures,"pages":report},indent=2,ensure_ascii=False),encoding="utf-8")
print(f"Visual check: {len(report)} page/viewport combinations; {len(failures)} with issues")
for e in failures: print(e)
sys.exit(bool(failures))
