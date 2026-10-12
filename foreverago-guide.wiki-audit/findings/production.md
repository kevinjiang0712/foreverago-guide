# 正式域名 HTTP 审计

结论：正式域名的 37 页、113 个自有静态资源、sitemap、robots、404 和重定向均通过 HTTP 核验。政策邮箱改写已通过定点复测确认解决；本轮正式 HTTP 审计没有未解决发现。

- 首轮时间：2026-10-12 23:24:57（Asia/Shanghai）；四政策定点复测：23:34:43。
- Release：`a6c3d994fb8ed52c4b694ff40ba06a3a32e30f8c`；父 Agent 提供的 deployment 为 `https://b8ed83ee.foreverago-guide.pages.dev`。
- 正式地址：`https://www.foreverago-guide.wiki/`。
- 方法：纯 curl GET/HEAD，最大并发 4；直接连接、启用 TLS 证书校验，不执行 JS、不请求广告或统计端点、不操作后台浏览器。

## 核验结果

| 项目 | 结果 |
| --- | --- |
| 正式页面 | 37/37 HTTP 200，HTML content type 正确 |
| 自有静态资源 | 113/113 HEAD 200 |
| Canonical | 37/37 自指正式 www HTTPS 地址 |
| Robots meta | 正式页没有意外 noindex |
| GA4 / Clarity | 37 页 HTML 均包含 G-1L7F54XGRR / ywlgmczujj |
| Favicon / 夜间 | 37 页均引用 /favicon.ico、data-mode=night；favicon 二进制与项目输入相同 |
| sitemap.xml | HTTP 200 / application/xml；37 loc 恰好覆盖全部正常路由，无重复、多/漏 |
| robots.txt | HTTP 200 / text/plain；允许抓取，引用正式 sitemap |
| 不存在路径 | HTTP 404、noindex、无 canonical；favicon/night/禁广告/两统计 ID 均存在 |

资源初次有 4 个请求未完成：3 个 Next 方括号路径被 curl 当作 glob、1 个连接超时。对这 4 个请求修正编码/关闭 glob 或重试后均 200；原始失败与复测结果保存在 JSON，没有将工具错误当作站点 404。

## 重定向

四次均为 301；`/guide/forever-ago-gameplay?keep=1&from=audit` 的路径及 query 保留。

- HTTPS 根域名 → HTTPS www；根路径加 query 也保留。
- HTTP www → HTTPS www。
- HTTP 根域名 → HTTPS 根域名，再经上述根域名规则 → HTTPS www。这是两个已核验的 301 步骤，不描述成一个 hop。

## 已解决：政策页邮箱被 Cloudflare 改写

首轮 `/about`、`/contact`、`/privacy`、`/terms` 正文邮箱被 Cloudflare 保护改写，导致无 JS 阅读者看到 `[email protected]`。父 Agent 已对本站 zone 关闭 EmailAddressObfuscation。

23:34:43 仅重抓上述四页：4/4 HTTP 200，移除脚本后的 main 正文均可读取 `kevinjiang0712@gmail.com`；原始 HTML 均无 `__cf_email__`、`data-cfemail` 或 `email-decode` 脚本。四页正文 SHA-256 均与发布用 out 相同，当前已核验的 HTML 一致性由 33/37 升至 37/37。原始发现及解决状态保留在 JSON，Low 已关闭。本次未重复全量页面或资源抓取。

## 证据与边界

原始响应状态、headers、字段检查、重定向 Location、重试及 hash 记录见 [production-http.json](</Users/jiangchenxiang/Desktop/产品/forever ago/site/foreverago-guide.wiki-audit/production-http.json>)。

HTML 中存在统计 ID 只证明安装代码可取得，不证明后台已收数。广告展示/收益、GSC/Bing/Yandex 提交与收录、field CWV 不在本轮纯 HTTP 结果中，由对应实际验证单独确认。
