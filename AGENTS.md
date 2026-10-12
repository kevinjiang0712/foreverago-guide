# 独立游戏资料站维护约定

- 项目使用 Next.js App Router + MDX。保持当前固定模板的布局、楼层、视觉、响应式和动效；局部定制以用户明确需求为准。
- 三层分离：`src/` 与 `scripts/` 是框架；`config/` 是站点配置；`content/` 与 `public/media/` 是独立内容。换游戏先改配置和内容，不创建跨站共享包。
- 内容入口是 `docs/usage/start-here.md` 与 `docs/usage/template-fields.md`。文章只静态导入本地受信任 MDX，不允许任意 JavaScript 表达式或运行时代码。
- 先追踪统一索引、schema 与渲染注册，再修改。导航、路由、SEO 和 sitemap 来自同一索引，不能单独维护固定列表。
- 唯一维护的标准主题是 Onimusha（日夜配对）；每个游戏的视觉值集中在 `config/theme.json`。其他五套仅保留为历史参考，不新增游戏专属 preset。固定核心令牌和组件结构不随游戏改写；不用硬编码颜色覆盖问题。
- 演示资料不代表游戏事实；未知数值用 null，缺服务明确不可用。不要伪造来源、官方链接、统计、翻译、下载或提交成功。
- 正式发布校验错误必须修内容或实际逻辑，不可关闭校验、改成宽松 schema 或把示例标成真实资料来通过。
- 不直接编辑 `.generated`、`.next`；不自动发布根目录研究文件。修改框架 schema/生成逻辑后重启开发服务。
- 修改前检查 Git 状态并保护用户现有改动。保持独立站自己的 Git 历史；未获授权不推送或部署。
- 根据范围执行 `npm run check:content`、`npm run prepare:theme`、`npm run lint`、`npm run typecheck`、`npm run build`。交互或视觉变更还需实际浏览器验证。构建成功不能代替浏览器或上线验证。
- 明确报告改动、实际运行的检查、未完成事项和本地提交。不要将局部测试称为全部验收。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
