# 结构化页面

三类目录保留 Onimusha 日夜主题和现有核心令牌，内页标题区继续固定夜间。配装用桌面四列、平板三列、小屏双列的紧凑卡片，模组用桌面和平板双列、小屏单列的紧凑条目，数据库用可横向滚动的密集参数表。三类目录使用紧凑 Hero；搜索与排序一行，下拉筛选、结果数、重置合并到下一行。搜索下方横排下拉筛选（普通分类单选，标签使用可多选的下拉菜单），结果占满容器宽度。配装和数据库逐条保留1:1 空白配图位；目录不重复展示来源、验证状态、长说明和详情按钮，数据库详情不展示来源模块。来源数据及发布校验仍保留。没有额外主题、硬编码配色或游戏专属 preset。

## 选择页面

| 页面 | `template` | 主记录 |
|---|---|---|
| 配装目录 | `build-library` | `build-library`，引用 `buildIds` |
| 配装详情 | `wiki-page` | `articleRecord` 指向 `build`，`records` 包含所属 library |
| 模组目录 | `mod-index` | `mod-index`，引用条目记录 |
| 模组详情 | `mod-detail` | `mod-detail` |
| 数据库目录 | `database-index` | 恰好一个 `database-index` |
| 数据条目详情 | `database-detail` | 恰好一个 `database-entry` |

目录 MDX 正文为空，`listGuide` 显式写文章 ID 或 `null`；数据库目录只接受 `null`。目录不显示 Quick preview。数据量少的数据库条目直接展示表内参数，`contentId: null`；有独立说明时配置详情页和对应 `contentId`。配装仍要求每套配置有独立详情 URL。路由、导航、SEO、sitemap 继续从同一索引产生。

搜索、组合筛选、排序、分页每页 30 条。最多比较 3 个同类条目，至少两个条目存在已知的可比字段才显示比较入口；只有未知值的字段不参与比较。未知值用 `null`，数字按数值排序，未知值始终排在末尾。切换筛选保留已选比较项。未加载 JavaScript 时首屏条目、表内参数和详情链接仍可访问，搜索、分页和比较需要 JavaScript。

## 配装与模组

既有 `build-library`、`build`、`mod-index`、`mod-detail` 记录继续有效。配装新增可选 `classIds`，对应 library 的 `filterOptions.classes: [{id,label}]`；基础配置及每个 variant 可写 `skills: [{id,name,value}]`，未知技能值用 `null`。未提供时解析为空数组。variant 的 `id` 不可使用保留值 `base`。

演示站的三类目录各提供 65 条记录，每页 30 条，覆盖两页满页和 5 条末页；同步到 sample-a 建站样例。

配装阶段切换同时更新装备、技能、适用场景、机制、优先级、构建顺序、操作、风险和证据，不计算推测数值。模组详情保留要求、安装、文件、更新日志、权限、冲突与反馈模块。没有真实下载或提交服务时，保持原有不可用状态。

## 数据库记录

完整示例在 `content/en/records/equipment-database.json` 与 `sample-*.json`，日文示例在 `content/ja/`。它们均是虚构演示，不可作为真实游戏数据发布。

`database-index` 包含基础记录字段，以及：

- `entryIds`：本数据库条目 ID，无重复。
- `fields`：`{id,label,kind:"text"|"number",unit:string|null,compare:boolean}`，字段 ID 无重复。
- `categories`：`{id,label}`，用于筛选和限制同类对比。
- `evidenceNote`：数据范围及证据边界。

`database-entry` 包含基础记录字段，以及 `databaseId`、`name`、`summary`、`categoryId`、`contentId`、`values`、`evidenceNote`、`sources:[{label,url}]`。`values` 必须逐项提供数据库定义的全部字段，未知写 `null`；不得添加未定义字段或将数字写成字符串。单位由字段定义统一添加。`contentId` 必须反向对应引用本条目的 `database-detail` 页，详情页与目录属于同一分类。

## 建站包复用

保留原有建站包必填文件，在 `site-spec/en/` 增加：

```text
structured-pages.json          # 原生 pageSchema 元数据数组
structured-pages/<page-id>.md  # 每页对应文件；目录为空，详情为普通 Markdown
records/<record-id>.json       # 原生 recordSchema 记录
```

`structured-pages.json` 的页字段与 `content/en/pages/` 前言相同，移除文件前言包装。仅允许上述三类页面和关联的 `wiki-page articleRecord` 文章。原生页面与原有 `pages.json` 不可重复 ID；记录与角色不可重复 ID。正文支持 `content:<id>` 内链，禁止 JSX。类别可增加 `landing` 指向同类别的结构化目录，使其使用分类根路径。导航条数会计入这些页面。

原生记录的 `demo`、验证状态、来源均按实际数据填写，生成器不会替你改成已确认。正式校验拒绝演示数据与无效引用；输入错误会在临时目录失败，不覆盖已有站。重新生成仍保护人工改过的生成文件。

```bash
npm run assemble:site -- --target /absolute/path/to/new-game-site
```

首次生成使用母模板已提交的 Git HEAD。框架升级不会自动覆盖已有独立站的框架；迁移需另行处理。

## 验收

运行 `check:content`、`prepare:theme`、`lint`、`typecheck`、`test:unit`、`build`；浏览器测试 `tests/browser/structured-catalogue.spec.ts` 检查数值排序、交叉筛选、同类比较、阶段切换、无 JavaScript 内容和 320/390/834/1440px 溢出。更改样式后需实际检查日夜模式截图，不以构建成功代替视觉验收。
