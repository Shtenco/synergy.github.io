#!/usr/bin/env python3
"""SYNERGY design migration regression tests.

Scope deliberately limited to completed flagship redesigns. Every migrated page
must have exactly its own native stylesheet and retain its control contracts.
This does not claim E2E/browser or backend success.
"""
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATED = {
    "nexus/index.html": ("nexus-2026.css", "nexus.js", ["live-status","ai-state","cloud-state","auth-state","login-form","logout","repo-search","repo-list","load-repos","load-cloud","chat-form","chat-input","ai-model"]),
    "smm/index.html": ("smm-2026.css", None, ["top","pain","product","platforms","funnel","analytics","roles","pricing","contact"]),
    "ai/index.html": ("olga-2026.css", "app.js", ["newChat","chatList","messages","welcome","fileInput","prompt","send","settingsModal","authModal","registerForm","loginForm","traceDrawer","busDrawer"]),
    "cfo/index.html": ("cfo-2026.css", "app.js", ["stepUpload","stepReview","stepDashboard","stepAi","stepAdvanced","cfo-login-form"]),
    "riskguard/index.html": ("riskguard-2026.css", "riskguard.js", ["data-pill","source-label","quorum-label","m-equity","m-exposure","equity","compute","risk-budget","trade-notional"]),
    "video/index.html": ("video-2026.css", "app.js", ["sidebar","shade","projectCount","projectGrid","createProject","saveDraft","stageList","sceneGrid","providerGrid"]),
    "advert/index.html": ("advert-2026.css", "app.js", ["mobileMenu","dataset","upload","audiences","plan","optimize","result"]),
    "market/index.html": ("market-2026.css", "app.js", ["sidebar","nav","productGrid","kanban","productModal","currencyGrid","ledgerRows","toast"]),
    "investor-folio/index.html": ("folio-2026.css", "folio.js", ["connection","go-portfolio","go-optimize","login-form","portfolio-list","analyze-form","risk-report","market-output"]),
    "broker-mesh/index.html": ("mesh-2026.css", "mesh.js", ["reload","live-status","provider-count","method-count","connected-count","cards","catalog","query"]),
    "investor/index.html": ("investor-2026.css", "app.js", ["menu","connect","headPrice","priceUsd","liquidity","volume","portfolioEmpty","toast"]),
}
class Parse(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.links, self.scripts, self.styles = set(), [], [], []
    def handle_starttag(self, tag, attrs):
        data=dict(attrs)
        if data.get('id'): self.ids.add(data['id'])
        if tag == 'a' and data.get('href'): self.links.append(data['href'])
        if tag == 'script' and data.get('src'): self.scripts.append(data['src'])
        if tag == 'link' and data.get('rel') == 'stylesheet': self.styles.append(data.get('href',''))

def check():
    errors=[]
    for file, (css, js, ids) in MIGRATED.items():
        page=ROOT/file
        if not page.is_file():
            errors.append(f'{file}: missing')
            continue
        p=Parse()
        p.feed(page.read_text(encoding='utf-8'))
        for identifier in ids:
            if identifier not in p.ids: errors.append(f'{file}: missing required #{identifier}')
        if not any(s.split('?')[0] == css for s in p.styles):
            errors.append(f'{file}: missing native stylesheet {css}')
        if js and js not in p.scripts:
            errors.append(f'{file}: missing original {js}')
        for stylesheet in p.styles:
            if 'synergy-premium' in stylesheet or 'synergy-atelier' in stylesheet or 'synergy-stability' in stylesheet:
                errors.append(f'{file}: obsolete cascade {stylesheet}')
        if not (ROOT/file).parent.joinpath(css).exists():
            errors.append(f'{file}: required CSS file absent')
        if js and not (ROOT/file).parent.joinpath(js).exists():
            errors.append(f'{file}: original JS file absent')
        logo = '../assets/synergy-logo.webp'
        if logo not in page.read_text(encoding='utf-8'):
            errors.append(f'{file}: corporate logo missing')
        if file != 'smm/index.html' and not any(link.startswith('../portal/') for link in p.links):
            errors.append(f'{file}: no return link to Product Atlas')
        if file == 'smm/index.html' and not any(link.startswith('../index.html') for link in p.links):
            errors.append(f'{file}: no return link to home')
    atlas=(ROOT/'portal/atlas.js').read_text(encoding='utf-8')
    if "card.href='..'+href;" in atlas:
        errors.append('portal/atlas.js: repeated synergy.github.io project path bug')
    for protected in ['index.html','portal/index.html','assets/syn26.css','assets/synergy-logo.webp']:
        if not (ROOT/protected).is_file(): errors.append(f'protected foundation file absent: {protected}')
    return errors

if __name__=='__main__':
    errors=check()
    for error in errors: print('FAIL:',error)
    print(f'Checked {len(MIGRATED)} redesigned pages + Atlas routing: {len(errors)} contract errors')
    sys.exit(bool(errors))
