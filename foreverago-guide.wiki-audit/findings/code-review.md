# 代码审查

结论：本轮静态审查没有发现已证实的 Critical / Important 问题。

## 范围与基准

- 项目：`/Users/jiangchenxiang/Desktop/产品/forever ago/site`。
- 基准：Game Wiki Design System 提交 `ec8eb1fa0a0ceb3749b47c91b661ea713db2effc`。
- 通过 `git show <SHA>:<文件>` 与新站当前文件精确比较；新站尚无 HEAD，不使用新站 Git diff 推断变更。
- 范围：catch-all layout/page、SiteAnalytics、SiteHeader、navigation、robots、sitemap、next.config.mjs，以及 package.json 依赖补丁。
- 已读项目 AGENTS.md 和已安装 Next 16.3.8 的 Script、静态导出、generateStaticParams、layout 文档及 Script 当前实现。

## 核对结果

- `src/components/chrome/SiteAnalytics.tsx:21-23`：NODE_ENV production 才输出 Script；Script 使用固定 id、afterInteractive 和可序列化的纯字符串，没有传服务端函数给客户端。
- `src/components/chrome/SiteAnalytics.tsx:4-18`：精确 hostname 白名单；GA4 ID 为 `G-1L7F54XGRR`，Clarity ID 为 `ywlgmczujj`。Node VM 实测两个正式域名分别插入两个供应商 script、GA 队列仅一次 js/config；localhost、127.0.0.1、preview 和伪后缀域名均不加载且不排队。
- `node_modules/next/dist/client/script.js:69-75`：LoadCache 按 id/src 阻止重复执行。该站未注册额外 page_view、路由事件或 onReady 初始化，不存在源码可确认的客户端重挂载重复 config。
- `src/app/[[...segments]]/layout.tsx:10`：固定 data-mode=night；去掉本地偏好注入。`src/components/chrome/SiteHeader.tsx:25` 去掉唯一切换入口；未发现其余已引用的 ModeToggle。
- `src/content/navigation.ts:18-21`：统一 Brand logoSrc=/favicon.ico，header、mobile drawer、footer 共用 Brand。public/favicon.ico 与项目根 favicon.ico 字节相同。
- `src/app/[[...segments]]/page.tsx:9-17`：dynamicParams=false；generateStaticParams 从统一索引生成当前全部 37 路由；metadata 和内容解析同一索引。
- `src/app/robots.ts:4`、`src/app/sitemap.ts:3`：force-static 与静态导出要求一致。当前 37 路由均 indexable。
- `next.config.mjs:7-13`：STATIC_EXPORT=1 使用 output=export，图片禁用在线优化；遇到非空 redirect 清单会明确失败，无静默丢失 redirect。
- package.json、package-lock.json 和 node_modules 中 next/eslint-config-next=16.3.8、sharp=0.35.5 一致；@next/env/@next/mdx=16.3.5 未改，未发现可证实的补丁兼容问题。
- src/components/ads 下全部 9 个文件与基准逐字节相同，直接加载广告方案未被本次代码改动改变。

## 构建产物补查

- out 就绪后逐一检查了 37 个真实路由 HTML：文件齐全、title/description/robots/canonical 齐全、固定 night、favicon.ico 和 analytics RSC 字符串均存在。
- robots.txt 允许抓取并指向正式 sitemap；sitemap.xml 包含 37 个 loc。
- out/404.html 存在，使用 Next 全局 404，标题为 404: This page could not be found.，包含 noindex。

## 验证限制

- 已独立核验最终静态 HTML 和 metadata；未独立核验 HTTP 404、移动端布局或真实客户端导航。
- 需在最终预览覆盖“直接请求不存在路径”及“客户端跳到不存在路径”的响应状态；静态产物使用 Next 全局 404，未出现自定义 LocaleContext 渲染失败。
- 真实 GA4 page_view 次数还受供应商脚本和该 GA 属性 Enhanced Measurement 配置影响；此处仅证明源码没有额外重复上报路径，不能替代浏览器网络记录。
- 广告真实填充与后台统计入库不在本轮代码审查的证明范围。

Minor：SiteHeaderModel 的 siteId/defaultMode 已无消费，可后续按需清理，不阻断。

## 追加：全局 404

已复审新增 `src/app/global-not-found.tsx:1-17` 与 `next.config.mjs:12`；符合当前 Next 全局 404 文档，theme/favicon/analytics/noindex 齐全，未知路由的广告 Provider 禁用。新构建产物由父任务验收。本地多尺寸布局和策略页广告禁用检查见 `layout.md`。

## 追加：Hero 图片优先加载

结论：仅复审 `src/components/content/Media.tsx` 和 `src/templates/article-page/ArticlePage.tsx` 的新增变更，无 Critical / Important 发现。

- 与锁定母模板 SHA 精确对比，Media 仅增加 eager 布尔参数和 hero/inner-hero 推断，首屏图设置 loading=eager、fetchPriority=high；普通 figure/card 等继续 lazy。
- `Media.tsx:3-8` 保留 width/height、alt 校验、sizes、objectPosition、class 和 ratio，不影响图片占位或已有 CSS 布局；未使用已弃用的 priority，也未混用 preload。
- `ArticlePage.tsx:50` 仅给既有 article hero 的 Media 显式 eager；该调用保留原来的默认 figure variant，避免改变 CSS 选择器。
- 已核对安装版 Next 16.3.8 Image 文档中 preload/loading 段落，以及当前 get-img-props 实现；该 eager/high 组合合法。通过 getImageProps 直接核验，首屏输出 eager/high，普通图输出 lazy/无 fetchPriority，1600×900 占位尺寸保留。
- 此轮不重复布局测试；压缩图质量、重建及 Lighthouse 前后指标由父任务验证。源码正确不能单独证明 LCP 改善。
