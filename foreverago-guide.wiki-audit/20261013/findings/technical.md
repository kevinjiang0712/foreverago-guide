# 技术 SEO 审计 · 2026-10-13

结论：本地生产静态导出未发现爬取、规范 URL、站内链接或无 JS 正文的阻断问题。

- 范围：`http://127.0.0.1:3189`，43 个正式路由；43/43 返回 200，各有一个 H1、`lang=en`、唯一且非空的标题与摘要、viewport、自指向生产域 canonical、`index, follow`。
- 实际检查 3,630 个站内 href 与 518 个锚点引用：无不存在的路由或锚点，无重复 DOM ID。32 篇攻略均有导航入口，包括新增 6 页。
- robots 允许抓取并声明生产 sitemap。未知路径返回真实 404，同时包含 noindex。
- 禁用 JS、320px 浏览器抽查 tracker、memory、Snooping 与完整 walkthrough：正文可见，动画未隐藏正文，无横向溢出。Tracker 初始 HTML 包含完整 53 项和 53 个解法链接；存储和筛选属于渐进增强。
- 已修复：工具的字体尺寸／字重／行高使用现有令牌；移除装饰侧条；过滤控件 label 与 select 拆开，以避免标签 DOM 文本混入选项。交互重测由主任务 E2E 负责。
- 广告与统计：所有新路由沿用全局 AdProvider、GA4 `G-1L7F54XGRR`、Clarity `ywlgmczujj`。localhost 不在供应商允许域名内，因此此本地爬取不能证明外部脚本、广告创意或真实采集成功。允许域名模拟网络验证与生产实测由主任务负责；代理下 Adsterra 403 按用户说明处理。

证据：`technical-checks.json`、`nojs-checks.json`、`source-schema-checks.json`。seo-audit 自带 renderer 的安全规则拒绝 localhost；未修改规则，改用限定本地导出的 HTML crawl 与 Playwright。

边界：本次不证明 Google 收录、自然流量、广告填充、真实 GA4/Clarity 会话、线上 HTTPS／安全响应头或现场 CWV。43 个 indexable 路由不是 43 个已收录页面。
