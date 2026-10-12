# 正式统计、广告与提交核验

2026-10-12，真实 Tabbit 浏览器，目标 https://www.foreverago-guide.wiki/ 。本轮浏览器访问为发布验收，不作为自然流量或增长证据。

## GA4 与 Clarity

- GA4媒体资源558454403、Web数据流16113083643、G-1L7F54XGRR；Clarity项目ywlgmczujj，后台项目名称均Forever Ago Wiki。
- 正式首页：GA4 gtag.js HTTP200、page_view /g/collect HTTP204；Clarity tag与runtime HTTP200、/collect HTTP204。未发现pageerror。
- 点击首页Start the Journey原生链接进入/guide/forever-ago-gameplay后，GA4收到第二个page_view，dl分别为主页与该详情页；两页均只有一个Google脚本、一个Clarity脚本，config调用保持一次。
- GA4后台增强型衡量与浏览器历史记录页面变化已开启；后台实时卡显示2个活跃用户，仅证明测量接收，来源不能当作自然流量。
- SiteAnalytics位于共享RootLayout及全局404；正常37页面与404 HTML均核两ID。新增/迭代页继续从统一路由索引生成并继承共享布局，无需逐页加统计。
- Clarity采集已实际返回204；录屏/热图处理完成及后续汇总指标未冒充已验证。

## Adsterra

本站后台5个Active单元，对应完整母模板方案：Native（后台1:2布局）、300×250 inline、160×300 left、160×600 right、320×50 anchor；正式生成配置域名与5个真实key/script一致。

- 桌面1920×1000实际加载Native/left/right，左右画布160×300和160×600；窄屏390×844加载anchor、近视口inline，anchor画布320×50。
- 五个真实供应商脚本全部发起请求，返回403；按用户说明属于本次代理环境正常供应商屏蔽，不记为站点失败，也不声称广告fill/曝光/收益。
- 全部9个广告实现文件与锁定母模板逐字节一致。真实DOM中iframe[srcdoc]为0，加载脚本位于页面document；没有增加外层iframe。供应商创意iframe机制保留。
- 真实手机设备参数夹具的按需加载/关闭测试及桌面直接脚本队列等8项浏览器测试通过；实际正式站无横向溢出。4政策页/404广告禁用。

## 提交记录

| 服务 | 已执行与实际结果 |
| --- | --- |
| GSC | 网域资源sc-domain:foreverago-guide.wiki DNS验证成功；正式www sitemap.xml已成功提交。初始汇总行为“未知/无法抓取”，未当作已解析；实时XML检查23:23:17明确允许抓取“是”、网页抓取“成功”，达到用户指定验收条件。首页和/guide/forever-ago-achievements均显示“已请求编入索引/已加入优先抓取队列” |
| Bing Webmaster | 仅导入本次GSC网域资源；www sitemap.xml已显示Submitted/Processing。由正式XML读取并校验37个唯一www canonical后一次提交全部37网址；后台Urls submitted today=37、Quota left=63、列表37条 |
| Yandex Webmaster | 官方.com和.ru均返回数据中心故障/服务暂时不可用页面，HTTP200不等于后台可用。尚无法添加站点、提交地图或索引请求；此部分未完成 |

以上提交/实时抓取不证明已被索引、收录数量、排名或抓取后的展现。

GSC实时XML证据：../screenshots/gsc-sitemap-live-fetch.png 。

Yandex续查：2026-10-12 23:41:52（Asia/Shanghai），首页和/sites/站点入口均仍为官方维护页。维护页链接的[官方公告](https://yandex.ru/company/news/09-10-2026-01)更新于11日，称数据中心受损后正在恢复，未给出恢复时间。此证据确认需要服务恢复后才能完成剩余提交；不把维护页HTTP200当作可用。
