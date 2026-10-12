# 编写或批量生成内容

从当前项目同模板的完整文章和记录复制一份，再替换资料。不要从空白凭印象发明字段，也不要让 AI 重写页面组件。

## 最小攻略文章

文件放在 `content/en/pages/your-guide.mdx`，下面是格式示意，仍属于不可正式发布的演示草稿：

```mdx
---
id: your-guide
locale: en
slug: your-guide
category: guides
template: wiki-page
title: Your guide
description: A demonstration guide that needs real source material.
status: draft
demo: true
verification: unverified
guide:
  eyebrow: Guide
  title: Reading notes
  stats:
    - label: Requirements
      value: null
  table: null
  route: null
---

## Before you begin

Replace this demonstration text with verified source-backed content.
```

`guides` 必须是当前站已有分类。换了分类结构，应改为当前站真实 ID。演示内容要先用真实资料完整替换，不能只把 demo 改为 false。

## 正文与固定楼层各管什么

MDX 正文只进入模板规定的正文槽。首屏、筛选、统计、来源、关系表等固定楼层主要读取 JSON records；详情见 [模板字段表](template-fields.md)。不要在正文再复制一整套页面楼层。

正文从 H2 开始；H1 由模板提供。标题自动生成锚点。不得与该模板固定锚点重名，例如武器详情的 `unlock`、`tabs`、`faq`，以及所有内页的 `main`。内容检查会报出冲突值；换一个更具体的正文标题即可。

## 可使用的 MDX 组件

以下 ID 必须先在本站登记。这些是语法示意，不是可以直接引用的演示数据：

```mdx
<ContentLink id="existing-page">Read the related guide</ContentLink>
<ContentLink type="category" id="existing-category">Browse the category</ContentLink>
<ContentLink type="official" id="existing-official-link">Official website</ContentLink>

<Media id="existing-asset" />
<DataTable recordId="existing-table-record" />

<Notice tone="warning" title="Evidence limit">
This information has not been confirmed.
</Notice>

<Steps>

1. Explain the first step.
2. Explain the next step.

</Steps>
```

Notice 的 tone 只接受 info、warning、danger。组件参数使用固定文字，不写表达式或脚本。DataTable 必须引用当前语言的 table 类型记录，Media 必须引用素材表。

支持普通 Markdown 段落、列表、表格、代码块，以及 br/sub/sup/kbd/strong/em 等有限内联标签。禁止 import/export、脚本、事件回调、任意 JSX 组件、任意 JavaScript 表达式和自定义样式属性。

## 引用与素材

- 相同实体尽量复用同一记录 ID，避免页面各自维护不同名字或属性。
- 普通站内 URL 与锚点也会校验；推荐 ContentLink 稳定 ID，便于变更 slug。
- 图片先登记 src、尺寸、用途、每种启用语言的 alt。没有真实图片用 src:null 的图槽，不生成替代“事实图片”。
- 删除目标文章或素材前，先修复引用它的正文、首页和记录。框架不会替你悄悄删除坏引用。

## 批量生成后的检查

使用 [批量内页提示词](../prompts/batch-pages.md)，输入完整关键词清单、对应模板、现有 ID 和来源资料。AI 应交付实际文件和逐词映射，不能只给提纲。

```bash
npm run check:content
npm run build
```

先根据报错中的文件、字段和值修内容；不要为了通过而修改校验器。然后实际浏览器检查新增页面、关系、图槽和导航。缺少事实或素材的页面应明确列为待补。
