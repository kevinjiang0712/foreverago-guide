# 上线前内容审计

- 状态：已完成 26/26 篇全文审查；已复核 Old Bones、Hidden Achievements、Camera Controls 修正版，并修复 Collectibles 跨页残留。内容审计所发现的 High / Medium 发布前问题均已关闭。
- 范围：`content/20261012/*.mdx`；只审本期内页内容、搜索意图、重复、标题、事实边界与正文图片引用。
- 最终检查：26 篇原生 `validate-page.mjs` 全通过，0 errors、0 warnings；95 个本地正文图片引用存在、可解码、尺寸均至少 800 × 450。
- 本报告不证明索引、排名、广告填充、真实游戏实测或整站技术 SEO 通过。

## 已修复并复核的问题

### 已关闭 High：Old Bones 6 个休息互动定位不完整

- 文件：`content/20261012/forever-ago-old-bones-achievement.mdx`。
- 原问题：只明确黄色沙发，其余点让读者搜索区域座位，2 / 3 / 1 分布不能代替具体路线。
- 修正版已补 6 行地标与动作：商店外树石旁木凳、店内黄色沙发、旅馆泳池躺椅、餐厅树下红凳、花丛望远镜旁红凳、度假村湖景栏杆。
- 实际查看成就组提供的 360GameTV 画面，包括 22:24 树下红凳、22:42 花丛红凳、41:24 `Take In View` 提示与 Location 6/6、41:40 Alfred 靠栏杆休息。
- 第 6 个互动不是坐下，修正版明确使用 `Take In View`。正文图从 2 张补为 5 张。

### 已关闭 High 事实纠正：Collectibles 不应把全部休息互动定义为座位

- 文件：`content/20261012/forever-ago-collectibles.mdx`。
- 原问题：开头、分类表和部分广义排查语句将全部 6 处归为 Seats / Sit / seat interaction，与第 6 处栏杆动作不符。
- 已局部修复：广义采用 rest interaction；明确 5 处坐/躺、度假村栏杆使用 `Take In View`，去除 seat-by-seat 的总集合说法。店内和餐厅确实属于座位的具体描述保留。
- 原生校验通过：1,768 visibleEnglishWords，5 图，0 errors、0 warnings。

### 已关闭 Medium：Hidden Achievements 的平台范围不明确

- 文件：`content/20261012/forever-ago-hidden-achievements.mdx`。
- 修正版开头让玩家以所在平台显示的隐藏条目为准，明确本文解释对应条件和相关探索任务，而非一份详尽的平台 hidden-flag 清单。
- 未凭 Epic 的完整可见名称/条件列表制造 Steam、PlayStation 等平台的隐藏 flag；确实核验的条件保留。

### 已关闭 Medium：Camera Controls 完全缺少实核按键

- 文件：`content/20261012/forever-ago-camera-controls.mdx`。
- 实际查看 Milton 自拍图的相机界面，表格准确列出 `LS → Adjust Expression`、`Y (Hold) → Back`、`B → Exit Camera`。
- 文字限定这些标签属于当时的自拍相机状态，明确 Y Back 不是打开自拍指令；未猜测 PlayStation 或 PC 键位。
- 剩余 PC / 其他控制器完整映射未核，是已公开的资料边界，不再把该页称作一份完整跨平台键位表。

### 已关闭 Low：Game Length 的编辑话语残留

- 文件：`content/20261012/forever-ago-game-length.mdx`。
- 原句面向网站写作者，修正版改成面向玩家：不要按章节数推算全收集时长，额外时间取决于剩余可选任务。

## 最终内容验证结果

- 26 个主关键词逐项匹配 `research/关键词_20261012.md`，无缺页和重复主关键词。
- 全部具备唯一 slug、一个 H1 和独立 Title / Description；标题含主关键词，开头直接说明任务和重要限制。
- 原生校验总 visibleEnglishWords **45,694**，各页 **1,569–1,927**；正文图 **95** 个引用，各页 3–6 图。统计采用原生校验器口径，达到任务规定字数不被当成 Google 排名证据。
- 未发现完整重复正文段落；连续 5 词片段集合最高重合约 **3.0%**，出现在 `forever-ago-missable-achievements` / `forever-ago-achievements`。这是文本检测，不代表实际 SERP 竞争或排名风险。
- 所有正文图片引用为本地 root-relative 路径，无正文外链、来源段、TODO、IMAGE 占位符、假坐标、伪造“亲测”表述或已排除的 Franz / Pumpkin Market / Moment Collector / Curious Photographer 误名。
- Achievements 总表 29 个名称、条件和 XP 与官方 Epic 原始采集逐项完全一致，总 XP 1,000。
- 七个可选记忆与六个休息互动计数已交叉核实；花瓣页只采用实际画面可读局部计数，不凭空汇总总花瓣数。
- 照片位置、谜题、日记与控制页分别以位置、推进、选择保存和操作动作为主；总览与章节页存在合理交叉，没有根据文本相似度擅自删页或合并用户要求的关键词。
- 章节 1 / 2 / 3 明确为 Woolson Falls / Karl's Pump 'N' Mart / Highway Star Diner。
- 狗照片明确区分 Maddy 餐厅请求与灯塔 Doggo 替代鸟巢镜头；后者与官方 Epic 条件、360GameTV / KosGames 对应。
- Audrey / Ending Explained 标明剧透，叙事解读与操作路线分开；未虚构病名、隐藏结局或照片改变结局条件。

## 全部文件清单

| 页 | 原生 visibleEnglishWords | 正文图数 |
| --- | ---: | ---: |
| forever-ago-achievements | 1,770 | 3 |
| forever-ago-audrey-story | 1,813 | 3 |
| forever-ago-camera-achievements | 1,738 | 3 |
| forever-ago-camera-controls | 1,854 | 3 |
| forever-ago-chapter-1-photos | 1,678 | 4 |
| forever-ago-chapter-2-photos | 1,622 | 4 |
| forever-ago-chapter-3-photos | 1,569 | 4 |
| forever-ago-chapter-select | 1,772 | 3 |
| forever-ago-checkpoint-save | 1,823 | 3 |
| forever-ago-collectibles | 1,768 | 5 |
| forever-ago-dog-photo | 1,705 | 4 |
| forever-ago-ending-explained | 1,852 | 3 |
| forever-ago-game-length | 1,828 | 3 |
| forever-ago-gameplay | 1,802 | 3 |
| forever-ago-hidden-achievements | 1,898 | 3 |
| forever-ago-journal-photos | 1,748 | 3 |
| forever-ago-memory-locations | 1,744 | 6 |
| forever-ago-missable-achievements | 1,927 | 3 |
| forever-ago-old-bones-achievement | 1,876 | 5 |
| forever-ago-petal-collector-achievement | 1,716 | 3 |
| forever-ago-petal-locations | 1,628 | 5 |
| forever-ago-photo-locations | 1,693 | 5 |
| forever-ago-photo-puzzle | 1,647 | 5 |
| forever-ago-review | 1,728 | 3 |
| forever-ago-selfie-achievement | 1,699 | 3 |
| forever-ago-williamina-peak | 1,796 | 3 |

## 依据与限制

- 执行 `seo-audit` / `seo-content` 的内容标准并读取 E-E-A-T 参考；其未经核对的算法更新损失百分比、排名承诺或“SEO 必须达到固定词数”未作为判断依据。
- 按 [Google Search Central 的 helpful content 官方说明](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) 检查具体帮助、完整回答、准确性与作者透明度；Google 没有偏好的统一词数。
- 本次只检查最终 MDX。作者署名、About、发布日期、内部链接模块、截图禁用封面和文章主图等需在生成站实际页面再次验证。
- 稿件是资料边界内的整理与解读，没有冒充新的独立游戏实测或平台性能实验。
- `content` 修正后需要重新 assemble 并 build，确保生成站实际使用此版本，而不是仅更新源 MDX。
