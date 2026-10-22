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

后续构建、浏览器、正式服务和PageSpeed复测回执在本目录补齐。

## 本地验收

- check:content、prepare:theme、lint、typecheck、STATIC_EXPORT=1构建通过，47路由/40文章；三份改动的articleSpecSchema元数据均通过，保留原发布时间、更新日期为2026-10-22。
- 静态SEO：47路由与sitemap一致，4174处站内链接/锚点、124个本地资源、唯一TD、单H1、canonical、robots、WebPage/Article结构化数据检查无错误；不代表收录、排名、外链审计或字段CWV。
- Tabbit手机390px已实际选择灯塔并跳转/聚焦正确标题，桌面1440px查看相机操作与配图，无横向溢出。首轮no-JS测试连续从页尾自动回滚点击时受原站smooth-scroll稳定性影响超时；改为从独立初始页验证每条原生链接后4项策略测试全部通过，未强制点击、删除断言或改动产品滚动设置。
- 发布回归范围为site.spec.ts、search-navigation.spec.ts和strategy-iteration.spec.ts；旧首页轮播测试与既有任务式首页不符，本轮未改首页或重跑该旧文件，不称全部测试套件通过。

- 最终同批发布回归14/14通过，fresh lint/typecheck通过；完整命令与统计见release-tests.json。
