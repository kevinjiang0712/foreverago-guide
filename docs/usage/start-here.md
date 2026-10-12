# 从这里开始

这是一套可以复制成独立项目的游戏资料站模板。每个站拥有自己的代码、配置、内容和 Git 历史，母模板的修改不会自动同步到其他站。

批量创建新游戏站时，优先使用 [V1 建站包字段契约](site-spec.md)：在母模板外准备 `site-spec/`，然后运行 `npm run assemble:site -- --target /absolute/path/to/new-game-site`。这条流程生成首页、通用列表、通用详情和政策页，也支持通过可选结构化输入生成 Builds、Mods 和数据库页面，见 [结构化页面](structured-pages.md)。下面的手工修改说明仍适用于既有站及单站定制，生成站的 `config/`、`content/`、`public/media/` 不应直接手工编辑。

## 你通常只需要改两层

| 层 | 文件位置 | 放什么 |
|---|---|---|
| 配置 | `config/` | 游戏标识、站点地址、主题、分类、语言、官方链接 |
| 内容 | `content/`、`public/media/` | 首页各楼层文案、MDX 文章、实体数据、翻译和图片 |
| 框架 | `src/`、`scripts/` | 页面结构、组件、交互、路由、SEO 生成及校验 |

通常换一个游戏只改配置和内容。个别定制模块会修改当前站的框架；它不会影响其他独立站。

## 本地运行

使用 `.nvmrc` 指定的 Node 版本。在项目目录执行：

```bash
npm ci
npm run dev
```

打开命令实际输出的本地地址。开发预览始终禁止索引。

检查可构建性：

```bash
npm run check:content
npm run lint
npm run typecheck
npm run build
npm run start
```

`npm run start` 运行刚才的构建结果。开发预览、构建成功和上线是三件不同的事；这些命令不会部署网站。

## 换游戏时从哪里填

1. 配置站点标识、域名、语言、游戏名、政策页变量和四个 Community 入口，再基于 Onimusha 标准主题[适配游戏视觉](change-theme.md)。
2. 配置分类 ID、slug 和排序；各语言分类显示名称在语言字典中。
3. 替换首页内容、各语言文章和它们引用的 JSON 记录。
4. 登记自己的图片、用途、尺寸和各语言替代文字。
5. 运行内容检查；按报错里的文件、字段和值修复。

新站的 `config/ads.json` 默认为 `disabled`。一期不接广告时不需要删组件或改 CSS；所有广告位与留白都不会渲染。广告开关不改变正文宽度。需要检查广告布局时使用 `placeholder`；正式接入通过建站包 `ads.json` 配置，见[广告接入契约](advertising.md)。

顶部菜单在 `config/site.json` 的 `navigation.<locale>` 中显式指定标签、目标和顺序（一级 4–8 项，每组二级最多 10 项）。分类不会自动追加进菜单，导航目标的 URL、公开页面与 SEO 仍由同一内容索引解析，不另写 sitemap 或 URL 清单。删除文章前也应清理指向它的导航、正文或记录引用；框架会报错，不会悄悄删掉坏链接。完整字段规则见 `template-fields.md` 的“顶部导航”。

About、Contact、Privacy、Terms 是固定普通文章，默认随新站复制。站点名、游戏名、联系邮箱和生效日期从 `config/site.json` 注入；Community 固定为 Official site、Steam、Discord、YouTube，未配置的网址不会产生空跳转。

## 演示、预览、正式内容

- 模板样例是明确标注的演示数据，不代表真实游戏事实。
- `config/site.json` 中 `mode: "demo"` 会让所有页面禁止索引。
- 正式站使用 `mode: "production"`，并清除公开页面可达的演示记录和不合法占位链接；校验不通过就不能构建。
- 预览正式内容时，把 `.env.example` 复制为 `.env.local`，保留 `SITE_ENV=preview`。它会强制禁止索引，不需要修改正式站配置。
- `.env.local` 不应提交到 Git，也不会由复制工具带到新站。正式构建前检查部署环境没有残留 `SITE_ENV=preview`。
- 语言只能启用已有完整字典与首页的语言。缺某篇翻译时不伪造翻译正文或多语言 SEO 链接。

## 不需要懂代码，也能让 AI 维护

直接使用 [维护提示词](../prompts/maintain-site.md)，说清页面地址、操作、看到的问题和期望结果即可。

常用入口：

- [实际页面布局清单](template-inventory.md)
- [模板与内容模块字段](template-fields.md)
- [日常维护与回退](maintenance.md)
- [新站填写提示词](../prompts/new-site.md)
- [批量内页提示词](../prompts/batch-pages.md)
- [翻译提示词](../prompts/translate-content.md)

`.generated`、`.next` 是自动生成的文件，不要手动编辑。原型资料也不作为日常内容编辑入口。

## 导航菜单间距规范

- 默认样板不显示 Home 菜单，Logo 链接返回当前语言首页。导航入口仍由配置和统一索引生成。
- 桌面导航占据 Logo 与右侧工具之间的可用宽度，菜单使用 `space-evenly` 自然均匀分布，最小间距 12px；不按菜单数量硬设固定间距，也不把文字等宽拉伸。
- 空间不足时左对齐并横向滚动，保持全部菜单可达；手机断点为 767px，切换为纵向抽屉，一级菜单组间距 16px。
- 桌面和手机页头站名都使用 `--fs-body-lg`；手机站名固定单行，过长时省略，不能折行或挤压菜单按钮。
- 菜单数量和名称长度变化时不需要逐页调整 CSS。

## 列表合并后的维护方式

Boss、角色目录使用通用列表，MOD、配装和数据库使用结构化目录。有关联说明文章时，listGuide 填该文章 ID，文章的 articleRecord 指回相同 JSON 记录；没有说明文章时显式填写 listGuide: null，隐藏入口，列表照常使用。列表正文始终留空，不自动生成或补写说明文章。每套配装仍必须有独立文章，articleRecord 指向 build 实体，records 同时声明所属 build-library，这与可选的目录总说明是两个规则。当前维护 9 套布局，见实际页面布局清单。所有目录每页 30 条；通用列表在 1440px 及以上使用 5 列；Weapons 分类使用保留图片的固定高度紧凑卡片。
