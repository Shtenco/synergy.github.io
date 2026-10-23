# SYNERGY AI ECOSYSTEM — GitHub Pages

Public site: https://shtenco.github.io/synergy.github.io/

V9.7 ecosystem navigation: https://shtenco.github.io/synergy.github.io/ecosystem/

The original SINERGYCHAIN landing page is preserved. The ecosystem route links to existing public frontend modules. It is not evidence that their backend functions are deployed.

## Architecture and deployment status

- Public static frontend: GitHub Pages workflow in `.github/workflows/pages.yml`.
- API: FastAPI/Uvicorn V9.7 source exists in the separately supplied 529-file archive; a production API deployment has **not** been confirmed.
- Identity: OIDC authorization code + PKCE and MFA enforcement are present in V9.7 source, but external IdP and shared session storage are not confirmed live.
- Browser E2E: Playwright CI included in archive, successful GitHub Actions run **not** confirmed.
- Legacy SMM: 144 schemas described; 0 independently accepted full end-to-end migrations. Unsafe/unverified execution must remain disabled.
- Database, workers, authorization and secret management require separately provisioned backend infrastructure. **Never put production secrets, credential files, or .env values in this public repository.**

## Release boundaries

The navigational portal published here does **not** constitute a full deployment of the V9.7 backend or full import of its 529-file source archive. Publish backend source and release artifacts only after secret scanning and a review of public/private IP and data exposure.

Copyright  2026 Evgeniy Koshtenko. All rights reserved.
