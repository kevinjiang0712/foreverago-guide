# 实际页面布局清单

项目只维护 9 套运行时页面布局。`template` 字段仍有 14 个内容类型键，用来选择 schema、数据模块和筛选规则；它们不再对应 14 套外观。静态映射表是 `src/content/template-layouts.ts`，渲染、校验和测试必须共用它。

| 实际布局 | 接收的路由或内容类型 | 框架入口 | 适用场景 |
|---|---|---|---|
| 首页 | `site-home` | `src/templates/site-home/SiteHome.tsx` | 站点主入口与固定首页楼层 |
| 通用列表 | 无独立 landing 的分类、`boss-index`、`character-database` | `src/templates/list-page/ListPage.tsx` | 搜索、分组、筛选、卡片和分页 |
| 通用文章 | 普通 `wiki-page`、`character-detail`、`weapon-detail`、`systems-reference` | `src/templates/article-page/ArticlePage.tsx` | Quick Answer、目录、正文模块和相关文章 |
| 武器浏览器 | `weapon-explorer` | `src/templates/weapon-explorer/WeaponExplorer.tsx` | 武器对比、升级路线、表格和多组工具交互 |
| 交互地图 | `interactive-map` | `src/templates/interactive-map/InteractiveMap.tsx` | 地图缩放、区域与标记筛选、收集进度 |
| 结构化目录 | `build-library`、`mod-index`、`database-index` | `src/templates/catalog-page/CatalogPage.tsx` | 配装卡片、模组条目、数据库表格；筛选、排序、同类对比 |
| 配装详情 | `wiki-page` 且 `articleRecord` 指向 build | `src/templates/build-detail/BuildDetail.tsx` | 预设阶段切换、装备与技能、打法与证据 |
| 模组详情 | `mod-detail` | `src/templates/mod-detail/ModDetail.tsx` | 元数据侧栏、安装、文件与兼容说明 |
| 数据条目详情 | `database-detail` | `src/templates/database-detail/DatabaseDetail.tsx` | 参数表、说明、来源 |

## 合并边界

- 内容只是字段、文案或卡片结构不同，继续放进通用列表或通用文章，不新增页面布局。
- 只有主要交互模型不同，且通用布局无法表达时，才保留独立工具布局。结构化目录和专用详情见 [结构化页面](structured-pages.md)。
- 目录的长篇说明可放在 `listGuide` 指向的通用文章中；没有说明文章时显式填写 `listGuide: null`，隐藏入口但保留列表功能。目录 MDX 正文保持为空；每套配装仍要求独立详情文章。
- 缺图时不渲染空图片槽；工具模板中用于说明素材规格的演示占位仍按各自规范保留。

## 统一视觉规范

- 所有内页 Hero 由 `src/components/content/inner-hero.css` 控制尺寸、标题和留白，固定夜间配色。
- 通用列表统一搜索、筛选按钮、结果数、卡片、空状态和分页。
- 所有列表统一每页展示 30 条；`mod-index` 的 `perPage` schema 同样固定为 30，不能在内容中建立另一套分页数量。
- 通用列表网格默认 3 列，1200–1439px 为 4 列，1440px 及以上为 5 列，1023px 及以下为 2 列，600px 及以下为 1 列。
- Weapons 分类使用紧凑固定高度卡片：保留图片，标题单行省略，不显示副标题、事实列表、底部按钮或标题箭头。
- 通用文章统一 Quick Answer、正文宽度、目录、表格横向滚动和底部推荐按钮。
- 直接交互控件的最小点击区域为 44px；手机宽度不允许页面级横向溢出。

新增或修改内容时先选择上表中的现有布局。若确实修改运行时映射，应更新 `src/content/template-layouts.ts`、对应内容校验、浏览器测试和本清单。测试会拒绝遗漏内容类型或出现未登记的布局。
