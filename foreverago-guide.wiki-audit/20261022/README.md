# 20261022 Steam / PS5 内页验收

- 范围：两个平台信息页；沿用 guide 分类及 Game Info 菜单，不改框架、不改首页楼层。
- 内容：独立代理逐项对照官方 Steam、美国 PS Store 和发行商资料；未知帧率、Deck 徽章、跨平台存档不作事实。两张正文官方游戏截图分别压为1600×900 WebP，64,718 / 50,806字节。无首屏图片、视频播放器或新增JS依赖；正文图延迟加载、显式宽高。卡片与SEO合理复用已核验非截图插画，未新增首页卡位。
- 采集限制：指定 Serper、Jina 均 ALL_API_KEYS_UNAVAILABLE，Jina成功正文0；YouTube搜索3次均代理预检超时，无合法视频输入，因此extract_transcripts未运行。官方备用网页仅在系统临时目录供本次写作，未冒充Jina处理数据。最终content/20261022仅两份MDX。
- check:content / prepare:theme / lint / typecheck / STATIC_EXPORT=1 build：通过。内容47路由、40篇文章（含政策）。两页site-spec元数据分别通过articleSpecSchema。
- 静态SEO：47/47路由与sitemap一致，TD唯一，canonical正确，无坏内链，114个本地静态资源存在且引用有效；HTML包含唯一H1、WebPage与对应Article/Breadcrumb。装饰品牌图和已有视频按钮缩略图按其可访问名称允许空alt，不要求重复朗读。
- 浏览器：现有发布回归10/10通过；另对新增页完成真实手机上下文、桌面、正文图片decode、手机导航及站内搜索；允许正式主机的受控测试中GA4、Clarity和各设备广告位触发，模拟403不产生空广告区。这不是实际平台填充或后台收数验收。
- 旧home-carousel.spec.ts：2失败、1中断、4未运行；定位为既有首页早已不渲染该旧测试要求的.home-featured-track-set结构。当前HEAD和本轮源码相同，本轮未改首页。没有删除测试、修改测试或将其写成通过。当前站发布导航/搜索/无JS路由测试另行通过。
- 本地Lighthouse：Steam 70、PS5 71，Accessibility / Best Practices / SEO均100。预览HTTP未压缩，服务按主机保护不加载正式第三方，不能把它当正式域名或字段CWV。原始JSON与摘要保存。公开PageSpeed与正式第三方验证见下。
- 增量维护按当前站docs/usage/maintenance.md，以已上线内容为基准新增文章/配置，并同步对应site-spec条目；未整站重新生成，也未改动.site-build.json或母模板，以保护既有上线优化。

## 公开 PageSpeed 预览

预览部署：https://3a027e68.foreverago-guide.pages.dev ，Cloudflare 自动下发 X-Robots-Tag:noindex，保留此保护，不把预览阻止索引当生产错误。

| 页 | 手机性能 | 无障碍 | 最佳做法 | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Steam | 94 | 100 | 100 | 69 | 1.7s | 2.6s | 50ms | 0 |
| PS5 | 94 | 100 | 100 | 69 | 1.7s | 2.6s | 20ms | 0 |

- Steam：https://pagespeed.web.dev/analysis/https-3a027e68-foreverago-guide-pages-dev-guide-forever-ago-steam/73lk1gw1s3?form_factor=mobile
- PS5：https://pagespeed.web.dev/analysis/https-3a027e68-foreverago-guide-pages-dev-guide-forever-ago-ps5/w06tb8fgj2?form_factor=mobile
- 采集约2026-10-22 20:27上海时间，Lighthouse13.5.0、Moto G Power、慢速4G；无真实用户数据。预览主机保护未请求正式广告/统计，不能代表正式主机第三方成本。
- 性能措施：沿用无首屏播放器的原生文章布局；新增正文图分别从约291/392KiB原图缩至64,718/50,806B WebP、1600×900、lazy与固定比例，不加新依赖。没有用关闭正式广告/统计换分数。


## 正式站验证与性能调整

- 首次内容发布：应用提交 `33e3a1a61d9716ccde17cbc17cb64ea0bbbbbb7b`，GitHub main 已读回一致，Cloudflare生产部署 https://a3bcbbf5.foreverago-guide.pages.dev 。正式47/47路由HTTP200、HTML与构建一致（仅允许Cloudflare beacon注入），sitemap47条，未下发noindex；根域301保留路径和查询参数。
- 两页真实生产请求：GA4标签200、page_view 204，Clarity标签/运行脚本200、collect204。GA4实时报告两页各出现1个页面浏览及1个活跃用户，这些包含本次验收访问，不代表自然流量。Adsterra手机Native/Anchor/Inline脚本实际403，符合用户说明的代理环境；失败位收起，无横向溢出。桌面最终正式版另行实测Native/Left/Right均真实请求并返回403，GA4/Clarity采集204，无页面异常或横向溢出；不能把脚本请求称为实际广告填充。
- 正式PageSpeed调整前：Steam和PS5手机性能均64，无障碍100、最佳做法96、SEO100；Steam FCP4.1s/LCP7.0s/TBT70ms/CLS0，PS5 FCP4.1s/LCP6.7s/TBT60ms/CLS0。最佳做法扣分包含广告脚本403控制台错误，未通过拦截广告掩盖。
- PSI关键请求链发现正文粗体figtree-700和章节标题outfit-600字体在文档后发现。仅对普通文章页增加本地字体预加载，政策/首页/分类的初始HTML保持原三份预加载；Next路由预取在水合后可能为它们插入文章字体preload，因此不能声称运行时完全不出现这些请求。浏览器确认文章五个唯一字体URL均只下载一次，新字体在导航后约30ms开始；构建中React重复输出preload标签为原有现象，不据此推断重复下载。
- 字体调整应用提交 `f42a84c280b900f70e62e905ff5889401edb5229`。lint、typecheck、静态构建和10项发布回归重新通过；静态全站SEO47/47，114个本地资源引用有效。正式域名调整后结果另见下表。


| 正式站手机复测 | 性能 | 无障碍 | 最佳做法 | SEO | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- |
| Steam | 63 | 100 | 96 | 100 | 4.2s | 6.7s | 120ms | 0 |
| PS5 | 64 | 100 | 96 | 100 | 4.1s | 7.0s | 60ms | 0 |

- Steam复测：https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-guide-forever-ago-steam/gkgezmwpqj?form_factor=mobile
- PS5复测：https://pagespeed.web.dev/analysis/https-www-foreverago-guide-wiki-guide-forever-ago-ps5/do16o9r4jt?form_factor=mobile
- 2026-10-22 20:45上海时间，Moto G Power/慢速4G/Lighthouse13.5.0。没有字段数据。单次前后测试存在波动，字体预加载未证实整体性能提分；LCP仍偏慢，不能声称达到优秀或CWV通过。图片压缩、延迟加载、固定比例和字体发现提前均已落地，未改变统计与广告加载以制造高分。
- 最终应用版本 `f42a84c280b900f70e62e905ff5889401edb5229`，生产部署 https://cf36774f.foreverago-guide.pages.dev 。部署后47/47 HTML与本地out一致、sitemap47、无noindex；桌面两页正式服务请求和零溢出/零pageerror见production-desktop-services.json。审计回执后续提交只更新文档，不改应用产物。

- 调整后PSI展开诊断：关键请求链不再包含上述两字体，链长从原约682ms降到308ms；LCP元素仍为首段正文，其未节流渲染延迟约2390ms。Google Tag约177KiB/188ms主线程、Clarity约28KiB/87ms；这些是本次诊断观察，不能据此把全部LCP延迟归因于某一第三方。完整文本见pagespeed-production-diagnostics.txt。
