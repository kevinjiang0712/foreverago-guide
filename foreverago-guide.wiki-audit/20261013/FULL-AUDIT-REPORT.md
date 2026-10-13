# Forever Ago release audit — 2026-10-13

Scope: English site, 43 canonical routes, 32 game guides, 6 categories, 4 policy pages and home. No multilingual expansion. This is an implementation/release audit, not evidence of ranking, indexation or revenue gains.

## Implemented and verified

- Updated 26 existing guides and added 6: completion tracker, full journey walkthrough, Snooping Shutterbug, mosaic pumpkins, Marley's bobblehead and Guardian Lord.
- 53 route-ordered checklist entries: 29 Epic achievements, 7 three-stage vignettes, 6 rests and 11 documented photo tasks. Search, filters, cross-guide/tab persistence, backup/restore, confirmed reset and explicit storage failure handling are implemented.
- All 32 guides have direct navbar entries. Home, category directories and site search expose real content-index destinations.
- Independent TDH, Quick Answers, 128 body ContentLinks and visible source/platform boundaries. Unverified controls and cross-platform behavior remain identified; no personal game testing is claimed.
- Content/theme validation, lint, typecheck and the production static export passed. Unit tests: 466/466. Release E2E: 18/18, 0 skipped, 0 flaky.
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

Pre-release integration tests use an allowed-host alias with mocked supplier responses. They confirm loaders for GA4 `G-1L7F54XGRR`, Clarity `ywlgmczujj`, Native/mobile anchor and eligible inline/side slots on new routes. They do not establish real supplier fill or collected analytics. Proxy-originated Adsterra 403 is an expected environment result. The first production check received GA4 and Clarity collect 204 on all six new routes, with expected Adsterra 403 responses for mobile units and both eligible desktop rails. Final-release receipts are recorded alongside the initial check.

Evidence: `findings/`, `lighthouse/`, `screenshots/`; executable release tests in `tests/release/`. Comprehensive health scoring is withheld rather than assigning a score to unmeasured field performance or growth.

## Production release

Application commits: `c2ce184` (guide/tool improvements), `af4a2ee` (responsive AVIF art, font preloads and missing-source validation), and `66211f7` (configured template imports). Current production deployment: https://11fb8473.foreverago-guide.pages.dev, verified as Cloudflare Production / main / 66211f7. All 43 production HTML routes exactly match the tested static export; sitemap matches with 43 URLs, unknown routes return 404 and the bare domain redirects 301 to www. All six AVIF files respond 200 with image/avif. Original promotional artwork and crop positions remain intact.

Ordinary dynamic-import experiments did not reduce CSS and were withdrawn. Build-time imports selected from the real content index reduced CSS from 165,116 to 124,267 bytes (24.7%). All nine supported layouts retain typed loaders; current Forever Ago pages use home, list and article layouts. Responsive sources use registered metadata; other sites do not infer derivatives from matching asset IDs. Final regression: 466 unit tests, 18 E2E (0 skipped, 0 flaky), lint, TypeScript and static export passed.

## Final mobile lab result

| Page | Performance | Accessibility | Best Practices | SEO | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- | --- | --- |
| home | 63 | 100 | 73 | 100 | 6.60 s | 75.5 ms | 0.0008 |
| tracker | 66 | 100 | 73 | 100 | 6.07 s | 139.5 ms | 0.0005 |

These are Lighthouse simulated mobile results in the current proxy environment, not field CWV. LCP remains above 2.5 s; this release does not claim a performance/CWV pass. Removing unused CSS and reducing image bytes did not by themselves resolve the simulated first-render delay. Best Practices warnings include supplier 403 responses and third-party cookies. No ad-fill, revenue, indexation or ranking gain is asserted.

All six new pages received real GA4 and Clarity collect 204 on release af4a2ee. The configured-template release passed the same six-page loader E2E again, and a real production tracker check confirmed 53 rendered tasks, both collectors returning 204, no mobile overflow and the new two-stylesheet build. The 43-route production export comparison passed after the final application deployment.
