# 新建一个独立站

新站是母模板的独立副本，不与其他站共享运行代码，也不会自动接收母模板后续修改。

## 创建

在母模板目录运行：

```bash
npm run create:site -- --target /absolute/path/to/new-game-site --sample a
```

将示意路径改为真实绝对路径。目标必须不存在或为空，不能放在母模板内部。sample 只能选择实际已经提供的 a 或 b；缺少该样例会明确报错。

复制工具只带运行所需代码、配置、内容、测试和使用说明。它不会带走母模板 Git 历史、依赖目录、构建产物、截图或私密环境文件；新项目会初始化自己的 Git。有已配置的 Git 身份才创建初始提交，不会编造作者。

## 运行骨架

进入工具输出的新目录：

```bash
npm ci
npm run dev
```

演示样例仅用于预览结构，不是游戏资料来源。接下来按照 [配置说明](configuration.md) 与 [内容说明](write-content.md)，替换 config、content、public/media。

## 完成换站

- 游戏显示名、语言、分类，以及 Official site、Steam、Discord、YouTube 四个 Community 入口已替换或明确未配置。
- About、Contact、Privacy、Terms 的游戏名、联系邮箱与生效日期已核对；未实际使用的分析或广告服务没有被写成已启用。
- 首页各楼层与所有内页/实体关系均是本站内容。
- 示例资料没有冒充真实内容；未知值、缺图与缺服务状态明确。
- 主题和字体按本站调性配置，昼夜与手机都检查过。
- 一期不接广告时 `config/ads.json` 保持 `disabled`，页面不会保留广告空位。
- 内容、主题、类型、构建及实际页面检查通过。
- 新站有自己的本地 Git 回退点。

母模板保留原设计资料作为对照。为避免覆盖它原有的 readme，新站根 README 使用 `docs/usage/site-readme.md` 的内容；原型说明不作为新站运行入口。

后续使用 [新站提示词](../prompts/new-site.md) 和 [维护提示词](../prompts/maintain-site.md)。这些步骤不会自动上线；部署是另一个需要明确授权的任务。
