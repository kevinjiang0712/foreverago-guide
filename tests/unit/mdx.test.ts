import {expect,it} from 'vitest';
import {compile} from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkContent,{analyzeMdx} from '../../src/content/remark-content.mjs';
it('derives duplicate CJK IDs identically for TOC and compiled headings',async()=>{
 const source='## 開始\n\n### 準備\n\n## 開始\n';const analysis=analyzeMdx(source,'guide.mdx');
 expect(analysis.headings.map(heading=>heading.id)).toEqual(['開始','準備','開始-1']);
 const compiled=String(await compile(source,{remarkPlugins:[remarkFrontmatter,remarkGfm,remarkContent]}));
 for(const heading of analysis.headings)expect(compiled).toContain(`id: "${heading.id}"`);
});
it('accepts GFM tables and records literal references with source lines',async()=>{
 const source='## Table\n\n| Name | Value |\n| --- | --- |\n| Item | Unknown |\n\n<ContentLink id="first-steps">Guide</ContentLink>\n\n<Media id="route" />\n\n<DataTable recordId="stats" />\n\n<PolicyValue field="siteName" />\n\n<PolicyContact />';
 const result=analyzeMdx(source,'content/en/pages/test.mdx',10);
 expect(result.references).toEqual(expect.arrayContaining([expect.objectContaining({kind:'content',id:'first-steps',line:17}),expect.objectContaining({kind:'asset',id:'route'}),expect.objectContaining({kind:'record',id:'stats'})]));
 expect(String(await compile(source,{remarkPlugins:[remarkGfm,remarkContent]}))).toContain('table');
});
it.each([
 'import X from "./code"\n\n## Title','export const x=1','{globalThis.process.exit()}','# Duplicate H1',
 '<script>alert(1)</script>','<style>body { color: red }</style>','<Media id="route" onClick="bad" />','<Notice style="color:red">x</Notice>',
 '<Unknown />','<ContentLink {...props}>x</ContentLink>','<ContentLink id={getId()}>x</ContentLink>',
 '[bad](javascript:alert%281%29)','<Notice tone={(()=>"warning")()}>x</Notice>',
 '<Media id="route" aria-label="unregistered" />',
 '<PolicyValue field="operatorName" />','<PolicyContact email="test@example.com" />',
])('rejects unsafe or unregistered MDX: %s',source=>{
 expect(()=>analyzeMdx(source,'content/en/pages/invalid.mdx')).toThrow(/content\/en\/pages\/invalid.mdx:\d+/);
});
it('accepts JSON literals but not arbitrary code inside known props',()=>{
 expect(()=>analyzeMdx('<Notice tone={"warning"}>Read first.</Notice>','guide.mdx')).not.toThrow();
});
it('resolves definitions nested in blockquotes and preserves first definition',()=>{
 const result=analyzeMdx('[Open][docs]\n\n![image][img]\n\n> [docs]: https://developer.mozilla.org/\n> [img]: /media/registered.png\n\n[docs]: https://wrong.example/','nested.mdx');
 expect(result.references).toEqual([{kind:'link',id:'https://developer.mozilla.org/',line:1},{kind:'image',id:'/media/registered.png',line:3}]);
});

it('inserts ad boundaries between complete H2 sections, never inside steps or tables',async()=>{
 const {run}=await import('@mdx-js/mdx');const runtime=await import('react/jsx-runtime');const {renderToStaticMarkup}=await import('react-dom/server');const {createElement}=await import('react');
 const source='## First answer\n\n1. Step one\n2. Step two\n\n| Item | Value |\n| --- | --- |\n| A | B |\n\n## Second answer\n\nSecond paragraph.\n\n## Third answer\n\nThird paragraph.\n\n## Fourth answer\n\nFourth paragraph.';
 const compiled=await compile(source,{outputFormat:'function-body',remarkPlugins:[remarkGfm,remarkContent]});
 const {default:Body}=await run(String(compiled),{...runtime,baseUrl:import.meta.url});
 const result=renderToStaticMarkup(createElement(Body,{components:{BodyAdSlot:({slot}:{slot:string})=>createElement('aside',{'data-test-ad':slot})}}));
 expect(result.indexOf('</table>')).toBeLessThan(result.indexOf('data-test-ad="native"'));
 expect(result.indexOf('data-test-ad="native"')).toBeLessThan(result.indexOf('id="second-answer"'));
 expect(result.indexOf('Third paragraph.')).toBeLessThan(result.indexOf('data-test-ad="inline"'));
 expect(result.indexOf('data-test-ad="inline"')).toBeLessThan(result.indexOf('id="fourth-answer"'));
});
