#!/usr/bin/env python3
"""Static homepage capital-model contract and safety audit."""
from html.parser import HTMLParser
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
class Parser(HTMLParser):
 def __init__(self): super().__init__(); self.ids=set(); self.links=[]; self.scripts=[]
 def handle_starttag(self, tag, attrs):
  a=dict(attrs)
  if "id" in a:
   if a["id"] in self.ids: raise ValueError("duplicate ID "+a["id"])
   self.ids.add(a["id"])
  if tag=="a" and "href" in a:self.links.append(a["href"])
  if tag=="script" and "src" in a:self.scripts.append(a["src"])
p=Parser();home=(ROOT/"index.html").read_text(encoding="utf-8");p.feed(home)
required={"capital-formula","capital-model","cp-income","cp-expenses","cp-reserve","cp-share","cp-years","cp-return","cp-total","cp-delta","cp-monthly"}
assert required<=p.ids, sorted(required-p.ids)
assert "SYNERGY AI BLOCKCHAIN ECOSYSTEM" in home
assert "ИИ БЛОКЧЕЙН ЭКОСИСТЕМА СИНЕРГИЯ" in home
assert "assets/synergy-capital-model.js" in p.scripts
assert (ROOT/"assets/synergy-capital-model.js").is_file()
assert all((ROOT/x).exists() for x in ["workspace/index.html","avito/index.html","meta-api/index.html","cfo/index.html","riskguard/index.html","investor-folio/index.html"])
js=(ROOT/"assets/synergy-capital-model.js").read_text(encoding="utf-8")
assert "fetch(" not in js and "localStorage" not in js and "eval(" not in js
assert "monthlyContribution" in js and "Math.pow" in js and "months" in js
print("CAPITAL HOMEPAGE CONTRACT: PASS")
