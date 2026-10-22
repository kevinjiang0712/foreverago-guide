# 20261022 已有内页策略迭代

范围来自 `research/竞争策略/内页优化策略_20261022.md`，保留三个既有URL及分类：review的game-length、walkthrough的photo-puzzle、guide的camera-achievements；现有导航入口不变，无新增同意图页。

## 内容与资料

- 时长：2026-10-22实际浏览HowLongToBeat详细Single-Player表。Main Story n=17、平均4h12m、中位4h13m；Main + Sides n=6、平均5h11m、中位5h10m；Completionist n=2、平均4h47m。明确分组独立、自报、小样本，保留3–5小时主线规划范围，不把完成型均值当全成就承诺。首屏补日期和样本数，重玩说明接现有完成清单。
- 谜题：五个卡点选择器直达既有正文真实锚点，按钮提交后将焦点移至标题；保留禁JS普通链接及可索引全部步骤。各目标段有配图，灯塔仅补用已核验的现有道路/塔身截图，无新增图片下载、播放器或依赖。
- 相机成就：按开场房间、Milton、灯塔、旅程累计排列六项操作块；相机模式、目标和离开前检查分开。两张既有截图分别补主体/自拍模式说明；六项均连接对应细节和完成清单。保留未验证跨章节计数与房间候选清单边界，不编造完整物件数。
- 本轮复用既有Jina/字幕处理素材，未添加新的游戏机制事实，不需要再次采集YouTube。新时长尝试指定Jina脚本仍ALL_API_KEYS_UNAVAILABLE、处理0；浏览器直接核对的统计回执放审计目录，不冒充Jina处理结果。指定research原始数据目录只接受成功处理内容，本轮没有新成功文件。
- 最终MDX保存至项目content/20261022（保留上一轮Steam/PS5两份，另加本轮三份），同步site/content和site-spec正文及元数据；不改母模板、schema、生成目录或.site-build.json，不整站重新生成。

## 性能措施与验证范围

- 三页正文不在水合时重新隐藏淡入，保留其他页面的原动效与本站布局；谜题工具使用原生select、button和真实链接，所有内容仍由服务器渲染。已有本地WebP、尺寸属性和延迟加载沿用，不新增全局第三方。
- 正式photo-puzzle调整前PageSpeed：Performance62、Accessibility100、Best Practices96、SEO100；FCP4.7s、LCP7.3s、TBT110ms、CLS0。链接：https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-walkthrough-forever-ago-photo-puzzle/uxiupfb6lo?form_factor=mobile 。这是Lighthouse实验室数据，没有真实用户CWV。

构建、浏览器、正式服务和PageSpeed回执均保存在本目录，最终结果如下。

## 本地验收

- check:content、prepare:theme、lint、typecheck、STATIC_EXPORT=1构建通过，47路由/40文章；三份改动的articleSpecSchema元数据均通过，保留原发布时间、更新日期为2026-10-22。
- 静态SEO：47路由与sitemap一致，4174处站内链接/锚点、124个本地资源、唯一TD、单H1、canonical、robots、WebPage/Article结构化数据检查无错误；不代表收录、排名、外链审计或字段CWV。
- Tabbit手机390px已实际选择灯塔并跳转/聚焦正确标题，桌面1440px查看相机操作与配图，无横向溢出。首轮no-JS测试连续从页尾自动回滚点击时受原站smooth-scroll稳定性影响超时；改为从独立初始页验证每条原生链接后4项策略测试全部通过，未强制点击、删除断言或改动产品滚动设置。
- 发布回归范围为site.spec.ts、search-navigation.spec.ts和strategy-iteration.spec.ts；旧首页轮播测试与既有任务式首页不符，本轮未改首页或重跑该旧文件，不称全部测试套件通过。

- 最终同批发布回归14/14通过，fresh lint/typecheck通过；完整命令与统计见release-tests.json。

- 时长来源内部差异：访问时HLTB顶部Completionist卡片显示6 Hours，详细表n=2、均值4h47m。其计算/缓存口径未确认。文章明确引用详细表的日期和样本，并不提供可信的全成就总时长；不能把顶部估计和两份自报记录混写成统一结论。


## 正式部署与服务

应用提交：`8643e64550b24e3174abdacd6b94c79f9004f27f`，GitHub main推送成功。Cloudflare生产部署：https://3f4c119b.foreverago-guide.pages.dev 。正式主机为 https://www.foreverago-guide.wiki 。

- 47/47正式HTML与本地out逐字节一致（仅允许Cloudflare beacon注入差异），sitemap47条，无noindex。production-routes.json保留逐URL校验摘要和SHA。
- 三页在390px和1920px共六组真实正式请求检查：GA4 page_view到G-1L7F54XGRR均204；Clarity collect均204；11张正文图片在两种屏宽均解码成功，无pageerror、横向溢出或展开空广告区。手机Anchor/Native/Inline、桌面Left/Native/Right共五类Adsterra脚本均真实请求并403，符合用户的代理环境例外。不把脚本接入当作广告填充或收入证明。
- 上述页面浏览含本次验收访问，不作为自然流量增长数据。
- 默认大批次上传连续两轮共六次HeadersTimeout；查询API正常且旧生产版本仍有效。仅在系统临时目录复制Wrangler4.151.3，把批次上限改为1MiB/20文件；先顺序验证成功，再以原标准并发3完成上传。API端点、授权、代理、正式CLI及母模板未改。最终293文件上传、160缓存复用，上传586.10秒。官方共享CLI部署前后SHA一致，详情见deployment-transport.json。CLI期间的未提交修改仅为审计回执，应用源码/内容与上述提交一致。

## 正式PageSpeed手机结果

| 页面 / 测次 | 性能 | 无障碍 | 最佳做法 | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| 游戏时长 | 92 | 100 | 96 | 100 | 1.8s | 3.2s | 60ms | 0.002 |
| 拍照谜题初测 | 62 | 100 | 96 | 100 | 4.1s | 7.5s | 140ms | 0 |
| 拍照谜题同版本确认 | 87 | 100 | 96 | 100 | 1.9s | 3.3s | 230ms | 0.001 |
| 相机成就 | 94 | 100 | 96 | 100 | 1.8s | 2.7s | 110ms | 0.048 |

- [游戏时长报告](https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-review-forever-ago-game-length/1gtxd5cv58?form_factor=mobile)
- [拍照谜题初测](https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-walkthrough-forever-ago-photo-puzzle/tidi7046xn?form_factor=mobile)
- [拍照谜题确认](https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-walkthrough-forever-ago-photo-puzzle/kwt62gfqx3?form_factor=mobile)
- [相机成就报告](https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-guide-forever-ago-camera-achievements/07ntwhn0lm?form_factor=mobile)

测试时间约2026-10-22上海21:36/21:42，Moto G Power、慢速4G、Lighthouse13.5.0。均为真实正式域名，广告和统计未关闭。报告没有真实用户CrUX数据，不能声称字段CWV通过。

谜题页初测LCP为首屏campfire-art-960.avif：已有eager、高优先级和响应式AVIF，报告资源加载延迟220ms、时长270ms、渲染延迟1880ms。相同应用未再改代码而复测87，说明波动明显；不能只摘取87分或把差异全部归因于某次改动，首屏图渲染和第三方执行仍有改善空间。时长和成就本轮只有上线后样本，不虚构其修改前得分或稳定提升幅度。

最终14项发布测试再次通过，正文可见性使用实际computed opacity断言。最终测试/审计提交不改变已发布应用产物；保留未测跨章节计数、时长样本/顶部卡片口径差异及Jina额度缺口。

正式站手机390px又逐项以Enter提交五个场景，URL锚点、标题焦点和视口定位5/5通过，见production-scene-navigation.json。
