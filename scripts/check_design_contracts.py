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
    "mvp.html": ("synergy-ecosystem-26.css", None, ["top","system","pain","offer","modules","affiliate","money","roadmap","investors","contact"]),
    "nexus/index.html": ("synergy-ecosystem-26.css", "nexus.js", ["app","live-status","overview","ai-state","cloud-state","modules","modules-list","operations","auth-state","login-form","login-pass","logout","repo-list","chat-form","chat-input","load-cloud","architecture"]),
    "archiver.html": ("synergy-ecosystem-26.css", "archiver-status-26.js", ["matrix","stat-files","stat-ratio","stat-saved","zone-compress","file-compress","btn-compress","progress-compress","logs-compress","zone-decompress","file-decompress","btn-decompress","progress-decompress","logs-decompress"]),
    "ecosystem/architecture.html": ("synergy-ecosystem-26.css", None, ["layers","groups","security"]),
    "smm/workspaces.html": ("smm26-workspace.css", "mission-v93.js", ["s93-title","s93-refresh","s93-gateway","s93-operator","s93-team","s93-catalog","s93-last"]),
    "smm/studio.html": ("smm26-workspace.css", "studio.js", ["app","nav","menu-btn","crumb","auth-state","auth-form","view-welcome","view-leads","leads-form","view-queries","view-catalog","toast"]),
    "smm/lead-radar.html": ("smm26-workspace.css", "workspace-pro.js", ["auth-status","login-area","auth-form","radar-form","radar-results","queries-form","bm25-form"]),
    "smm/ai-studio.html": ("smm26-workspace.css", "workspace-pro.js", ["auth-status","login-area","auth-form","ai-form","ai-results","competitor-form","timing-form"]),
    "smm/caseflow.html": ("smm26-workspace.css", "caseflow.js", ["api-state","auth-panel","login-form","intake-form","case-list","detail-panel","review-form","draft-form","audit-log"]),
    "smm/parsing.html": ("smm26-data.css", "p13-parsing.js", ["content","auth-indicator","feedback","login-needed","workspace","import-form","audience-list","compare-form"]),
    "smm/engagement.html": ("smm26-data.css", "p13-engagement.js", ["content","auth-indicator","feedback","workspace","inbox-list","pub-preview-form","pub-confirm-form"]),
    "smm/audiences-team.html": ("smm26-data.css", "audiences-team.js", ["content","auth-indicator","cohort-form","cohort-list","compare-form","compare-result"]),
    "smm/caseflow-team.html": ("smm26-data.css", "caseflow-team.js", ["content","api-health","login-form","bootstrap-form","workspace","intake-form","cases-list","consent-form","draft-form"]),
    "smm/jobs.html": ("smm26-jobs.css", "jobs.js", ["auth-status","login-form","v7-form","tg-form","vk-form","refresh-jobs","job-rows"]),
    "smm/vk.html": ("smm26-platform.css", None, ["vk-check","resultBox","copyResultBtn"]),
    "smm/telegram.html": ("smm26-platform.css", None, ["tg-check","resultBox","copyResultBtn"]),
    "smm/instagram.html": ("smm26-platform.css", None, ["meta-check","resultBox","copyResultBtn"]),
    "smm/max.html": ("smm26-platform.css", None, ["max-connect","resultBox","copyResultBtn"]),
    "smm/threads.html": ("smm26-platform.css", None, ["threads-about","resultBox","copyResultBtn"]),
    "smm/ok.html": ("smm26-platform.css", None, ["ok-check","resultBox","copyResultBtn"]),
    "smm/tiktok.html": ("smm26-platform.css", None, ["tiktok-about","resultBox","copyResultBtn"]),
    "smm/signal.html": ("smm26-platform.css", None, ["signal-about","resultBox","copyResultBtn"]),
    "smm/zen.html": ("smm26-platform.css", None, ["zen-check","resultBox","copyResultBtn"]),
    "smm/cabinet.html": ("smm-cabinet-simple.css", "smm-cabinet-simple.js", ["navUserBlock","sideNav","sideSearch","dashboard","loginForm","ai-chat","aiChatInput","aiChatSend"]),
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
        if not any(s.split('?')[0].endswith('/'+css) or s.split('?')[0] == css for s in p.styles):
            errors.append(f'{file}: missing native stylesheet {css}')
        if js and not any(x == js or x.endswith('/'+js) for x in p.scripts):
            errors.append(f'{file}: missing original {js}')
        for stylesheet in p.styles:
            if 'synergy-premium' in stylesheet or 'synergy-atelier' in stylesheet or 'synergy-stability' in stylesheet:
                errors.append(f'{file}: obsolete cascade {stylesheet}')
        if not any(((ROOT/file).parent / x.split('?')[0]).is_file() for x in p.styles if x.split('?')[0].endswith('/'+css) or x.split('?')[0] == css):
            errors.append(f'{file}: required CSS file absent')
        if js and not any(((ROOT/file).parent / x).is_file() for x in p.scripts if x == js or x.endswith('/'+js)):
            errors.append(f'{file}: original JS file absent')
        logo = '../assets/synergy-logo.webp'
        if not any(x in page.read_text(encoding='utf-8') for x in ('../assets/synergy-logo.webp','assets/synergy-logo.webp')):
            errors.append(f'{file}: corporate logo missing')
        if file != 'smm/index.html' and not any(link.startswith('../portal/') or link.startswith('portal/') for link in p.links):
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
