# Mobile performance optimization — 2026-10-13

The original public mobile PageSpeed report scored 44, with FCP 7.2 s, LCP 10.8 s, TBT 570 ms and CLS 0. Its YouTube player downloaded about 974 KiB and used 737 ms of main-thread time, including 529 KiB of unused player JavaScript. The first-view iframe was loaded despite `loading="lazy"`.

Original report: https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki/xnmk4oh369?form_factor=mobile

## Change

The official trailer now initially displays its real YouTube thumbnail and an accessible native play button. Mouse or keyboard activation mounts the privacy-enhanced player and requests playback. No YouTube player scripts or iframe are requested before activation. The video frame keeps its existing dimensions. A no-JavaScript link opens the original video. Analytics, advertising, artwork, theme and guide content are retained.

The actual Figtree 600 face used by the first-view eyebrow and action buttons is also preloaded. Its old request depended on the stylesheet; the first production retest's critical chain reached this font at 945 ms. Computed browser styles confirmed weight 600 for these first-view elements. Other font weights and typography are unchanged.

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

## First production retest

Application commit `a626472`, deployment https://4ccccc89.foreverago-guide.pages.dev.

Public report: https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki/k3jnu4pajj?form_factor=mobile

Performance 64; FCP 2.4 s; LCP 7.7 s; TBT 270 ms; CLS 0; Accessibility 100; Best Practices 96; SEO 100. This is the production host with its services active, not the preview score of 86. YouTube transfer is 13 KiB / 0 ms main-thread time. GA4 and Clarity collectors appear in the public report; the independent Tabbit collector-response wait did not obtain a receipt within 20 seconds. Its page state confirmed both loader scripts/functions, the ad loader, no initial player and no mobile overflow. Ad supplier `bauval.org` returned HTTP 402 in the PageSpeed test, accounting for the console warning.

All 43 production routes returned 200, with titles and stylesheet references matching the tested export. The `sameHtml` string flags in this initial receipt were false and are not used as a release assertion. A direct comparison confirmed that Cloudflare adds its beacon script for the verification user agent, while the curl homepage capture matches export bytes exactly. LCP remains above 2.5 seconds and no field-CWV pass is claimed.

## Font follow-up validation

The final static export compiled, type-checked and built successfully. The Figtree 600 preload has `as=font`, WOFF2 type and anonymous crossorigin, and its real local file exists. The updated real-browser trailer regression passed, including the preload assertion, no initial player request, keyboard activation and stable dimensions. All earlier broad-suite limitations above remain applicable.
