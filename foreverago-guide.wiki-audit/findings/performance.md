# Lighthouse 手机实验室性能

结论：修复后首页 Performance **79**、Gameplay 攻略 **99**；两页 SEO 均 100。首屏主图 eager/high 与艺术素材压缩在实际导出及复测中生效，LCP 从 7.28/6.03 s 降到 2.85/2.18 s。首页仍有改进空间，不将 79 分或 SEO 100 写成全性能/CWV 通过。

## 一致的测试设置

- Lighthouse 13.5.0，`npx --offline lighthouse`；独立未登录 Playwright Chromium，未操作 Tabbit 后台。
- 390×844、DPR 3、mobile；默认模拟节流：RTT 150 ms、throughput 1638.4 Kbps、CPU slowdown 4×。四份 JSON 的相关设置完全一致。
- 对象：`http://127.0.0.1:4173`，Wrangler Pages 的静态 `out` 预览；不是 Next SSR 或生产 CDN 数据。
- 基线两页各一次；父 Agent 修复并重建后两页各复测一次，均顺序执行。没有为追高分反复挑样本，也没有关闭节流。
- 四次均无 runtimeError/runWarnings。网络日志无第三方请求；本地主机限制使真实 GA4、Clarity、Adsterra 不加载，正式域名第三方成本尚未包含。

| 页面 | 阶段 | Performance | SEO | FCP | LCP | TBT | CLS | 总传输 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 首页 | 基线 | 58 | 100 | 1.50 s | 7.28 s | 696 ms | 0.0013 | 1,050,301 B |
| 首页 | 修复后 | 79 | 100 | 1.65 s | 2.85 s | 379 ms | 0.0010 | 569,347 B |
| Gameplay | 基线 | 64 | 100 | 1.53 s | 6.03 s | 516 ms | 0.0295 | 756,762 B |
| Gameplay | 修复后 | 99 | 100 | 1.28 s | 2.18 s | 61 ms | 0.0295 | 480,040 B |

## 已修复并核验

- 两份 after JSON 的 `lcp-discovery-insight` 均确认 `priorityHinted=true`、`requestDiscoverable=true`、`eagerlyLoaded=true`。实际 LCP 图片 HTML 是 `loading="eager" fetchpriority="high"`。
- 首页 Hero 为 1600×1065 road-trip-art；攻略主图为 1600×900 campfire-art。网络日志实测艺术素材从 336,634→133,002 B、354,416→78,434 B，构图保留。
- owning source：[Media.tsx](</Users/jiangchenxiang/Desktop/产品/forever ago/site/src/components/content/Media.tsx:8>) 对首屏元素应用 eager/high；[ArticlePage.tsx](</Users/jiangchenxiang/Desktop/产品/forever ago/site/src/templates/article-page/ArticlePage.tsx:50>) 的文章主图显式 eager。父 Agent 做修改，本子任务只读测量和记录。

## 剩余问题与解释范围

- **首页待改进**：本次 lab LCP 2.85 s，仍高于 2.5 s 的良好体验目标；TBT 379 ms，仍有主线程长任务。首屏 lazy 缺陷已消除，剩余数据不能当成“无问题”。
- Gameplay 本次 lab LCP 2.18 s、TBT 61 ms、CLS 0.0295。首页 CLS 0.0010；这些是单次实验室样本，不是多次中位数或实际用户分布。
- 图片工具仍估算首页约 165 KiB、攻略约 62 KiB 可优化（主要是不同展示尺寸）；这是估算，不能直接扣掉作为已经节省的带宽。后续如继续优化，应以具体 profile 证据定位，不能无依据删功能/动效或重构母模板。
- field CWV 未知。TBT 不是 INP；这组结果不证明实际用户 INP、p75 CWV、收录、排名或收益。

## 原始证据

- [首页 基线 JSON](</Users/jiangchenxiang/Desktop/产品/forever ago/site/foreverago-guide.wiki-audit/lighthouse/home-mobile.json>)：2026-10-12T23:01:15+08:00。
- [首页 修复后 JSON](</Users/jiangchenxiang/Desktop/产品/forever ago/site/foreverago-guide.wiki-audit/lighthouse/home-mobile-after.json>)：2026-10-12T23:11:08+08:00。
- [Gameplay 基线 JSON](</Users/jiangchenxiang/Desktop/产品/forever ago/site/foreverago-guide.wiki-audit/lighthouse/gameplay-mobile.json>)：2026-10-12T23:02:10+08:00。
- [Gameplay 修复后 JSON](</Users/jiangchenxiang/Desktop/产品/forever ago/site/foreverago-guide.wiki-audit/lighthouse/gameplay-mobile-after.json>)：2026-10-12T23:11:58+08:00。

方法参考：[LCP 优化与 lab/field 区别](https://web.dev/articles/optimize-lcp)、[Lighthouse 评分](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)、[TBT 定义](https://web.dev/articles/tbt)。
