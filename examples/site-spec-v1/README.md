# V1 建站包示例

本目录不放一套可误发布的虚构游戏资料。完整的可运行示例由 [`tests/unit/site-spec-assemble.test.ts`](../../tests/unit/site-spec-assemble.test.ts) 在系统临时目录生成：它包含全部 JSON、8 篇文章 Markdown、4 篇政策 Markdown、图片和本地 WOFF2 字体，并验证首次建站、再次生成和人工改动保护。

执行 `npx vitest run tests/unit/site-spec-assemble.test.ts` 即可核对示例契约。示例中的游戏、域名和文章均为测试数据，不得发布。真实建站包请按 [`docs/usage/site-spec.md`](../../docs/usage/site-spec.md) 填写已校对内容，不要复制测试文案。
