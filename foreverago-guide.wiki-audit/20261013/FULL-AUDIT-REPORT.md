# Forever Ago release audit — 2026-10-13

Scope: English site, 43 canonical routes, 32 game guides, 6 categories, 4 policy pages and home. No multilingual expansion. This is an implementation/release audit, not evidence of ranking, indexation or revenue gains.

## Implemented and verified

- Updated 26 existing guides and added 6: completion tracker, full journey walkthrough, Snooping Shutterbug, mosaic pumpkins, Marley's bobblehead and Guardian Lord.
- 53 route-ordered checklist entries: 29 Epic achievements, 7 three-stage vignettes, 6 rests and 11 documented photo tasks. Search, filters, cross-guide/tab persistence, backup/restore, confirmed reset and explicit storage failure handling are implemented.
- All 32 guides have direct navbar entries. Home, category directories and site search expose real content-index destinations.
- Independent TDH, Quick Answers, 128 body ContentLinks and visible source/platform boundaries. Unverified controls and cross-platform behavior remain identified; no personal game testing is claimed.
- Content/theme validation, lint, typecheck and the production static export passed. Unit tests: 465/465. Release E2E: 18/18, 0 skipped, 0 flaky.
- The real-site verifier passed all 43 routes. Separate crawl checked 3,630 internal href occurrences and 518 anchors; sitemap contains exactly 43 unique canonical URLs. JSON-LD: 43 WebPage, 32 Article, 42 Breadcrumb and 6 category ItemList nodes.
- Source, rendered HTML and no-JavaScript content were checked. Tested layouts include 320, 390, 768 and 1440 px; eligible desktop advertising rails are tested at 1920 px.

## Issues fixed

- Nonempty search Escape now closes the dialog and restores focus.
- Select/input labels use separate associated elements; typography follows existing core tokens and disclosures meet the 44 px target.
- A readable-storage/failed-write regression now preserves the current visit's progress when following a real guide link. The regression failed on the old export and passed after repair.
- Old unit fixtures now use the real example records and fixed references from locked template commit `ec8eb1fa`; assertions and production schemas were retained. Worker count is bounded to avoid the observed 50-worker I/O timeouts.
- Remote homepage launch-trailer commit `7b2096c` was integrated and retained.

## Performance and integration boundaries

Local Lighthouse mobile runs: home Performance 69 / Accessibility 100 / Best Practices 96 / SEO 100, LCP 7.41 s, TBT 17 ms, CLS 0.0025; tracker Performance 68 / Accessibility 100 / Best Practices 100 / SEO 100, LCP 7.64 s, TBT 26 ms, CLS 0.0225. Local preview serves uncompressed files; the existing production CDN responds with Brotli. These LCP values are above the target and are not a field-CWV pass. Production measurement and third-party verification are recorded separately after deployment.

Pre-release integration tests use an allowed-host alias with mocked supplier responses. They confirm loaders for GA4 `G-1L7F54XGRR`, Clarity `ywlgmczujj`, Native/mobile anchor and eligible inline/side slots on new routes. They do not establish real supplier fill or collected analytics. Proxy-originated Adsterra 403 is an expected environment result. Real production requests still require the post-deployment check.

Evidence: `findings/`, `lighthouse/`, `screenshots/`; executable release tests in `tests/release/`. Comprehensive health scoring is withheld rather than assigning a score to unmeasured field performance or growth.
