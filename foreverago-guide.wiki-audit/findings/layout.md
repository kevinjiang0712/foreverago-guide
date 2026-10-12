# 本地预览布局检查

结论：未发现已证实的 Critical / Important 布局问题。

## 检查范围

- 预览：`http://127.0.0.1:4173`，独立 Chromium / Playwright。
- 首页、Guides 分类页、Achievements 详情页：1920 / 1680 / 1440 / 1280 / 390 / 320 × 900，共 18 组。
- 详情页短视口：1920 / 1280 × 360、390 / 320 × 420，共 4 组。
- About / Contact / Privacy / Terms 策略页：320 × 420。
- 手机抽屉：390 / 320 × 640，打开和 Escape 关闭。

## 结果

- 22 组页面 document.scrollWidth 均等于视口宽度，无页面横向溢出；main、footer 在视口内。
- 所有页面均 data-mode=night，无 data-modepill 入口；顶部、手机抽屉及 footer 的 brand 图片均为 /favicon.ico。
- 桌面使用 inline 导航；手机在水合完成后使用 burger 导航。390/320 的抽屉宽度分别为 390/320，高度 640，内容可纵向滚动；Escape 后 aria-expanded=false。
- 四个策略页均 HTTP 200、data-ad-mode=disabled，广告节点、广告占位及固定 rail 数量均为 0。
- 请求记录中 GA / Clarity / Google Analytics 请求为 0，全部第三方请求为 0；页面异常为 0。
- 人工查看桌面首屏、320 手机详情首屏、桌面/手机短视口和 390/320 抽屉截图，未发现可见遮挡、文字横向截断或导航尺寸错误。

## 新增全局 404 代码复审

- `src/app/global-not-found.tsx:1-17` 显式加载 globals/theme，并返回完整 html/body；data-mode=night、favicon.ico、SiteAnalytics 和 noindex 齐全。
- `next.config.mjs:12` 开启 experimental.globalNotFound，与当前已安装 Next 文档一致；该机制适合此项目位于动态 catch-all 的根 layout。
- `SiteShell` 不提供有效 route，adMode=disabled；AdProvider 根据实际不存在的 pathname 查询 paths，结果同样禁用广告。
- 新 404 的最终构建产物与 HTTP 行为由父任务重建验证；此次浏览器预览仍对应此前的 out，不把源码复审当作新 404 的运行验收。

## 限制与记录

- 本地 host 不在广告白名单，故本轮没有真实广告 rails；正式 host 的广告数量/尺寸/短视口规则由父任务的 runtime fixture 验证，本轮未重复运行。
- 第一轮使用默认 load 等待，在末尾一次首页导航超时；改为 domcontentloaded 并等待页面组件后完整重跑。记录的失败请求仅为下一次导航取消的本地请求（ERR_ABORTED），未记录其他类型失败。
- 全页截图中未滚动到的楼层仍受模板进入视口动效控制，不能依据这类截图中的空白判断正文缺失。
- 原始结果：`layout-results.json`；截图：`layout-screenshots/`。
