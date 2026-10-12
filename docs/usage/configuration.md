# 换站配置说明

先复制一份独立站，再修改它自己的文件。不要同时修改母模板和现有游戏站。

## 信息分别放哪里

| 信息 | 文件 / 字段 |
|---|---|
| 站点唯一标识 | `config/site.json` 的 siteId；用于隔离本地主题、收藏和地图状态 |
| 网站正式域名 | siteUrl；只填 origin，例如 `https://wiki.example.com`，不带路径 |
| 启用语言、默认语言 | locales、defaultLocale |
| 演示或正式模式 | mode：demo / production |
| 官方社区入口 | officialLinks；固定填写 official、steam、discord、youtube，没有可靠地址填 null |
| 政策页变量 | policies；填写联系邮箱和生效日期，邮箱未启用时填 null；游戏名复用当前语言的 game.name |
| Logo、游戏全名 | brand.logo 是素材 ID 或 null；每种语言在 content/locales/<locale>.json 填 game.name（1–40 字符，不换行），统一生成「游戏全名 + Wiki」，不配置后缀和分隔符 |
| 默认 SEO 规则 | seo.titleTemplate、seo.image、seo.noindex |
| 游戏全名、通用按钮与页脚文案 | `content/locales/<locale>.json`；站名固定由 game.name 加 Wiki 生成 |
| 首页内容 | `content/<locale>/home.json` |
| 分类结构 | `config/categories.json` |
| 视觉主题 | `config/theme.json` |
| 广告状态与语义锚点 | `config/ads.json`；一期不接广告时保持 `disabled` |

上表中的示意域名不能直接当正式站地址使用。生产模式会检查占位地址。

## 广告状态与位置

`config/ads.json` 支持 `disabled`、`placeholder`、`adsterra`。建站包输入为可选 `site-spec/ads.json`，未提供时禁用；生成文件受manifest保护，不直接修改。

点位、设备规则、广告单元格式、加载与验收见[广告接入契约](advertising.md)。新版Native在正文前段，不再在页尾；双侧在正文外的真实余量中显示。旧 `placements.a2` 保留为结构化页面后段矩形广告锚点配置，受手机、宽度和间距条件约束；普通攻略和列表使用完整章节/结果组边界。旧a1/a3字段仅供配置兼容，不能重新启用旧页尾位。

## 导航与分类

每个分类有稳定 `id`、网址片段 `slug`、顺序 `order`，并指定是否进入导航 `navigation`。

- 各语言分类标题和描述填在语言字典的 `categories.<id>` 中。
- `landing:null`：自动生成该分类文章列表。
- `landing:"内容ID"`：让该分类使用指定模板文章作为入口；文章必须属于该分类。
- `submenu`：最多 6 个内容 ID，按所填顺序显示；不能填不存在的 ID。
- `showWhenEmpty:false`：没有可见文章时不展示空分类入口。
- `site.navigation`：首页、指定页面、官方链接等额外入口。启用导航的分类会自动加入，无需重复填写；重复配置会报错。
- 页脚顺序固定为 Navigation → Featured → About & Policies → Community。Navigation 自动同步最终一级导航及顺序，Featured 自动复用首页推荐内容，About & Policies 自动指向四个标准政策页，Community 固定读取 official、steam、discord、youtube 四个入口。
- Community 的网址只在 `officialLinks` 配置。值为 null 时显示名称和“未配置”，不会生成空链接；填写真实 HTTP(S) 地址后才可跳转。
- About & Policies 的页面结构固定在 `content/<locale>/pages/about.mdx`、`contact.mdx`、`privacy.mdx`、`terms.mdx`。站点差异只改 `policies.contactEmail`、`policies.effectiveDate` 和语言字典；游戏名自动使用对应语言的 `game.name`，不另填 `policies.gameName`。
- `site.footer.columns` 仅用于确实需要的额外栏目，不能重复配置上述四列。

## 首页发现楼层

首页结构参数集中在 `config/site.json`：

```json
{
  "homepage": {
    "featuredLimit": 6,
    "categoryFloorMinItems": 4,
    "categoryFloorLimit": 8,
    "layoutOverrides": {}
  }
}
```

- `featuredLimit`：精选区链接数，标准模板为 6。
- `categoryFloorMinItems`：分类可链接内页少于此数时，首页不生成该楼层。
- `categoryFloorLimit`：单个分类楼层最多显示多少条，标准模板为 8。
- `layoutOverrides`：仅在自动判断不符合内容形态时填写，例如 `{"mods":"data"}`；可选值为 `editorial`、`media`、`data`。

首页推荐区的本地化标题、说明和可选固定内容 ID 放在 `content/<locale>/home.json` 的 `featured`。推荐内容自动进入横向轮播，数量继续由 `config/site.json` 的 `homepage.featuredLimit` 控制；轮播的前进、后退、暂停和继续标签来自 `content/locales/<locale>.json` 的 `ui.previous`、`ui.next`、`ui.pause`、`ui.resume`。每个分类首页楼层默认复用字典中的 `title`、`description`；需要更适合首页的 H2 时，在 `content/locales/<locale>.json` 对应分类增加 `homepageTitle`、`homepageDescription`。列表、路由、导航、首页和页脚仍使用同一个发布索引。

### 将多个分类归到一个下拉菜单

示例 A 默认有 Home、Guides、Bosses、Characters、Weapons、Mods 六个一级入口：

- Guides 下放攻略、参考资料、地图、战斗机制。
- Weapons 下放武器浏览、武器详情、配装。
- Mods 下放已有模组详情。

只修改 `config/categories.json`：将不需要独立一级入口的分类设为 `navigation:false`，再将它的页面内容 ID 加入目标分类的 `submenu`。分类与页面网址仍然保留；该页面没有本分类一级入口时，高亮所在下拉菜单的一级入口。若本分类仍在一级导航中，优先高亮本分类；显式配置的顶级内容链接优先级最高。

某语言没有对应文章时，该语言菜单不显示该条目。每个下拉菜单最多 6 项。桌面（>767px）保持单行导航；数量多或标签长时，仅菜单区域横向滚动，并显示左右按钮。品牌与主题/语言控件保持固定。手机（≤767px）使用菜单抽屉。下拉菜单使用顶层 popover，避免被滚动容器裁切。

分类 slug 为站点公共设置；文章 slug 可以按语言不同。不同语言用同一内容 ID 表示对应关系，不靠标题或文件名猜翻译。

新增分类时一起补各语言分类名称与描述；新增文章后，无需再手写页面路由、文章菜单和 sitemap。

## 基于标准主题适配游戏视觉

`config/theme.json` 的最小完整示例：

```json
{
  "preset": "onimusha",
  "defaultMode": "day",
  "common": {},
  "day": {},
  "night": {},
  "fonts": []
}
```

唯一维护的 preset 是 `onimusha`，包含昼夜配对。所有新站以它为基础；游戏差异通过下面的配置与素材表达，不增加新的 preset。流程见 [适配游戏视觉](change-theme.md)。示例 A 使用基础值；示例 B 在相同基础上只配置蓝色和较大圆角。

- `common`：昼夜共用的视觉值，例如字体、圆角和边框风格。
- `day` / `night`：各模式的颜色覆盖。覆盖某个键时，两边都要填写该键。
- 字体、圆角、边框样式和动效性格属于同一视觉身份，昼夜必须一致。
- 不知道令牌名时让 AI 读取对应预设；不要自己编造字段。
- 固定核心间距、断点和动效规则不能通过主题覆盖。
- 改颜色后运行 `npm run prepare:theme`。它会检查正文与各底色、按钮各状态对比度，不合格会指出具体颜色和值。

## 自己的字体

字体文件放在 `public/media/`，在 `fonts` 中登记 family、src、weight、style，再在 `common` 中设置相应字体令牌。标题实际使用的字重和正文字重必须有已登记字体文件；只写字体名称不会自动加载它。

仍需实际检查中文、日文等字符覆盖、长标题和手机导航。字体登记成功不代表所有字符都有字形。

## 素材与链接

`content/assets.json` 是统一素材登记表。素材的 src、尺寸、用途与所有启用语言的 alt 必须与实际文件一致。

- 暂无真实素材时 `src:null`，保留标注用途与尺寸的图槽。
- 有真实图片时放入 `public/media/`，再引用其素材 ID。
- `public/` 中的文件均可公开访问，不放私密资料或未经筛选的研究素材。
- 没有详情页的实体不应伪造跳转链接；按对应 schema 使用 null。

## SEO 与语言

全站标题格式必须含 `{title}` 和 `{siteName}`。文章可用 seo 覆盖标题、描述和分享图；`seo.image:null` 明确取消分享图回退。

只启用有完整公共字典与首页的语言。单篇未翻译时不补英文正文冒充翻译，也不生成指向不存在翻译的 SEO 链接。

每次修改后先 `npm run check:content`，再构建与浏览器检查。错误信息中的文件、字段和值就是修改入口。
