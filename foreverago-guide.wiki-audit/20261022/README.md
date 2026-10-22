# 20261022 Steam / PS5 内页验收

- 范围：两个平台信息页；沿用 guide 分类及 Game Info 菜单，不改框架、不改首页楼层。
- 内容：独立代理逐项对照官方 Steam、美国 PS Store 和发行商资料；未知帧率、Deck 徽章、跨平台存档不作事实。两张正文官方游戏截图分别压为1600×900 WebP，64,718 / 50,806字节。无首屏图片、视频播放器或新增JS依赖；正文图延迟加载、显式宽高。卡片与SEO合理复用已核验非截图插画，未新增首页卡位。
- 采集限制：指定 Serper、Jina 均 ALL_API_KEYS_UNAVAILABLE，Jina成功正文0；YouTube搜索3次均代理预检超时，无合法视频输入，因此extract_transcripts未运行。官方备用网页仅在系统临时目录供本次写作，未冒充Jina处理数据。最终content/20261022仅两份MDX。
- check:content / prepare:theme / lint / typecheck / STATIC_EXPORT=1 build：通过。内容47路由、40篇文章（含政策）。两页site-spec元数据分别通过articleSpecSchema。
- 静态SEO：47/47路由与sitemap一致，TD唯一，canonical正确，无坏内链，112个本地资源HTTP200；HTML包含唯一H1、WebPage与对应Article/Breadcrumb。装饰品牌图和已有视频按钮缩略图按其可访问名称允许空alt，不要求重复朗读。
- 浏览器：现有发布回归10/10通过；另对新增页完成真实手机上下文、桌面、正文图片decode、手机导航及站内搜索；允许正式主机的受控测试中GA4、Clarity和各设备广告位触发，模拟403不产生空广告区。这不是实际平台填充或后台收数验收。
- 旧home-carousel.spec.ts：2失败、1中断、4未运行；定位为既有首页早已不渲染该旧测试要求的.home-featured-track-set结构。当前HEAD和本轮源码相同，本轮未改首页。没有删除测试、修改测试或将其写成通过。当前站发布导航/搜索/无JS路由测试另行通过。
- 本地Lighthouse：Steam 70、PS5 71，Accessibility / Best Practices / SEO均100。预览HTTP未压缩，服务按主机保护不加载正式第三方，不能把它当正式域名或字段CWV。原始JSON与摘要保存。公开PageSpeed与正式第三方验证待部署完成后补记。
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
