# BERL Website v5 — Complete Unified Design

This package is the unified BERL website build.

## Included
- Environmental-engineering blue visual system across every page
- 4-second environmental hero slider
- Latest 5 News items linked to `data/news.json`
- 4-second Research carousel with research-specific graphics
- Dropdown navigation
- About / Research / People / Member / Publications / Research Programs / News / Join / Contact / Search / 404 unified
- Facilities removed
- OpenAlex publication synchronization retained
- Formspree contact integration retained
- GitHub Pages / GitHub Actions deployment retained

## Primary editable data
- `data/site.json`
- `data/members.json`
- `data/research.json`
- `data/projects.json`
- `data/news.json`
- `data/manual-publications.json`
- `data/scholar-config.json`

## News behavior
The homepage right panel always shows the newest five items from `data/news.json`, sorted by `date`.

## Images
Research and News currently use lightweight SVG graphics included in `assets/images/`.
Replace an `image` field in JSON with a real photo path later if desired.

## Deployment
`.github/workflows/deploy-pages.yml` deploys the site and refreshes OpenAlex publication data.

## Restore note
The BERL website was restored to the pre-United redesign version on 2026-08-29.
