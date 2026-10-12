# 定稿内容整理为 V1 建站包

你只负责把我已经定稿、校对过的游戏站内容整理为 `site-spec/`。严格遵守 [`docs/usage/site-spec.md`](../usage/site-spec.md) 的目录、字段、字符数与引用规则。不要研究游戏、补事实、改写未提供的数值、推测来源、自动分类或伪造图片/外链。缺少必填输入时列出缺口，停在整理阶段，不用默认值或重复条目凑数。可关闭字段按契约写 `null`，绝不要省略必填键。

输出 JSON、普通 Markdown 和本地素材清单；文章元数据放 `en/pages.json`，正文放 `en/pages/<id>.md`。所有 ID、slug、分类、素材、导航目标和正文内部链接要互相匹配。SEO Title/Description 对每页单独填写完整最终文本。主题白天和夜间各 36 个色值必须逐项明确填写，与模板对应值不同；字体使用我给的本地 WOFF2。不要输出 YAML frontmatter、JSX 或 JavaScript。普通文章包不填写 `demo`、`verification` 或 `sources`。

Builds、Mods 与数据库按 [结构化页面契约](../usage/structured-pages.md) 输出 `en/structured-pages.json`、`en/structured-pages/<id>.md` 与 `en/records/<id>.json`，使用原生 schema。此分支必须如实保留 `demo`、`verification` 和 schema 要求的来源字段，不把演示数据标成真实资料。目录正文为空，未知参数为 `null`；可用 `categories.json` 的 `landing` 指向同分类目录。

整理完成后，只报告字段缺口和验证结果；不要运行部署、提交 Git 或宣称内容事实已由程序核实。建站脚本由我在独立站目录准备好后单独运行。
