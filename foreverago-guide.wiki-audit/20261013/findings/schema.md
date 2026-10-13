# Schema 审计 · 2026-10-13

结论：43 页初始 HTML 的 JSON-LD 可解析，且与路由、正文标题和目录规模一致。

| 类型 | 实际页数 | 校验 |
| --- | ---: | --- |
| WebSite / WebPage | 各 43 | 生产绝对 URL、英语、WebSite 关联 |
| BreadcrumbList | 42 | 首页以外输出；位置连续，末项 URL 为当前 canonical |
| Article | 32 | 仅攻略；标题、author、日期及 mainEntityOfPage；日期可解析且无逆序 |
| ItemList | 6 | 类目数量 2 / 18 / 6 / 1 / 4 / 1，共 32 篇；各链接指向已存在路由 |

`@context` 为 https://schema.org，图谱来自同一内容索引并存在于初始 HTML。未添加虚构评分、Review、Product、下载链接或不可见 FAQ。静态导出的类型数量与源码生成函数结果完全相同。

证据：`technical-checks.json`、`source-schema-checks.json`。本次是本地语法、字段与页面一致性校验；未把结果称为 Google Rich Results Test 通过，也不承诺富结果展示。

参考：[Google Article 官方文档](https://developers.google.com/search/docs/appearance/structured-data/article)。应填写与实际内容相符的属性，不制造未知作者资料或时间戳。
