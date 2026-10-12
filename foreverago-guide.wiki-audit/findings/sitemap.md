# Sitemap

结论：XML 有效，37 条 loc 恰好覆盖全部可索引路由；无重复、多余、noindex 或非 canonical 地址。

审计日期：2026-10-12（Asia/Shanghai）。对象：Cloudflare Pages 静态导出 `site/out`，对照 `.generated/content-index.json` 的 37 条正式路由。此处不把本地 Next 开发服务器作为生产 SSR 运行面。

## 已核验

- sitemap XML 可解析，命名空间为 sitemap 0.9；37 URLs，远低于 50,000 单文件限额。
- 地址全部 HTTPS、`www.foreverago-guide.wiki`；与各页 canonical 一一对应。
- 首页 1、分类 6、攻略 26、政策 4；404 与 `_not-found` 不在列表中。
- robots 明确声明 `https://www.foreverago-guide.wiki/sitemap.xml`。
- 26 篇文章 lastmod 与 content 的 `updatedAt=2026-10-12` 一致；本期同时首次发布，因此相同日期有真实输入依据，不应为做差异而伪造日期。没有日期的页面未编造 lastmod。
- 英语与 x-default alternates 指向相同正式页面，没有虚构其他语言入口。

静态预览 `http://localhost:4173`：37/37 页面 HTTP 200；robots 200（text/plain）、sitemap 200（application/xml）。113/113 独立本地资源 HEAD 200。

## 证据与边界

- [导出 sitemap.xml](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/sitemap.xml)、[导出 robots.txt](/Users/jiangchenxiang/Desktop/产品/forever ago/site/out/robots.txt)、[sitemap owning source](/Users/jiangchenxiang/Desktop/产品/forever ago/site/src/seo/sitemap.ts:4)、[内容索引](/Users/jiangchenxiang/Desktop/产品/forever ago/site/.generated/content-index.json)。
- [Google sitemap 官方文档](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)要求使用 canonical 与准确 lastmod；它没有要求同时更新的页面故意填写不同日期。
- 本地 XML HTTP 抓取已通过；本报告不证明正式域名 XML 可抓取或已提交、已收录；这些由上线后 GSC/Bing/Yandex 的实际结果确认。
