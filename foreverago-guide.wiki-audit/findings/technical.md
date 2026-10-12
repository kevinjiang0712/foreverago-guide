# Technical SEO

结论：未发现当前静态导出中的索引阻断或失效站内目标；保留一项首页 FAQ 渐进增强问题。

审计日期：2026-10-12（Asia/Shanghai）。对象：Cloudflare Pages 静态导出 `site/out`，对照 `.generated/content-index.json` 的 37 条正式路由。此处不把本地 Next 开发服务器作为生产 SSR 运行面。

## 已核验

- 37/37 正式路由均有导出 HTML，正式内容均为 `index, follow`；两个错误页均 `noindex`，不计入正式路由。最终缺失路径实际返回 HTTP 404；404 HTML 使用 `/favicon.ico`、`data-mode=night`、`data-ad-mode=disabled`，包含本站 GA4 与 Clarity IDs。代码存在不等于正式域名后台收数已证实。
- 37 个 canonical 均是 `https://www.foreverago-guide.wiki` 加各自路由，无 localhost、根域名或其他站残留。
- robots 允许抓取并指向正式 sitemap；HTML 均有 `lang=en` 与 viewport。
- 2078 个站内链接引用、37 个独立页面目标均能在路由/文件中解析；fragment 引用无缺失。从首页按真实 anchor 链接到各页面最多 2 次。
- 953 个本地资源引用、113 个独立资源均在导出目录存在；检查含图片、script、stylesheet、icon、preload，未发现缺失文件。
- 26 篇攻略初始 article HTML 均有至少 1,500 个英文词；H1、正文、元信息及 JSON-LD 不依赖客户端插入。Reveal 的无 JS 默认状态可见。

静态预览 `http://localhost:4173`：37/37 页面 HTTP 200；robots 200（text/plain）、sitemap 200（application/xml）。113/113 独立本地资源 HEAD 200。

禁 JS 实测：37/37 页面 H1 可见、main 存在、canonical 正确；26 攻略 article 的可读取 innerText 最少 1,561 英文词。测试使用本地独立无头 Chromium，没有操作后台浏览器。

## 低优先级：无 JavaScript 时首页 FAQ 不能展开

首页四答案在初始 HTML 中均有文本，但答案区域 `inert`、`aria-hidden=true`，问题按钮仅通过 JavaScript `onClick` 改变 `openIndex`。禁用 JavaScript 后无法展开这些答案。正文攻略、首页简介和链接不受此问题影响，因此不是全站索引阻断。

实际复核：Chromium desktop 1280×900、`javaScriptEnabled:false`。四答案区域初始高度均为 0，点击第一问题后仍为 0 且 inert/aria-hidden 保持 true。

证据：[HomeFaqAccordion.tsx](</Users/jiangchenxiang/Desktop/产品/forever ago/site/src/templates/site-home/HomeFaqAccordion.tsx:13>)；[首页导出 HTML](</Users/jiangchenxiang/Desktop/产品/forever ago/site/out/index.html>)。建议：保留当前视觉的前提下，用原生可展开元素或明确的无 JS 可读回退。审计未修改源码。

## 证据与边界

- [robots.txt](</Users/jiangchenxiang/Desktop/产品/forever ago/site/out/robots.txt>)、[404.html](</Users/jiangchenxiang/Desktop/产品/forever ago/site/out/404.html>)、[内容索引](</Users/jiangchenxiang/Desktop/产品/forever ago/site/.generated/content-index.json>)。
- [metadata 生成](</Users/jiangchenxiang/Desktop/产品/forever ago/site/src/seo/metadata.ts:15>)、[Reveal 默认渲染](</Users/jiangchenxiang/Desktop/产品/forever ago/site/src/components/motion/Reveal.tsx:15>)。
- 尚未取得 field CWV、Google 索引或生产安全响应头证据；不据此给出健康评分或排名结论。
