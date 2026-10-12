# On-page SEO

结论：37 个正式页面 TDH 完整、唯一；没有标题/描述长度、heading 或正文静态可读问题。

审计日期：2026-10-12（Asia/Shanghai）。对象：Cloudflare Pages 静态导出 `site/out`，对照 `.generated/content-index.json` 的 37 条正式路由。此处不把本地 Next 开发服务器作为生产 SSR 运行面。

## 已核验

- 每页恰好一个 HTML title、meta description、H1；title 50–59 字符，description 150–160 字符。
- Title、description、H1 均无跨正式页面重复。H1 与对应 route.title 一致，层级没有 H1→H3 等跳级。
- 26 篇攻略的正文在初始 HTML 中完整存在；不是靠 JavaScript 取回正文。
- 图片都有 alt 属性。首页两套循环卡片形成的重复节点不当作新增文章或重复标题页面。
- 四政策完整公开邮箱文本，并明确独立资料站；未声称亲测或开发商身份。

| 页面 | Title 字符 | Description 字符 | H1 数 |
| --- | ---: | ---: | ---: |
| / | 55 | 157 | 1 |
| /review | 53 | 154 | 1 |
| /guide | 55 | 158 | 1 |
| /maps | 53 | 157 | 1 |
| /story | 54 | 155 | 1 |
| /walkthrough | 56 | 156 | 1 |
| /characters | 57 | 156 | 1 |
| /about | 55 | 158 | 1 |
| /contact | 56 | 158 | 1 |
| /guide/forever-ago-achievements | 53 | 156 | 1 |
| /characters/forever-ago-audrey-story | 53 | 157 | 1 |
| /guide/forever-ago-camera-achievements | 56 | 151 | 1 |
| /guide/forever-ago-camera-controls | 52 | 150 | 1 |
| /maps/forever-ago-chapter-1-photos | 53 | 156 | 1 |
| /maps/forever-ago-chapter-2-photos | 53 | 158 | 1 |
| /maps/forever-ago-chapter-3-photos | 53 | 153 | 1 |
| /guide/forever-ago-chapter-select | 51 | 152 | 1 |
| /guide/forever-ago-checkpoint-save | 52 | 155 | 1 |
| /guide/forever-ago-collectibles | 53 | 151 | 1 |
| /walkthrough/forever-ago-dog-photo | 50 | 158 | 1 |
| /story/forever-ago-ending-explained | 53 | 155 | 1 |
| /review/forever-ago-game-length | 52 | 159 | 1 |
| /guide/forever-ago-gameplay | 50 | 160 | 1 |
| /guide/forever-ago-hidden-achievements | 56 | 156 | 1 |
| /guide/forever-ago-journal-photos | 51 | 153 | 1 |
| /maps/forever-ago-memory-locations | 53 | 154 | 1 |
| /guide/forever-ago-missable-achievements | 58 | 153 | 1 |
| /guide/forever-ago-old-bones-achievement | 58 | 152 | 1 |
| /guide/forever-ago-petal-collector-achievement | 59 | 155 | 1 |
| /maps/forever-ago-petal-locations | 52 | 153 | 1 |
| /maps/forever-ago-photo-locations | 52 | 157 | 1 |
| /walkthrough/forever-ago-photo-puzzle | 53 | 150 | 1 |
| /review/forever-ago-review | 54 | 157 | 1 |
| /guide/forever-ago-selfie-achievement | 55 | 152 | 1 |
| /walkthrough/forever-ago-williamina-peak | 52 | 153 | 1 |
| /privacy | 58 | 160 | 1 |
| /terms | 57 | 158 | 1 |

## 证据与边界

- [首页 HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/index.html)、[相机控制 HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/guide/forever-ago-camera-controls.html)、[关于页面 HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/about.html)。
- SEO owning source：[metadata.ts](/Users/jiangchenxiang/Desktop/产品/forever ago/site/src/seo/metadata.ts:15)；输入为 [文章 site-spec](/Users/jiangchenxiang/Desktop/产品/forever ago/site/site-spec/en/pages.json) 和 [首页 site-spec](/Users/jiangchenxiang/Desktop/产品/forever ago/site/site-spec/en/home.json)。
- 长度是本建站包的输入规范，不代表 Google 保证按同样长度展示；唯一 TDH 也不证明不同攻略意图已完全消除重叠。
- 禁 JS Chromium 已实际检查 37/37 页面：H1 可见、main 正文可读取，26 攻略正文最少 1,561 英文词。首页面 FAQ 的无 JS 展开限制见 technical.md；没有字段 CWV、排名或索引结论。
