# 模板与内容模块字段

这是给内容作者和 AI 的填写说明。实际必需字段以 `src/content/schemas/` 为准；先复制同模板的完整样例，再替换资料，不自行发明字段。

## 游戏全名与品牌显示

每种语言只在 `content/locales/<locale>.json` 填写 `game.name`，值为游戏全名，不附加站点后缀。去除首尾空白后按 Unicode 码点计数，要求 1–40 字符，内部空格和标点计入；不允许换行，缺失、空值或超长直接报错。

框架统一生成「游戏全名 + Wiki」，最长 45 字符，供首页 H1、页头、移动菜单、页尾及站点名称元数据使用。不再接受 `siteName`、`siteSuffix`、`brand.separator` 或首页 `hero.title` 输入，不自动缩写游戏名。政策页的 `gameName` 变量也读取当前语言的 `game.name`，不再填写 `policies.gameName`。

页头与移动菜单保持单行和既有字号，宽度不足显示省略号；桌面也预留导航空间。省略仅影响视觉，链接的完整文本、可访问名称和悬停提示均保留。首页 H1 与页尾可以换行。40 字符是输入上限，不保证所有字形都能单行完整显示。

## 顶部导航

导航只读取 `config/site.json` 的 `navigation.<locale>`，各语言显式配置，不自动追加分类，不从分类名或文章标题回退取标签。内部网址仍由统一内容索引解析；Footer 的 Navigation 栏复用同一份一级导航。

| 字段 | 约束 |
|---|---|
| `navigation.<locale>` | 每种启用语言必须填写，一级菜单 4–8 项，数组顺序即展示顺序 |
| `label` | 独立短标签；英文一级 2–14 字符，二级 2–28 字符 |
| `target` | 显式填写 home / category / content / official / external 类型及对应 ID 或 URL |
| `children` | 必填数组；无下拉菜单填 `[]`，每组最多 10 项，只支持一层子菜单 |

长度按去除首尾空白后的 Unicode 字符数计算，内部空格和标点计入；禁止换行，不截断。英文范围不直接套用到其他语言，其他语言仍要求非空、单行。菜单语言必须与 `locales` 一致，不跨语言补标签或补文章。文章目标必须在对应语言已发布，预览模式也不允许导航引用草稿；同一菜单内禁止重复目标。

以下是英文菜单中的单项示例（完整 `navigation.en` 仍须有 4–8 项）：

```json
{
  "label": "Guides",
  "target": {"type": "category", "id": "guides"},
  "children": [
    {"label": "Getting started", "target": {"type": "content", "id": "first-steps"}}
  ]
}
```

旧版 `navigation: [target, ...]` 与 `config/categories.json` 的 `submenu` 不再接受；迁移时显式填写上述结构。分类的 `navigation` 标记仍供首页分类发现逻辑使用，不再决定顶部菜单。桌面超宽时保留左右滚动，下拉菜单过高时纵向滚动，手机沿用菜单抽屉；不改变字号来强行塞满。

## 所有内页共用

每篇文章保存为 `content/<locale>/pages/<文件名>.mdx`。网址取决于分类 slug 与 frontmatter 的 slug，文件名不负责生成网址。

| 字段 | 用途 |
|---|---|
| id | 跨语言不变的内容 ID，小写字母开头，只用小写字母、数字和连字符 |
| locale | 必须与文件所在语言目录一致，且在站点配置中启用 |
| slug | 一个网址片段；可本地化，不含斜杠 |
| category | config/categories.json 中的 ID；独立根页面使用 `_pages` |
| template | 本文列出的内容类型键；布局按实际页面布局清单选择 |
| title、description | 当前页面独立标题和描述，不能为空 |
| status | draft / published / archived；正式可访问与收录由框架统一判断 |
| demo、verification | 是否演示内容，以及 confirmed / partial / unverified；不是同一个概念 |
| records | 本页使用的同语言 JSON 记录 ID |
| assets | 素材槽名称到素材 ID 的映射，常见 `hero` |
| related、previous、next | 已存在内容 ID；未指定上下篇时由同分类索引排序派生 |
| order | 可选排序数值；不填则按已提供日期和稳定 ID 排序 |
| publishedAt、updatedAt | 可选真实 YYYY-MM-DD 日期；缺失就省略，不填构建时间 |
| seo | 可选标题、描述、分享图和 noindex；显式 image:null 禁止分享图回退 |
| author、gameVersion | 可选真实作者和适用游戏版本；未知不填 |

JSON 记录保存到 `content/<locale>/records/`，包含 id、locale、type、demo、verification；不填写 `sources`。
实体、文章和素材通过 ID 关联。展示标题可以改，ID 不随翻译或改标题而变化。

素材统一登记在 `content/assets.json`：id、src、width、height、purpose、各语言 alt、position、demo。
`src:null` 表示没有真实图片。文章页的可选封面、图集、立绘和图标不显示空图槽；列表页同样只显示真实图片，工具模板仍保留原占位规则；真实图片放在 `public/media`，src 使用 `/media/…`。
未知数字用 null，不用 0；无详情页用 null，不链接到无关页面。

## 内页 Hero 尺寸规范

所有内页使用 `src/components/content/inner-hero.css`，模板不再单独设置 Hero 高度、标题字号或上下留白。高度从导航栏底部计算，不包含导航栏；首页不使用这套尺寸。

| 项目 | 桌面 ≥1024px | 平板 768–1023px | 手机 <768px |
|---|---|---|---|
| 列表 / 工具 Hero 最小高度 | 320px | 280px | 240px |
| 文章 Hero 最小高度 | 560px | 内容自适应 | 内容自适应 |
| 上下内边距 | 40px | 40px | 24px |
| H1 字号 | `clamp(34px,5.6vw,60px)`，上限 60px | 同一流体令牌 | 同一流体令牌，下限 34px |

- 面包屑到标题区域 24px；标题到摘要或 Quick Answer 16px；H1 行高 1.08。
- 长标题、翻译、Quick Answer 和工具附加内容自然撑高，不固定高度裁字，不自动缩字号。
- 禁止各模板用 vh / svh 控制 Hero 高度。配图绝对定位，不参与撑高。
- 继续固定夜间配色，使用现有主题令牌；日夜切换不改变 Hero 尺寸。

## 统一列表页（list-page）

没有指定已发布 landing 的分类，以及 boss-index、character-database、mod-index、build-library 四种目录内容，使用统一列表布局：紧凑深色 Hero → 搜索 / 分组 → 结果数量 → 卡片 → 按需分页。Hero 固定夜间配色，列表区域跟随日夜切换。

- `config/categories.json` 的可选 `heroAsset` 指向已登记素材；没有真实图片时不显示空白图框。
- 页面可选 `listGroup` 指定分组 ID；对应语言的 `content/locales/<locale>.json` 必须在 `listGroups` 中填写名称。出现两个以上分组才显示筛选按钮。
- 卡片来自分类的已发布页面，沿用统一索引的排序、标题、描述和 URL。可选 `assets.thumbnail` 作为独立卡片封面，不自动重复 Hero 图片。
- 搜索匹配标题和描述，可与分组组合使用；每页固定 30 条，不足一页隐藏分页。筛选变更后回到第一页。
- 网格默认 3 列，1200–1439px 为 4 列，1440px 及以上为 5 列，1023px 及以下为 2 列，600px 及以下为 1 列。
- Weapons 分类使用紧凑卡片：图片必须保留；桌面 / 中间宽度 / 手机卡片高度分别固定为 224 / 260 / 300px；标题固定单行并省略溢出；不显示副标题、事实列表、底部按钮或标题箭头。
- 攻略、Boss、角色、MOD、配装目录均已迁入这一套布局；不同内容类型只保留数据字段和筛选规则差异。

## 目录与说明文章的关联

- Boss、角色、配装、MOD 目录 frontmatter 必须显式填写 `listGuide: 同语言文章ID` 或 `listGuide: null`；不能省略、填空字符串或用错误 ID 代替关闭。
- `null` 表示没有关联说明文章：隐藏搜索框上方的说明入口，列表、筛选、卡片和分页照常使用。不自动创建文章，也不回退到其他文章。原来仅靠说明文章承接的旧章节锚点不再有效，列表保留 `#main` 和 `#browse`。
- 非空目标必须是同语言、同分类、已发布的 wiki-page，并共享本目录的主记录；缺失、跨语言、跨分类、错误模板或错误记录引用继续报错。
- 提供说明文章时，文章填写 `articleRecord: 目录主记录ID`，并在 `records` 中声明同一 ID。资料继续只有一份 JSON，文章按记录类型显示对应模块。关闭入口不会删除已经存在的文章或清理其他指向它的链接。
- `articleRecord` 不能与旧 `guide` 同时填写。列表正文必须为空，原正文迁到关联文章。
- 攻略 / 武器 / Boss / 角色 / 配装 / MOD 统一每页 30 条；MOD 记录的 `perPage` schema 固定为 30，只保留 `sortOptions` 配置。筛选、排序、分页共用 ListBrowser；标签条件取交集。
- 缺少详情 URL 的条目显示不可用，不制造链接。未公开内容作为独立提示，不计入结果数。
- 配置非空 listGuide 时，MOD 原目录的 #install / #compat / #safety / #faq / #legal 入口跳转到说明文章相应章节；listGuide 为 null 时这些旧锚点不作为有效内部链接目标。
- 当前维护 9 套实际布局、14 个内容类型键，新增结构化目录、配装详情、模组详情和数据库详情。完整映射见[实际页面布局清单](template-inventory.md)。

## site-home：首页

文件为 `content/<locale>/home.json`，不用额外 MDX 页面。

固定顺序：hero → featured → about → 按导航顺序生成的分类楼层 → faq。
首屏统计与 CTA 保留在 hero 内。分类楼层来自统一索引，不在首页重复维护卡片数据。

- hero：主图、标签、标题、说明、统计，以及显式的 `video`。没有视频填 `null`；有视频填 `{url,title}`，URL 必须指向 YouTube 视频，标题为 1–120 字符单行文本。不填写本地封面，播放器不自动播放。
- `hero.stats[].value`：必填非空纯文本或 `null`。例如数字写成 `"24"`，日期或带单位的值也直接写文本；文本按原值显示，不解析数字、不播放递增动效。`null` 显示当前语言的 `ui.unknown`，缺失、空白文本、数字及其他类型均报错。暂不新增字符长度上限；其他首页动效不变。
- cta：第一、第二个链接使用实心按钮，第三个及以后使用文字操作样式；缺少请求后端时，输入和提交明确不可用。
- featured：填写标题文案和可选 `pinnedIds`。首页固定展示 6 个真实内页链接；先放置固定内容，再从不同导航分类和统一索引中自动补齐。它与分类楼层允许重复。
- 精选轮播卡片采用上方 16:9 图片、下方独立文案区域；文案不覆盖图片。分类标签保留，卡片不显示验证状态标签；内容自身的 verification 与发布校验不变。
- 精选轮播的原始卡片与可见循环副本都必须能点按打开对应文章；仅水平移动超过 5px 后捕获指针并按拖动处理，拖动不能误跳转。循环副本保留 `aria-hidden` 并移出 Tab 顺序，但不能用 `inert` 或 `pointer-events:none` 禁止点击。修改交互后，在目标站启动预览并运行 `TEST_BASE_URL=<目标站预览地址> npm run test:browser -- tests/browser/home-carousel.spec.ts`，覆盖桌面、手机、拖动后单击和键盘；省略地址运行的演示 fixture 不代表目标站通过。
- about：解释段落和事实列表；游戏事实未知时保留 null。资料标签与值中的长单词自动折行，保持原字号并完整显示，不截断或省略。
- 首页角色展示卡只显示头像、身份、名称和简介，不展示底部验证状态或额外短标签。卡片高度随内容自适应，简介不截断；角色列表页的内容与验证信息不受此展示调整影响。
- 分类楼层：每个启用导航的分类对应一个 H2；少于 4 个可链接内页时整层隐藏，最多展示 8 条，并提供“查看全部”。标题默认取分类字典，也可用 `homepageTitle`、`homepageDescription` 覆盖。
- 楼层结构按内容自动分为 editorial、media、data 三类；确有需要时才在 `site.homepage.layoutOverrides` 中按分类 ID 覆盖。
- `weaponShowcase`：可选的武器楼层动效素材，填写 `{asset,ariaLabel}`。当 `weapons` 分类达到楼层展示门槛且素材存在时，首页使用左文案、右 4×4 武器 Shuffle Grid；素材建议为 4×4 等分图。未配置时回退到普通分类卡片楼层。
- faq：问题和回答；`support` 可选填写 `{prefix,link,suffix}`。桌面使用左侧说明、右侧单开折叠列表，移动端帮助入口移到列表下方；答案使用逐字显现，减少动态效果时立即显示。
- 广告启用时，首页 A2 默认使用 `featured / after` 语义锚点，精确位于 Featured 和 About 之间；不得根据楼层数组下标推算。

主图槽 2560×1440；分类卡片优先复用内页的可选 thumbnail，没有图片时显示文本卡片，不制造空白素材框。精选区主卡没有 thumbnail 时可回退使用该文章已有的 Hero 图。

## 统一文章页：五类内容共用

`wiki-page`、`character-detail`、`weapon-detail`、`systems-reference`、`mod-detail` 全部通过 `ArticlePage` 渲染，只有一套页头、排版和目录。旧 template 键继续识别数据类型，不再代表五套独立外观。

顺序：固定夜间 Hero（面包屑/标题/Quick Answer/真实元信息/可选配图） → 可选关键信息 → 左侧目录与正文模块 → 相关文章。手机不显示目录。正文之前不放分类文章列表，不渲染缺图的大幅封面；存在 hero 图片时放在 Hero 右侧，手机作为淡化背景，不在正文重复展示。Hero 通过 data-theme-mode=night 使用 config/theme.json 的夜间令牌，独立于页面日夜切换。

- Hero 图片从 `assets.hero` 读取；未配置图片时文字自然占据完整宽度。示例的 article-atmosphere 是 AI 生成虚构插图，正式站须自行配置适合游戏的素材。
- Quick Answer 使用 frontmatter 的 `quickAnswer` 文本数组，每项为一段；未配置时使用 description。description 仍用于 SEO。
- H1 一律来自页面 title；author、gameVersion、updatedAt 有值才显示，不填构建时间。
- 目录包含 MDX H2/H3 和有内容的模块；空数组模块及空标签页不显示。
- 模块 ID 仍是保留名称，MDX 标题不能占用；链接到未显示模块会在内容检查时报错。
- 属性中适用但未知的值继续显示 unknown；没有整个可选模块时不生成空楼层。
- 根级 `sources` 与旧展示字段 `sourceGroups`、`sourceNote`、`sourceSection`、`sections.sources` 均已移除；输入这些字段会报未知字段错误。`confirmed` 不要求来源。
- 框架入口为 `src/templates/article-page/ArticlePage.tsx`，具体数据转为正文模块的文件在同目录。换游戏仍只维护配置、MDX 与 JSON。

## wiki-page：普通文章

新文章只需通用 frontmatter 与 MDX 正文，不必填写 guide。`guide` 是旧资料的可选兼容字段：stats 保留读取兼容但不显示；table、route 在正文后显示。eyebrow、title 保留读取兼容，不再额外输出重复标题。

需要兼容旧统计、表格和路线图时可提供：

```yaml
guide:
  eyebrow: "章节标签"
  title: "本章标题"
  stats:
    - label: "适用等级"
      value: null
  table: collectibles
  route: route-map
records:
  - collectibles
assets:
  hero: guide-hero
  route: route-map
```

- guide.table 可为 null；非空时必须指向同语言 type=table 记录，并在 records 中登记。
- guide.route 可为 null；非空时必须是已登记素材。有真实图片时按素材比例展示，null 或 src:null 不显示。
- MDX 的 H2/H3 自动生成目录与稳定锚点；重复标题由同一算法去重。
- table 记录：title、columns（id/label）、rows。每行必须恰好拥有全部已登记列；未知单元格用 null。
- 移动端不显示文章目录，表格可以横向滚动；不隐藏关键列。

## 固定信息与政策页

每个启用语言固定提供四个根路径普通文章：`about`、`contact`、`privacy`、`terms`。它们继续使用统一 article-page，不另建政策页模板；统一索引会自动加入路由、SEO、sitemap 与 Footer 的 About & Policies 列。

- 四页 frontmatter 固定使用 `category: _pages`、`template: wiki-page`，内容 ID 与 slug 保持 `about`、`contact`、`privacy`、`terms`。
- 站点名、游戏名、生效日期分别使用 `<PolicyValue field="siteName" />`、`<PolicyValue field="gameName" />`、`<PolicyValue field="effectiveDate" />`，联系渠道使用 `<PolicyContact />`。只允许这些字段，不在正文硬编码不同站点的信息。
- 对应变量集中在 `config/site.json` 的 `policies`。联系邮箱为 null 时页面明确显示“未配置”，不会生成假的联系方式。
- 四页禁止广告，且不因全站广告模式变化而出现广告 DOM 或留白。
- 新站启用 policies 后，所有启用语言必须同时存在四个已发布页面；缺页、缺翻译或改动固定 ID 会在内容检查时报错。
- 服务商声明必须与实际接入一致。分析、广告、嵌入服务未配置时，不得在隐私政策中写成正在使用。

## boss-index：Boss 目录与关联攻略

列表顺序：Hero → 可选关联攻略入口 → 搜索/难度与阶段筛选 → 卡片。页面 records 中必须恰好包含一个 type=boss-index 的主记录。提供 listGuide 时，detail、attacks、footer 和原 MDX 正文进入其指向的通用文章页。

主记录：

- index：eyebrow、title、description。
- entities：id、name、contentId/null、assetId/null、difficultyId/null、phaseCount/null、tags、verification。
- filterOptions：难度 id 与可翻译 label；筛选按 ID 运行，不识别标签文字。
- knownTotal：已知总量或 null；不从未知槽数量反推总量。
- unrevealed：null 或 status=unrevealed、label、description 的未知槽。
- detail：null，或 entityId、eyebrow、stats、facts、videoAssetId/null、attacksTitle、columns、attacks。
- attacks：id、name、phases/null、windUpFrames/null、answer/null、verification。
- footer：note、可空的带标签 link。

难度与多阶段条件组合；各组 All 清除本组条件，Reset 清除全部条件。结果数只计算已命名实体，未知阶段不算多阶段，零结果明确显示空态。
列表卡片有真实图片时统一使用 16:9；文章媒体按素材比例显示，不渲染缺图占位。
没有实体详情 contentId 的卡片显示普通内容，不生成假链接。
列表 MDX 正文必须为空，正文写到 listGuide 文章中；漏迁会导致内容校验失败。

## character-database：角色库

列表顺序：Hero → 可选角色关系文章入口 → 搜索/角色分类 → 卡片。页面 records 中必须恰好包含一个 type=character-database 主记录。提供 listGuide 时，lead、relations 和 MDX 正文进入其指向的通用文章页。

- 主记录：leadCharacterId、characterIds、leadLabel、cast、connections、unrevealed/null、relationNote、relations。
- cast / connections：eyebrow、title、description。
- 角色专属精选模块只在首页渲染，并按导航分类顺序插入。它直接读取 `character-database` 的 `cast` 和 `characterIds` 中前三条角色记录；头像、姓名、角色、简介、验证状态均不在首页重复维护。角色总数小于 `config/site.json` 的 `homepage.categoryFloorMinItems` 时自动隐藏，没有真实 `assetId` 时沿用角色占位槽。
- 每个人物是 type=character 记录：name、role、summary、contentId/null、assetId/null、attributes。
- attributes：label、value/null。
- relations：fromId、toId、type、label、verification、sourceLabel/null；两端必须属于 characterIds。
- 主角必须在 characterIds 中。人物卡片、主角标题、关系表名称均从同一人物记录读取。

角色目录卡片有图时统一为 16:9；关联说明文章中的主角图片为 3:4。缺图不显示占位。
没有详情页时显示非链接卡片；不能把人名改成无关攻略链接来凑数。原 MDX 写入 listGuide 说明文章。

## character-detail：可使用角色详情

适用范围：可使用角色；不覆盖普通 NPC。使用统一文章页；正文模块依次为属性、技能、获取方法，只显示有资料的可选模块。

完整样例：`content/en/pages/demo-guide-detail.mdx`、`content/en/records/demo-guide-detail.json`、`content/en/records/demo-guide.json`。示例内容是虚构演示，不能作为真实资料发布。

- MDX frontmatter 使用 `template: character-detail`，records 中恰好一个 type=character-detail 的记录；正文进入文章主栏开头。
- 详情记录的 `characterId` 引用同语言 type=character 记录。姓名、定位、简介、立绘和属性统一从这个角色记录读取。
- `sections` 的 attributes / skills / acquisition 各填 eyebrow、title、description；获取标题可改成“招募条件”或“解锁方法”。
- `labels`：cost、cooldown、prerequisites、location、version、updated、skillArtwork，全部填写当前语言文本。
- `attributeNote`：属性测量条件说明，如等级和装备；没有说明填 null。
- `skills`：每项包含唯一 id、name、kind、description、iconAssetId/null、cost/null、cooldown/null、verification。不限数量；消耗与冷却为 null 时隐藏对应字段。若尚未确认却适用，应填“未确认”等明确文本；不要用 null 表示零。
- `acquisition`：prerequisites/null、location/null、steps。每步包含唯一 id、title、description、verification。未知前提与地点显示未知；steps 为空时显示资料空态。
- 页面 frontmatter 的 gameVersion、updatedAt 用于版本和更新时间；不知道就省略，不填生成时间。
- 技能、步骤可标 confirmed，不要求详情记录填写来源。立绘、技能图标引用统一 assets；缺图不显示图槽，不造游戏素材。

### 从角色列表自动进入详情

1. 在角色库的 `characterIds` 中登记角色 ID。
2. 创建角色详情 MDX 和 JSON，在详情 JSON 填该 `characterId`。
3. 角色记录的 `contentId` 保持 null，构建时自动关联同语言详情页，不需手写网址。

同语言同角色只允许一个可渲染详情页；重复详情或与已有 contentId 冲突会报错。没有详情或没有该语言翻译时保持非链接，不跳转到其他语言。草稿只在预览中参与关联，发布构建不生成草稿链接。角色姓名显示与页面标题分别从角色记录与 MDX title 读取，修改名称时需同时维护页面标题。

新增或删除详情后，页面路由、分类列表、语言链接和 SEO 继续由统一索引生成。导航高亮沿用角色分类；是否进入 sitemap 仍由发布状态、demo/noindex 等规则决定。桌面目录为锚点，手机不显示目录。

## Systems reference (`systems-reference`)

主 record：`type: systems-reference`，每篇必须在 `records` 中声明且只声明一个同类型主记录。演示入口为 `/systems`、`/ja/systems`；正文由对应语言的 `combat-reference.mdx` 提供。

使用统一文章页；MDX 进入机制说明，连招、物品模块有资料才显示。

| 字段 | 内容与约束 |
| --- | --- |
| `mechanics / combos / items` | 每段的 `eyebrow / title / description`，均为当前语言必填文本。 |
| `mechanisms` | 至少一个 `{id, icon, title, description, verification}`。ID 唯一；`icon` 只能是已登记的 `route / collectible / clock / tip / clash / issen / soul / arrow-right / alert / list`，由 `/ui/icons/*.svg` 的 CSS mask 继承主题色。 |
| `diagramAssetId` | 已登记素材 ID 或 null；null 不渲染图片；真实机制图保持 16:9。 |
| `comboRoutes` | `{id, name, input, frames, use, verification}`；`frames` 是非负整数或 null，`input / use` 可为 null。空数组不生成对应文章模块。 |
| `itemIds` | 同语言 `weapon` 或 `item` record ID；名称、类型、摘要、图片、目标页面均从实体读取。不可重复。 |
| `stats` | `{itemId, attack, speed, note, verification}`；数值为非负有限数或 null。每个 itemId 只能一行，且必须属于 `itemIds`。 |
| `columns` | `route / input / frames / use / item / attack / speed / notes` 的本语言列标题。 |

素材比例：hero 2560×1000，机制图 1600×900，物品卡片 800×800。机制正文使用分隔线与图标行，不增加外层卡片。不再保留系统专用封面高度。统计未知值显示 `ui.unknown`，不会转成零；每条记录保留自己的验证状态。

## Weapon detail (`weapon-detail`)

主 record：`type: weapon-detail`。每篇 `records` 必须包含且只包含一个同类型主记录；`weaponId` 指向独立 `weapon` 实体。演示入口为 `/weapons/practice-blade`、`/ja/weapons/practice-blade`。演示名称只存于内容，不在模板代码中。

### 共享实体

`weapon` 与 `item` 均使用 `{id, locale, type, name, kind, summary, contentId, assetId, iconAssetId, facts, tags, verification, demo}`。`facts` 是 `{label, value}` 数组，value 允许文本、有限数值或 null。`contentId` 可为 null；非空必须指向同语言可达内容。两个素材字段允许 null，非空必须在 assets 登记。`weapon-detail.weaponId` 仅接受 `weapon`；系统物品列表和配对允许 `weapon` 或 `item`，避免复制名称与摘要。

### 楼层和字段

使用统一文章页；属性进入顶部关键信息，正文后依次为解锁、详情标签、对局、搭配、FAQ；空模块和空标签页隐藏。旧双列 hero 和翻页栏不再渲染，相关文章仍由统一索引生成。

| 字段 | 内容与约束 |
| --- | --- |
| `weaponId` | 同语言的 weapon record ID。实体属性、标签和来源从该记录读取；页面 H1 和简介统一使用 MDX title、description。 |
| `gallery` | 有序的已登记素材 ID 数组，不可重复，可为空。默认显示首张。 |
| `heroLabel / primaryCta / secondaryCta` | 旧数据兼容字段，保留校验，但统一文章页不再渲染专属页头标签及 CTA。 |
| `namingNote` | 命名说明或 null。不得用它制造未经核实的名称对应关系。 |
| `overview / unlock / detail / matchupSection / pairingSection / faqSection` | 每个楼层的 `{eyebrow,title,description}`。这些字段控制结构标题；MDX 只渲染 overview 内的正文槽。 |
| `atAGlance` | 旧侧栏标题兼容字段；facts 现统一展示在文章顶部。 |
| `unlockSteps` | `{id,title,description,verification}` 数组，ID 唯一，按数组顺序编号。 |
| `evidenceNote` | 解锁说明后的证据限制文本，必填，保留原型独立的上边框提示。 |
| `moveset` | `{id,action,input,frames,coverage,notes,verification}`；input、frames、coverage 允许 null，frames 为非负整数。 |
| `movesetNote` | 动作表的测量条件和限制说明。不得在代码固定游戏版本或帧率。 |
| `upgradeNodes` | `{id,parentId,tier,name,description,verification}`。tier 为 1/2/3；根节点 tier 1；子节点必须恰好比父节点高一级。拒绝重复 ID、缺失父节点与循环。按实际层级显示连接分支。 |
| `upgradeNote` | 强化分支覆盖范围与证据限制。 |
| `patchHistory` | `{id,version,change,verification}`；version 可为 null。 |
| `patchNote` | 更新历史的检索范围说明。空列表不表示没有发生更改。 |
| `buildRefs` | `{contentId,description,verification}`，目标为同语言可达内容，标题与 URL 从统一索引读取。不可重复。没有构成页面时用空数组。 |
| `matchups` | `{id,situation,contentId,result,answer,verification}`；contentId 可 null，非空需同语言可达。result / answer 可 null。 |
| `pairings` | `{recordId,description,verification}`，引用同语言 weapon/item，名称及类型从实体读取。不可重复。 |
| `faq` | `{id,question,answer,verification}`，ID 唯一。使用可键盘操作、支持减少动效的 Disclosure，首项默认展开。 |
| `tabs` | `moveset / upgrades / changes / builds` 的本语言标签文字。 |
| `columns` | `action / input / frames / coverage / notes / patch / change / source / situation / result / answer` 的本语言列标题。 |

### 交互与素材

Gallery 接收 `images: ImageAsset[]`（项目资产类型 `Asset`）、`locale / label / emptyLabel / selectLabel`，可选 `initialIndex`。主槽固定 16:9，建议主图 1280×720、细节图 640×360；缩略图沿用原型三列容器，但数量只由实际素材数组决定。按钮的键与数据取 asset ID，alt 来自当前语言 assets。Enter/Space 选择，左右箭头、Home、End 切换并移动焦点。缩略图占位描述只显示一行，过长时省略，确保尺寸文字留在 16:9 槽内；完整描述保留在按钮 aria-label 和选中后的主图。单图不显示缩略分页；Gallery 组件单独使用时零图仍有占位，文章页不传入 src:null 的素材，零图不渲染 Gallery。非法 index、重复 ID、缺失 alt 会明确报错。

Tabs 通过稳定条目 ID 选择，使用实例级唯一 ARIA DOM ID。左右箭头循环，Home/End 跳首尾；非激活 tab 从顺序焦点移除，隐藏 panel 不能聚焦。文章页仅传入有数据的标签；全部为空时不显示标签模块。统一使用文章页头与正文布局。

### 发布与来源校验

所有关联先在统一索引做结构校验；published production 页面可达的实体和素材再执行生产校验。关联 demo 实体不能被生产页面间接发布。页面、记录及嵌套条目的 `verification: confirmed` 由内容提供者负责，模板不判断事实真伪，也不自动把内容改为 confirmed。演示内容保持 `demo: true`、`verification: unverified`；未知统计用 null，不能用虚构数字补满表格。新增 UI 字段必须同步根内容和两套测试 fixture 的所有语言字典，没有英文回退。

### 正文标题与模板锚点

所有 MDX 页面保留 `main` 作为正文区域 ID。武器详情另保留 `overview / unlock / tabs / matchups / pairs / faq / sources`。正文标题经过既定 slug 规则后若与保留 ID 相同，`prepare:content` 会报出文件、`MDX.headingIds` 字段及冲突值，并停止生成；请明确改写正文标题。标题不会被静默重命名，已成功生成的索引也不会被失败输入覆盖。正文可写 `[解放说明](#unlock)` 链接到有内容、实际显示的章节；空章节不可作为链接目标。wiki 页的普通 `FAQ` 等标题仍然合法；首页使用 JSON 固定结构，没有 MDX 正文入口。

## build-library：配装库

主记录 `type: build-library`。`sections` 必须提供 evidence / find / setups / presets / rescue / faq 的 eyebrow、title、description。实际使用通用列表：固定夜间 Hero → 可选公共说明文章入口 → 搜索/玩法与武器筛选 → 配装卡片。列表正文必须为空；提供说明文章时将正文写入 listGuide 对应文章。

- `evidenceLegend`：证据标签、说明和核验状态；不能把演示标成已验证。
- `filterOptions.playstyles/weapons`：稳定 ID 和显示名称；`all` 保留给重置项。武器 ID 必须关联同语言 weapon 实体。`buildIds` 引用共享 `build` 实体，其 playstyleIds / weaponIds 必须属于本页筛选项。过滤取两个条件交集，并保留实体顺序。
- `build`：name、summary、assetId（可空）、facts、playstyleIds、weaponIds、equipment、bestFor、avoidIf、howItWorks、artifactPriority、buildOrder、howToPlay、risks、evidenceNote、variants、verification。equipment 的 recordId 可关联 weapon/item，未知文本 value 用 null。每个 variant 提供相同完整配装字段，Tabs 不根据名字推断内容。
- `presets`：id、buildId、title、code、description、verification。复制按钮等待剪贴板写入成功才显示成功和 PULSE；失败显示字典 copyFailed，code 一直可聚焦和手选。演示码明确写为不可导入的 DEMO-ONLY 字符串。
- `rescueRows`：id、buildId、protectFirst|null、ifMissing|null、pivot|null、verification；buildId 必须属于本页 buildIds，并链接到对应完整配装。`columns` 提供 build / protectFirst / ifMissing / pivot 四个表头；未知策略用 null。`faq` 提供 question、answer、verification，confirmed 项不要求来源。
- 每个 buildId 必须对应同语言、同分类、唯一已发布 wiki-page：articleRecord 填 buildId，records 同时声明 buildId 和本库 ID。对应缺失、重复或跨分类时构建失败。每套配装的 Quick Answer 概括适用对象、装备与证据限制。
- 配装文章显示装备/属性、适用与不适用场景、机制、装备优先级、构筑步骤、玩法、风险、完整变体、该配装对应的预设和补救方案、证据限制说明。原 build JSON 是唯一数据源。
- listGuide 可为 null；非空时指向公共说明 wiki-page，articleRecord 指向 build-library，承接目录说明模块。无论 listGuide 是否关闭，每个 buildId 仍必须有自己的独立配装文章。
- 配置非空 listGuide 时，旧 #setup-{buildId} 跳转到对应配装文章，#find-build/#setups 跳到列表 #browse，#presets/#rescue/#faq 跳到公共文章相应章节。listGuide 为 null 时仅保留列表 #main/#browse，旧章节链接校验失败；请显式改为列表锚点或现有详情文章链接。
- 图片：Hero 使用通用规则，配装卡片和详情只展示实际存在的 assetId 图片。无内容的优先级、构筑步骤、变体、预设、补救表和 FAQ 省略。筛选零结果显示 noResults 与重置操作。反馈服务未配置时明确不可用。

## weapon-explorer：三级武器浏览

主记录 `type: weapon-explorer`。固定楼层按 comparison → explorer → playstyles → details → tier-list → unlocks → upgrades → changes → faq 排列，每层的标题文案由 `sections` 对应字段提供。H1 来自页面 title，MDX 插入比较区。

- `comparison`：weaponId、identity、action、learning、bestFor、tradeoff、verification；`columns` 提供表头。action / learning 未知用 null。
- `treeNodes`：id、parentId|null、tier（1/2/3）、label、details、verification、iconAssetId|null；`treeNotes` 恰好三条，按层级解释。拒绝重复 ID、缺父、环、层级跳跃及第四层；空子分支合法。选择一级清空二三级，选择二级清空三级，不能选跨分支的旧节点。
- `playstylePicks`：id、label、weaponId、description、risk|null、verification；`riskLabel` 提供风险尾栏的本地化标签，null 显示 unknown。`detailSections`：id、weaponId、label、facts、verification；按内容数量渲染完整的武器说明行，不在框架固定武器数。
- `tierRows`：id、tier|null、weaponIds、reason、whenToMove|null、verification；四列保留调整评级条件。`unlockRows`：weaponId、method|null、cost|null、evidence|null、verification；路线、费用与证据分列。`columns` 还必须提供 whenToMove / cost / evidence / subject 表头。
- `upgradeExplanation`：id、title、description、verification；旁侧 `upgradeMedia` 为 assetId|null、fallbackLabel、caption。保留 4:3 图片与说明双列，未提供素材时显示本地化 1200 × 900 占位图；非空 assetId 参加引用和生产 demo 素材校验。
- `patchHistory`：id、version|null、weaponId|null、subject|null、change、verification。已有武器主体用 weaponId 关联同语言实体，其他主题用 subject，均未知时可同时为 null；不能把演示文字写成真实版本或补丁结果。
- `faq` 的 confirmed 项不要求来源。所有 weaponId 必须关联同语言 weapon 实体；生产验证递归检查可达实体和素材的 demo 标记。
- 固定锚点：main、comparison、explorer、playstyles、details、tier-list、unlocks、upgrades、changes、faq、sources。正文标题不得冲突。
- 图片槽：页面 hero、当前树节点 icon、每条武器说明的 weapon.iconAssetId、升级区 upgradeMedia。玩法卡保持 auto-fill 270px 网格，详情保持等宽 auto-fit 240px 网格，树列最高 296px 并独立纵向滚动。空图使用带真实用途标签的占位槽；所有空表及空列表保留楼层和空态。空子分支显示空态，未选择二级时三级显示选择提示。

武器浏览 Hero 保留比较区和交互树双按钮；`unlockSummary` 提供解锁概况，武器数来自 comparison 条数、节点数来自 treeNodes 条数，版本来自页面 gameVersion，缺省显示字典 unknown。数量、版本与解锁状态不在框架写死。

配装 `setup-{buildId}` 动态锚点与固定锚点一起参与构建校验：正文标题不得产生相同 ID；普通 Markdown 的本页或同语言站内链接可引用这些已登记锚点，未知配装锚点报错。现有 ContentLink 只接受内容 ID，不支持 fragment 属性；需要定位配装时使用普通 Markdown 锚点链接。

## mod-index — 社区 MOD 索引

页面 `records` 必须引用一个 `mod-index` record。`modIds` 以稳定 ID 引用同语言的 `type: mod` 实体，并决定 `listed`（Trending）的明确顺序。MOD 的 `title / description / categoryId / tagIds / testedVersions / updatedAt / downloads / contentId / assetId / verification` 供列表和详情复用。没有详情页时 `contentId: null`；有详情时必须指向反向引用该 MOD 的 `mod-detail` 页面。日期用有效 ISO 日历日期；未知下载数、更新时间、图片和链接用 `null`。

- `currentVersion: string | null`；未知时禁用「当前版本」筛选并展示原因。
- `perPage` 为不小于 20 的整数；`knownTotal: number | null` 不得小于 `modIds.length`。
- `categories / tags` 是稳定 ID 与翻译文案的映射；不能用翻译后的标签作为筛选值。
- `sortOptions` 仅支持 `listed / downloads / updated`。下载数按数值、更新按日期降序；未知值排最后，相同值按稳定 ID 排序。
- `safetyNotes / legalNotes` 允许为空；通用文章页省略无内容模块及其目录项。
- `sections` 固定为 `browse / install / compat / safety / faq / legal`；`beforeInstall / installSteps / compatibility / safetyNotes / safetyAssetId / safetyCaption / faq / legalNotes` 填充 listGuide 指向的通用文章页模块。
- 分类、所有已选标签、NFKC 规范化标题/描述搜索和当前版本筛选取交集。筛选或排序变化回第一页；页数由结果数计算，空结果显示空态并隐藏分页。

## mod-detail — MOD 详情

页面 `records` 必须引用一个 `mod-detail` record，`modId` 引用同语言共享 `mod` 实体。共享 MOD 的 `authorName / releaseVersion` 和详情的 `categoryLabel` 填充关键信息区域的元数据行；作者和版本未知时用 `null`。共享 MOD 还保留 `endorsements / fileSize`，未知时用 `null`。`dataVersion` 是本地追踪状态的数据版本，变更此值会使用独立的新存储键。

- `sections` 仍使用 `overview / requirements / install / tabs / conflicts / faq / report` 数据键；共用文章页，MDX 在 overview，统计与 facts 在顶部。空模块和空标签页隐藏。
- `requirements` 和 `conflicts` 可通过 `modId` 引用其他共享 MOD；无已登记实体时填 `null`，并填写描述。生产验证递归检查引用的 MOD，不能把演示依赖藏在非演示详情内。
- `changelog[]` 使用 `version / date / changes: string[] / verification`，每个版本至少有一条变化；使用文章标题和列表排版，保留每一条变化。
- `gallery` 为图片资产 ID；`installSteps / files / changelog / posts / permissions / faq` 是静态、可维护的内容。`posts` 不提供发帖接口，也不伪造后台。
- `authorUrl / files[].url / feedbackTarget` 只允许 HTTP(S) 链接。真实配置作为普通外部链接打开；缺失显示不可用，绝不显示虚构的 Submitted。
- `feedbackOptions` 提示可反馈的信息，只有配置 `feedbackTarget` 后才有跳转入口。
- Track 仅记录当前浏览器：键包含 `siteId + modId + dataVersion`，语言不改变同一 MOD 的状态。损坏数据、访问被阻止或写入失败会显示错误；只有成功写入后才产生确认脉冲。它不会订阅作者更新或发送通知。
- 嵌套 `verification: confirmed` 不要求来源字段；演示数据保持 `demo: true / unverified`，不提供虚构的真实下载地址。

## interactive-map

- 主记录 `type: interactive-map`。`mapId` + `dataVersion` 为稳定小写 ID；与 `site.siteId` 一起组成浏览器进度键。改版需要清空历史进度时显式更换 `dataVersion`。
- `sections` 必须包含原模板顺序的 `map`、`legend`、`locations`、`progress`、`how-to`、`faq`，每项提供 eyebrow/title/description；页面 hero 来自 MDX 元数据和 `assets.hero`（原槽 2560 × 900）。
- `regions[]`：唯一 `id`、`label`、`chapterLabel`、`imageAssetId: string|null`、正整数 `width/height`、`plateLabel/plateNote`、`knownTotal: number|null`、`disabled`、`verification`。至少一个区域可用。空图以注册尺寸/比例显示明确演示占位。
- `categories[]`：唯一 `id`、`label`、`description`、`icon`（1–4 字符）、`tone`。tone 仅允许已有语义令牌 `accent-text`、`marker`、`ok`、`warn`、`text-secondary`、`text-caption`、`marker-soft`，不可输入颜色/CSS。
- `pins[]`：唯一 `id`、有效的 `regionId/categoryId`、有限数字 `xPercent/yPercent`（0–100）、`label/description`、`contentId: string|null`、`collectible: boolean`、`verification`。地图与文章列表共用同一过滤结果；非收集类不写入进度。
- 根级和地区 `knownTotal` 指真实收集品总数，可为 null；不可小于已提供的收集品数量。未知总数只显示计数与未知提示，不显示完成百分比或填充进度条。实际注册的地区/分类/坐标数量可用于界面计数，不推断游戏总量。
- `mapNote`、`locationsNote` 为操作/覆盖说明；`progressImageAssetId` 指向比较图或 null，比较图保留 1200 × 900 槽位；`progressImageLabel`、`progressCaption` 必填。
- `instructions[]`：id/title/description/verification；`faq[]`：id/question/answer/verification。第一条 FAQ 默认展开。不提供根级 `sources`。
- confirmed 嵌套条目不要求记录提供来源。正式模式仍校验所有可达地图资产；演示记录或真实文件的演示资产不能用于正式发布。pin 内容链接必须在同语言可达。
- 浏览器存储错误和损坏数据会明确显示；勾选只有写入成功后才更新。重置只删除当前站点、地图和版本对应的键，可恢复损坏进度，不修改其它站点或其它功能数据。

## Builds、Mods 与数据库

专用布局、数据契约、建站包目录与验收要求见 [结构化页面](structured-pages.md)。
