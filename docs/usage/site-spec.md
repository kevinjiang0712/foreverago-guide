# V1 建站包

建站包是新站唯一需要人工维护的输入。先在母模板**之外**创建新目录，在其中放置 `site-spec/`；AI 只负责把已经定稿、已校对的内容整理成下述 JSON、普通 Markdown 和本地素材。生成脚本不调用 AI、不研究游戏、不补写缺失内容、不部署。

```text
new-game-site/
  site-spec/
    site.json
    theme.json
    ads.json                # 可选；目标站广告配置，省略则禁用
    categories.json
    assets.json
    media/                  # 图片、Logo、WOFF2 字体
    en/
      categories.json
      home.json
      characters.json
      pages.json            # 有序文章元数据数组
      pages/<article-id>.md # 与 pages.json 一一对应
      policies/about.json + about.md
      policies/contact.json + contact.md
      policies/privacy.json + privacy.md
      policies/terms.json + terms.md
```

在**母模板**运行：

```bash
npm run assemble:site -- --target /absolute/path/to/new-game-site
```

首次创建只复制母模板当前 Git `HEAD` 的已提交快照，所以实现本脚本的提交完成前不能用它创建正式新站。目标目录可已有研究文件和 `site-spec/`；遇到同名框架文件就报错，不覆盖。新站拥有自己的 Git 仓库。再次运行只重新生成 `config/`、`content/`、`public/media/`，发现这些生成文件被手工改过就报错；自行修改的 `src/`、`scripts/` 不会被覆盖。先在隔离临时目录完成输入、内容索引与主题校验，再安装到目标站。生成不自动提交、安装依赖、构建或发布。

## 字段契约

所有 JSON 对象拒绝未知字段；缺字段不继承模板默认值。下列长度按去除首尾空白后的 Unicode 字符数计算，空格和标点计数；必填短文案不得手工换行或带首尾空白。`null` 仅用于明确标注可关闭/未知的字段。真正的判定以 [`scripts/site-spec.ts`](../../scripts/site-spec.ts) 与 [`scripts/site-spec-load.ts`](../../scripts/site-spec-load.ts) 为准，错误会给出文件、字段、实际值和规则。

| 文件 | 必填内容 |
| --- | --- |
| `site.json` | `siteId`；HTTPS 站点根地址 `siteUrl`；`defaultLocale:"en"`、`locales:["en"]`；`gameName` 1–40；`logoAssetId`；`officialLinks` 四项 `official/steam/discord/youtube`，各为 HTTPS 或 `null`；`navigation.en` 4–8 个一级菜单，各含 `label`、`target`、`children`（0–10 个二级项）；`contactEmail` 邮箱或 `null`；`effectiveDate`；`footerDescription` 40–50；`defaultDescription`。品牌/H1 固定为“游戏全名 + Wiki”。一级标签 2–14、二级 2–28。 |
| `categories.json` | 有序数组，每项 `id`、独立填写的 `slug`、非负整数 `order`。分类路由总会生成。分类少于 3 条文章/角色时，一级菜单不可点击，必须给它二级入口。 |
| `en/categories.json` | 每个分类 ID 一项，含 `title` 1–40、`description` 30–100、完整 `seo`。 |
| `assets.json` | 每张图一个 `id`、`file`（`media/` 内相对路径，JPG/PNG/WebP；仅 Logo 可 SVG）、`alt` 1–120 或仅 Logo 可 `null`；可选百分比 `position`。输入不校验像素尺寸或比例；会解码检查并登记尺寸，JPG/PNG 输出 WebP。 |
| `theme.json` | `defaultMode` 为 `day`/`night`；`common` 只写 `--font-display`、`--font-ui`、`--display-weight`、`--radius`、`--radius-lg`、`--radius-chip`；`fonts` 数组写本地 `/media/*.woff2` 的 `family/src/weight/style`；`day` 和 `night` 各显式填写下列 36 个颜色令牌。每个色值须与模板相应色值不同，不能靠继承或留空。布局、间距、动效不可配置。 |
| `en/home.json` | `description` 50–100、完整 `seo`；`hero`、`featured`、`about`、`articleFloors`、`characterSpotlight`、`weaponShowcase`、`faq`，见下文。 |
| `en/characters.json` | 角色数组；每项 `id`、`categoryId`、`name` 1–24、`role` 1–18、`summary` 50–100、`avatarId`、`articleId` 或 `null`。首页角色楼层与列表页共用这份记录。 |
| `en/pages.json` | 至少 8 篇有序文章。每项 `id`、`slug`、`category`、`h1` 1–40、`description` 1–100、`card:{title(12–28),description(50–60),image}`、`heroImage`、`quickAnswer`（1–4 段，总长 120–250）、完整 `seo`、`authorName/publishedAt/updatedAt/gameVersion`（各可 `null`）。同 ID 的 `.md` 必须存在。 |
| `en/policies/<id>.json` | `about/contact/privacy/terms` 四页各有 `h1` 1–40、`description` 1–100、`heroImage` 或 `null`、完整 `seo`；同名 `.md` 必须存在。 |

所有 `seo` 都必须显式写 `{ "title": 50–60 字符, "description": 150–160 字符, "image": 素材 ID 或 null, "noindex": true/false }`。SEO Title 是完整最终标题，不自动追加站名；H1 与卡片标题独立填写。引用的 ID、路由、图片必须存在，ID、slug 和路径不能冲突。详情页的相关文章由脚本按“同分类后续→同分类之前→其他分类顺序”补足恰好 3 篇，无须填字段。

### 首页对象

| 字段 | 必填结构与限制 |
| --- | --- |
| `hero` | `eyebrow` 3–18、`description` 50–60、`assetId`；`video` 为 `{url:YouTube HTTPS,title:1–120}` 或 `null`，不上传封面；`stats` 为 `null` 或恰好 4 项 `{label:3–26,value:1–20 或 null}`；`cta` 恰好两个 `{label:8–18,target}`。 |
| `featured` | `eyebrow` 3–18、`title` 8–30、`description` 50–60、`articleIds` 恰好 6 个不同的文章 ID。 |
| `about` | `eyebrow` 3–18、`title` 8–30、`paragraph` 一段 140–160、`facts` 恰好 6 项 `{label:1–12,value:1–30 或 null}`。 |
| `articleFloors` | 可以是 `[]`；每层 `{id,eyebrow:3–18,title:8–30,description:50–70,articleIds}`，恰好 8 篇不同文章。顺序即首页顺序，不根据分类自动挑选。 |
| `characterSpotlight` | `null` 关闭，或 `{eyebrow:3–18,title:8–30,description:50–70,characterIds}`，恰好 3 个不同且存在的角色 ID。 |
| `weaponShowcase` | `null` 关闭，或 `{eyebrow:3–18,title:8–30,description:50–70,imageIds,categoryId,ariaLabel}`。必须 16 个不同图片文件；脚本生成 4×4 透明底 sprite，图片等比放入格子，不拉伸。 |
| `faq` | `eyebrow` 3–18、`title` 8–30、`description` 50–60、`items` 恰好 4 组 `{question:25–40,answer:80–200}`，答案为单段纯文本。 |

`target` 统一使用 `{ "type":"home" }`、`{ "type":"category","id":"..." }`、`{ "type":"content","id":"..." }`、`{ "type":"official","id":"..." }` 或 `{ "type":"external","url":"https://..." }`。未提供的外部链接写 `null`，不要伪造链接。

### 主题的 36 个颜色令牌

`--surface-page`, `--surface-alt`, `--surface-card`, `--surface-card-hover`, `--surface-well`, `--surface-input`, `--surface-disabled`; `--text-primary`, `--text-secondary`, `--text-caption`, `--text-on-accent`, `--text-disabled`; `--border-default`, `--border-soft`, `--border-hover`, `--border-on-media`, `--placeholder-border`; `--accent`, `--accent-hover`, `--accent-press`, `--accent-text`, `--marker`, `--marker-soft`; `--ok`, `--warn`, `--danger`, `--focus-ring`, `--shadow-card`, `--state-ghost-hover`, `--state-row-hover`; `--veil-hero`, `--veil-vignette`, `--scrim-nav`, `--scrim-drawer`, `--rule-marker`, `--sweep-highlight`。字体全部在本地提供时，生成页面不再导入模板的 Google Fonts。

### 正文 Markdown

正文只写普通 Markdown，可用 H2/H3、列表、表格、引用、代码块。H3 必须跟在 H2 后；不要写 H1、HTML、JSX 或 JavaScript。内部链接用 `[文字](content:文章ID)`、`[文字](category:分类ID)`；外链必须 HTTPS。图片独占一段，写 `![替代文字](asset:素材ID)`。独占一段的 YouTube 链接会转为现有视频卡片，无须封面。模板会固定生成 `demo:false`、`verification:confirmed`，建站包不填 `demo`、`sources` 或 `verification`。

单元测试中的 [`site-spec-assemble.test.ts`](../../tests/unit/site-spec-assemble.test.ts) 会在临时目录创建一份完整虚构包，执行首次生成、重复生成与人工修改保护；它仅作格式/程序测试，不能作为真实游戏内容发布。

## Builds、Mods 与数据库

专用布局、数据契约、建站包目录与验收要求见 [结构化页面](structured-pages.md)。

## 广告配置

可选 `site-spec/ads.json` 由 `src/content/schemas/ads.ts` 严格校验，生成并在再生成时保留到 `config/ads.json`；不能直接编辑生成文件。广告位置和代码字段见[广告接入契约](advertising.md)。
