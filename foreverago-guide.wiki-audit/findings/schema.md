# Structured Data

结论：37 个 JSON-LD 图均可解析，页面类型与公开内容一致；未发现本轮规则核验错误。

审计日期：2026-10-12（Asia/Shanghai）。对象：Cloudflare Pages 静态导出 `site/out`，对照 `.generated/content-index.json` 的 37 条正式路由。此处不把本地 Next 开发服务器作为生产 SSR 运行面。

| 类型 | 数量 | 对应页面 |
| --- | ---: | --- |
| WebSite | 37 | 每页统一站点标识 |
| WebPage | 37 | 每页 URL、名称、说明 |
| BreadcrumbList | 36 | 首页外页面，至少两级 |
| ItemList | 6 | 六个分类，条目数与内容索引一致 |
| Article | 26 | 攻略文章；作者 Kevin、日期和主图与 owning content 一致 |

## 已核验

- 外层 `@context=https://schema.org`；JSON 无解析错误；URL/标识使用正式主地址。
- WebPage URL 与 canonical 一致；Article headline 与 H1 一致，author、datePublished、dateModified 与生成内容一致。
- Article 图片为本域 `/media/` 绝对 URL；相关文件在静态资源检查中存在。
- Breadcrumb 的 ListItem、position、name、item 完整且顺序正确。
- About/Contact/Privacy/Terms 只使用 WebPage 与 breadcrumb，没有冒充作者文章、产品评分或官方公司。
- 未生成 HowTo、Review rating、AggregateRating、FAQPage；没有虚构评分、销量、公司身份或富结果承诺。

## 证据与边界

- [JSON-LD owning source](/Users/jiangchenxiang/Desktop/产品/forever ago/site/src/seo/structured-data.ts:5)。
- 实页例：[gameplay HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/guide/forever-ago-gameplay.html)、[分类 HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/guide.html)、[隐私 HTML](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/privacy.html)。
- 依据 [Google Article 文档](https://developers.google.com/search/docs/appearance/structured-data/article) 与 [Breadcrumb 文档](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)核对类型和属性。Article 无强制属性，本文不把可选推荐项缺失当成错误。
- 本轮是初始 HTML 的语法、值与页面一致性检查；未运行 Google Rich Results Test，不证明 Google 接收、展示富结果或收录。
