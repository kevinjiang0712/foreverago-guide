# Design system baseline fixtures

Byte-for-byte snapshots from the read-only Game Wiki Design System repository,
commit `ec8eb1fa0a0ceb3749b47c91b661ea713db2effc`, the template revision locked for this site.

The original template packages `tokens/` and `guidelines/` outside the runtime app.
Generated independent sites omit those development reference directories. Tests use
these fixed inputs rather than reading replaceable production content or an external
checkout. These fixtures were retrieved with `git show <locked commit>:<source path>`;
they were not generated from this site's current CSS.

- `tokens/*.css`: original core contracts, used to enforce byte-for-byte retention.
- `guidelines/type-{body,latin}.card.html`: original typography cards, used to preserve
  the token-binding assertions.

Do not refresh these snapshots to silence a regression. An intentional contract
revision must explain why the template revision and expected files changed.
