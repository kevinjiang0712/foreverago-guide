# 增加语言或翻译指定页面

```text
请给当前站增加【目标语言】，翻译范围为【首页/指定内容 ID 清单】。
阅读项目 AGENTS.md、docs/usage/languages-and-seo.md、
docs/usage/template-fields.md、源语言内容和对应 schema 后执行。

只修改配置、内容和必要素材登记，不改页面组件与样式。
如果是新增语言，在 config/site.json 启用该语言，并填写该语言的完整公共字典、
分类说明、官方链接标签、页脚及首页；公共字典不回退为英文。

保留所有内容 id、category ID、template、records ID、关系目标 ID、素材 ID、
sources、verification、demo、status 和事实数值，不因为翻译而提高确认等级。
文件路径与 frontmatter/record 的 locale 都改为目标语言。
翻译可见标题、文案、表头、筛选选项标签、关系说明、素材 alt 和无障碍标签。
slug 可以本地化，但同语言路径不得冲突。不要翻译稳定引用 ID。

为每篇页面创建必要的同语言 records，保证全部关系和站内链接可解析。
保留来源网址和来源事实；原文存在未知或冲突信息时，译文也明确保留。
没有被选入翻译范围的文章不要创建占位页面，更不要复制原文来充数。

完成后运行 npm run check:content 和构建检查，并实际验证：
- 目标语言页面的 HTML lang、标题、正文和公共导航；
- 语言切换指向真实对应文章；
- 未翻译文章显示明确状态，未知语言路径返回真实404；
- 正式模式的 canonical/hreflang/sitemap 只关联实际可索引翻译；
- demo/preview 继续 noindex，不为看到 hreflang 而修改示例发布标记。

最后列出新增语言、翻译内容 ID、生成网址、未翻译清单及真实检查结果。
不部署，不推送远程。
```
