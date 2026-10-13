# Independent code review — 2026-10-13

Scope: uncommitted changes relative to `e1fec18`, including untracked completion feature, search, release tests and preview server. Read site AGENTS.md, requesting-code-review and Vercel React review instructions. No source file was edited and no build was started.

## Important: failed writes lose visit progress on guide navigation

`src/features/forever-ago/completion-store.ts:16,22,29-30`: a failed `setItem` retains the new progress in memory, but the next first subscription calls `loadSavedCompletion()` again. If reads still work, the old saved progress replaces the unsaved visit progress and status changes to `saved`.

Reproduced on the static export at port 3189 in a separate browser context: make only the completion key's `Storage.prototype.setItem` throw `QuotaExceededError`; mark `rest-forecourt`; observe checked + saving unavailable; click its real Step-by-step guide Next Link to Old Bones; observe unchecked + Progress saved on this browser. This contradicts the visit-use fallback and loses the temporary checklist before a backup can be exported. Existing denial coverage throws from the localStorage getter, so it does not cover this readable-storage/failed-write case. Preserve unsaved visit state across route subscription changes and cover this route transition.

## Other checks

- 53 task records comprise 29 achievements, 7 memories, 6 rests and 11 photo tasks. Memory stages, task type/status/road-stop filters, server-readable tasks and exact heading links are implemented.
- Navigation and search entries derive from the content index; seven configured groups contain direct article links. Policy ad-mode verifier change matches actual shell behavior rather than weakening production content validation.
- Independently exercised nonempty mobile search Escape and focus return, drawer-to-search shortcut, backup JSON download, invalid JSON preservation, restore cancellation and confirmed restore replacement. These passed.
- Source review found no additional actionable Critical or Minor defect in the reviewed changes. React external-store/server snapshot use and local-storage envelope validation are appropriate.

Limits: this review does not certify the parent release suite's reported pass counts. It did not independently replay the game, verify all source facts or production ad fill, indexing, ranking, field CWV or revenue. Supplier requests in integration tests are mocked; they verify loader attempts only.

## Resolution verified

The failed-write defect is fixed: `loadSavedCompletion` preserves the current visit snapshot while saving is unavailable. A separate source review confirmed that normal saved-state synchronization, damaged-save protection and explicit restore/reset still work. The real-link regression failed against the old export and passed against the repaired export. The final release suite passed all 18 tests, including storage denial, readable storage with failed writes, cross-guide and cross-tab progress, ordered vignette stages and reset cancellation/confirmation.

## Final media review

The independent reviewer checked the AVIF files, registered width descriptors, picture layout, static-export compatibility, cross-site behavior and source validation. Initial missing-file and cross-site-ID assumptions were repaired before release: six real files are committed, rendering uses registered avifSources and read-site rejects missing derivatives. No remaining release-blocking issue was found in the final media/font diff. The reviewer did not run the parent tests or claim independent production fill verification.

## Configured-template loader review

The independent reviewer checked all nine runtime layouts, home/category and category landing routes, every enabled language, and record-backed articles. Build records enable BuildDetail using the same condition as rendering; other record-backed articles keep ArticlePage. Paths are fixed and unused imports are type-only. No missing supported layout or release-blocking issue was found. The production export measured 165,116 to 124,267 CSS bytes; parent regression checks passed 466 unit tests and 18 E2E.
