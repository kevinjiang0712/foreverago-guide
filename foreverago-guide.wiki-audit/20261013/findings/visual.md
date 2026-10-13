# Visual / UX / accessibility audit

Date: 2026-10-13 (Asia/Shanghai). Scope: English Forever Ago site; home, tracker, achievements, navigation and site search.

## Source evidence

- Site search builds its entries from published ContentIndex routes and pages; navbar contains 32 unique guide targets in 7 task groups. Current and new guide IDs are covered without a separately maintained URL list.
- Search uses a native dialog, a named input, explicit close action, Escape cancellation, arrow-key result navigation and focus restoration. Mobile navigation has independent destination links and disclosure controls.
- Fixed in this audit: desktop navigation disclosure width increased from 32px to the shared 44px minimum hit target.
- Theme solid-color contrast: primary/page 15.73:1; secondary/card 9.44:1; caption/card 8.15:1; placeholder/input 8.67:1; button text/accent 7.00:1. These are token-pair calculations, not measurements of text over imagery.
- All 98 registered assets have English alt text. Guide screenshots use body-image asset IDs; homepage uses existing road-trip key art. The new task directories and search do not use screenshots as covers.
- Fixed by completion-tools owner and confirmed in source: task rows now use full borders; completed rows use the existing success token. New semantic headings use heading-size tokens rather than body-size tokens. Runtime/build verification remains pending.
- All 95 registered body images have local files (largest 158,404 bytes; combined 4,301,644 bytes).

## Runtime verification

Verified against the static production export at `http://127.0.0.1:3189/`: home, tracker, achievements and full walkthrough fit 320 / 390 / 768 / 1440 px viewports without document overflow. The release E2E suite exercises mobile disclosure navigation, desktop click/Escape behavior, search result keyboard navigation, nonempty-search Escape and focus return. All 18 release tests passed.

Actual Tabbit desktop-home and mobile-tracker screenshots were inspected. The tracker has 53 readable tasks with a named search field, road-stop/progress filters and type controls. The official homepage launch trailer from remote commit `7b2096c` is preserved. These checks are browser/viewport evidence; they do not establish field CWV or ranking gains.
