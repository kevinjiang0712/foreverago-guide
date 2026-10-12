# Forever Ago 上线前 SEO 审计

2026-10-12；目标 https://www.foreverago-guide.wiki/ 。独立站基于锁定母模板 ec8eb1fa0a0ceb3749b47c91b661ea713db2effc，母模板工作区未改动。

## 结论

内容、索引控制、站点地图、结构化数据、链接、资源、手机布局与关键交互均通过上线前验证，无 Critical / High 发布阻断项。首页无 JavaScript 时四个 FAQ 答案不能展开（Low）；攻略正文与导航仍完整静态可读。

手机性能已据实测修正 Hero 延迟加载和宣传图过大：首页实验室 Performance 58→79，LCP 7.28→2.85 秒，TBT 696→379 毫秒，CLS 0.0010，SEO 100。LCP 与 TBT 尚未达到理想阈值，作为性能限制保留，不能称全部性能通过。攻略页实验室 Performance 64→99，LCP 6.03→2.18 秒、TBT 516→61 毫秒、CLS 0.0295，SEO 100。前后测详情见 findings/performance.md。

## 已验证范围

| 范围 | 实际证据 |
| --- | --- |
| 最终内容 | 26篇MDX、45,694可见英文词、95张正文WebP；原生校验0 errors/0 warnings。Old Bones六点、Hidden范围、Controls实际手柄提示和Collectibles跨页错误已修复 |
| 正式路由 | 37页：主页1、分类6、攻略26、政策4；实际本地HTTP200 |
| 元信息 | Title 50–59字符、Description150–160字符，TDH唯一；每页唯一H1，自指www canonical、index/follow |
| 站点地图 | 37个正式canonical URL，无漏项/重复/noindex，robots允许抓取并声明正式sitemap |
| 结构化数据 | WebSite37、WebPage37、Breadcrumb36、ItemList6、Article26；全部JSON-LD可解析，与拥有数据源一致 |
| 链接与资源 | 2,078个站内链接覆盖37目标，抓取深度最大2；953资源引用/113唯一资源，全部存在；最终HTTP结果见technical报告 |
| 无JS内容 | 37页实测可见H1/main/canonical；26篇初始攻略正文完整。FAQ交互限制单列 |
| 404 | 未知路径真实HTTP404，noindex；favicon、night、GA4/Clarity均覆盖，广告disabled；不入sitemap |
| 桌面/手机 | 22组1920/1680/1440/1280/390/320与短视口无横向溢出；菜单、Escape、固定夜间、3处favicon通过 |
| 关键交互 | 真实预览首页轮播7/7；广告直接脚本runtime8/8；广告/SEO/生产保护29个unit test通过 |
| 三方接入 | GA4 G-1L7F54XGRR、Clarity ywlgmczujj位于共享布局和404，正式主机保护；GA4后台历史路由变化采集checked。Adsterra5个Active单元与模板类型/尺寸/完整组件一致，无外层iframe |
| 工程 | content、theme、lint、typecheck、STATIC_EXPORT构建通过；生成目录未手改、校验未关闭 |
| 依赖 | 新站Next16.3.8/sharp0.35.5/source-map-js1.2.2补丁更新；生产npm审计0 critical/0 high，4 moderate为受信任本地构建解析依赖 |

## 资料、图片和真实性

- 英文攻略基于本地清洗研究、官方Steam/Annapurna/Epic信息与实际玩法视频；不虚构亲测、未知坐标/控制/隐藏flag/完成时长。
- 95张游戏截图仅在正文。Hero、卡片、主图和SEO图只使用有来源的两张游戏宣传插画，构图交替；无AI生成图。图片压缩后已检查清晰度与实际桌面/手机裁切。
- 不把内容字数、HTTP成功或提交请求当成排名、索引、广告填充或收益证据。

## 证据文件

- findings/content.md：26篇内容、搜索意图、事实边界与配图审计。
- findings/technical.md、on-page.md、schema.md、sitemap.md：全量静态/HTTP/无JS检查。
- findings/layout.md、layout-results.json、screenshots/：实际浏览器布局。
- findings/code-review.md：独立代码复审及Hero最小修复。
- findings/performance.md、lighthouse/：相同手机节流配置的实验室前后测。

## 上线边界

本报告记录上线前实测；生产HTTPS、正式统计网络、广告供应商响应、GSC/Bing/Yandex提交将在发布后另记，不以本地预览代替。localhost保护未加载正式广告/统计，实验室数据不包含正式域名完整第三方成本；真实字段CWV尚无数据。Yandex Webmaster当前官方页面报告数据中心故障，提交仍未完成。

## 发布后结果

- Cloudflare Pages发布完成，应用提交a6c3d994fb8ed52c4b694ff40ba06a3a32e30f8c；部署https://b8ed83ee.foreverago-guide.pages.dev，正式www域名可访问。
- 正式37页、113自有资源、robots/sitemap、404与301路径/query均实查；详见findings/production.md。四政策边缘邮箱保护的可读性Low已关闭，政策正文邮箱直接可见且37/37页面HTML与out一致。
- GA4与Clarity实际collect HTTP204，SPA进入攻略后page_view自动发送且标签/config没有重复；详见findings/integrations-and-submissions.md。
- Adsterra完整5单元直载，无外层iframe；5个供应商脚本实际403，符合用户代理环境说明；真实fill/收益未知。
- GSC sitemap提交并完成用户指定的XML实时抓取成功验收；首页/成就总表索引请求已接受。Bing sitemap和37网址请求已接受。提交不是已索引证据。
- 唯一尚未执行的服务步骤：Yandex Webmaster.com/.ru官方故障，站点地图/索引提交仍未完成；未将整个目标标为已完成。
