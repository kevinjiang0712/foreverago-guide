# 游戏资料站

这是一个独立的 Next.js + MDX 项目，有自己的配置、内容、代码和 Git 历史。

## 本地运行

使用 `.nvmrc` 指定的 Node 版本：

```bash
npm ci
npm run dev
```

本地地址以终端输出为准。这些操作不会部署网站。

## 改哪里

| 想改的内容 | 位置 |
|---|---|
| 站点标识、主题、语言、分类、广告、官方链接 | `config/` |
| 首页文案、文章、翻译、实体资料 | `content/` |
| 真实图片 | `public/media/`，同时登记到 `content/assets.json` |
| 页面布局、组件、交互、自动生成逻辑 | `src/`、`scripts/` |

换游戏时通常只改配置和内容。修改生成文件 `.generated` 或 `.next` 不会持久保存。

## 修改后检查

```bash
npm run check:content
npm run lint
npm run typecheck
npm run build
```

检查当前站的实际页面用 `npm run verify:site`；首次浏览器准备及框架回归见 [维护说明](docs/usage/maintenance.md#浏览器验证的首次准备)。

正式构建预览使用 `npm run start`。需要禁止索引时，在构建前于 `.env.local` 设置 `SITE_ENV=preview`，然后重新执行 `npm run build`；示例见 `.env.example`。单独执行 `npm run start` 不会改变已有构建的索引规则。

## 使用说明

- [完整入门](docs/usage/start-here.md)
- [模板字段与固定楼层](docs/usage/template-fields.md)
- [日常维护与回退](docs/usage/maintenance.md)
- [让 AI 新建站](docs/prompts/new-site.md)
- [让 AI 批量填写内页](docs/prompts/batch-pages.md)
- [让 AI 翻译内容](docs/prompts/translate-content.md)
- [让 AI 修复问题](docs/prompts/maintain-site.md)

演示数据不能当成真实游戏事实发布。构建成功只证明能生成页面，不代表已经上线或被搜索引擎收录。

## 当前固定规则

- 运行时维护 9 套布局、14 个内容类型键；Builds、Mods 与数据库使用结构化目录和专用详情，见 `docs/usage/structured-pages.md`。
- 内页 H1 使用统一的 34–60px 流体令牌与 1.08 行高。
- 所有列表每页 30 条；1440px 及以上为 5 列。Weapons 分类使用保留图片、标题单行省略的固定高度紧凑卡片。
- 手机导航站名不折行，过长时省略；桌面菜单过长时仅菜单区域横向滚动。
- `config/ads.json` 是广告位置唯一配置源。移动端 A1 在导航上方吸顶；信息/政策页和 404 不展示广告。
