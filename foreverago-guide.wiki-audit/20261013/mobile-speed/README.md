# Mobile performance optimization — 2026-10-13

The original public mobile PageSpeed report scored 44, with FCP 7.2 s, LCP 10.8 s, TBT 570 ms and CLS 0. Its YouTube player downloaded about 974 KiB and used 737 ms of main-thread time, including 529 KiB of unused player JavaScript. The first-view iframe was loaded despite `loading="lazy"`.

Original report: https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki/xnmk4oh369?form_factor=mobile

## Change

The official trailer now initially displays its real YouTube thumbnail and an accessible native play button. Mouse or keyboard activation mounts the privacy-enhanced player and requests playback. No YouTube player scripts or iframe are requested before activation. The video frame keeps its existing dimensions. A no-JavaScript link opens the original video. Analytics, advertising, artwork, theme and guide content are retained.

The six-page integration test exceeded its 180-second limit while waiting for network idle. Its trace includes unfinished background route prefetch requests. A DOM-ready wait experiment did not produce a completed suite result and was withdrawn. Existing integration tests and all their assertions remain unchanged.

## Pre-release measurements

Public preview: https://6c040a0e.foreverago-guide.pages.dev/

PageSpeed preview: https://pagespeed.web.dev/analysis/https-6c040a0e-foreverago-guide-pages-dev/87j4ua3r67?form_factor=mobile

| Metric | Original production | Preview |
| --- | --- | --- |
| Performance | 44 | 86 |
| FCP | 7.2 s | 2.1 s |
| LCP | 10.8 s | 3.5 s |
| TBT | 570 ms | 20 ms |
| CLS | 0 | 0 |

The preview does not start the production-host analytics/ad integrations and Cloudflare marks preview deployments noindex (SEO 69). These scores are not a same-host comparison. Production must be measured separately with the original services active. Preview YouTube transfer is about 13 KiB with 0 ms main-thread work. Neither report contains field Core Web Vitals data.

## Validation boundary

Static export, lint, TypeScript and content validation passed. Content validation covers 43 routes. The 13 video unit tests passed. The new browser regression failed on the old export by observing an immediate player request, then passed after the change; it checks keyboard activation and stable frame dimensions. The broader release run passed 18 checks and timed out in the six-page integration check at network idle. This is not a full release-suite pass.

Broad unit runs were inconclusive: the unchanged site-assembly fixture tests exceeded their explicit 30-second limit, and an environment subprocess test exceeded 60 seconds on retry. A separate scoped broad run also did not complete and was stopped. No production assertion or schema was relaxed. Only the completed 13 video unit tests are claimed as passing; no full-unit-suite pass is claimed.

Local Lighthouse samples are retained as diagnostics only. Their environment and uncompressed local serving differ from public PageSpeed. A clean Lighthouse preview sample recorded no browser console errors; Tabbit's extension-enabled local page emitted React hydration error 418, so its screenshot alone is not a clean-console receipt.
