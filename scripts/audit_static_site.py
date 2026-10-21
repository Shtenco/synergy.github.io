#!/usr/bin/env python3
"""Audit static GitHub Pages content while keeping backend secrets private."""
from __future__ import annotations
import argparse
import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

DENIED_NAMES = {'.env', '.env.local', '.env.production', 'id_rsa', 'credentials.json', 'service-account.json', '.npmrc', '.pypirc'}
DENIED_SUFFIXES = {'.pem', '.p12', '.pfx', '.key', '.sqlite', '.sqlite3', '.db'}

class References(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        for attr in ('href', 'src'):
            if attr in a and tag in ('a', 'link', 'script', 'img', 'source', 'iframe'):
                self.refs.append((tag, attr, a[attr]))

def audit(root: Path) -> dict:
    root = root.resolve()
    errors, warnings = [], []
    for must in ('index.html', 'ecosystem/index.html', '.nojekyll'):
        if not (root / must).is_file():
            errors.append(f'missing required file: {must}')
    htmls = list(root.rglob('*.html'))
    for path in root.rglob('*'):
        if not path.is_file() or '.git' in path.parts:
            continue
        if path.name.lower() in DENIED_NAMES or path.suffix.lower() in DENIED_SUFFIXES:
            errors.append(f'forbidden public file: {path.relative_to(root)}')
    for page in htmls:
        parser = References()
        try:
            parser.feed(page.read_text(encoding='utf-8'))
        except (UnicodeDecodeError, ValueError) as exc:
            errors.append(f'cannot parse {page.relative_to(root)}: {exc}')
            continue
        for tag, attr, ref in parser.refs:
            ref = ref.strip()
            if not ref or ref.startswith(('#', '//', 'mailto:', 'tel:', 'javascript:', 'data:', '{{', '${')):
                continue
            parts = urlsplit(ref)
            if parts.scheme or parts.netloc or not parts.path:
                continue
            dest = unquote(parts.path)
            target = root / dest.lstrip('/') if dest.startswith('/') else page.parent / dest
            target = target.resolve()
            if not target.is_relative_to(root):
                warnings.append(f'{page.relative_to(root)}: outside-root reference {ref}')
                continue
            if target.is_dir():
                target /= 'index.html'
            if not target.is_file():
                warnings.append(f'{page.relative_to(root)}: missing {tag}.{attr}={ref}')
    return {'html_pages': len(htmls), 'errors': sorted(errors), 'warnings': sorted(set(warnings))}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('site_dir', nargs='?', default='.')
    ap.add_argument('--strict-links', action='store_true')
    args = ap.parse_args()
    report = audit(Path(args.site_dir))
    print(json.dumps(report, indent=2, ensure_ascii=False))
    raise SystemExit(bool(report['errors'] or (args.strict_links and report['warnings'])))

if __name__ == '__main__':
    main()
