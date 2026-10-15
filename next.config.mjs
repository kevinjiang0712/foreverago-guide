import createMDX from '@next/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkContent from './src/content/remark-content.mjs';
import {readFileSync} from 'node:fs';
const withMDX=createMDX({options:{remarkPlugins:[remarkFrontmatter,remarkGfm,remarkContent]}});
const staticExport=process.env.STATIC_EXPORT==='1';
const redirects=JSON.parse(readFileSync(new URL('./.generated/redirects.json',import.meta.url),'utf8'));
if(staticExport&&redirects.length)throw new Error('Static export requires host redirect rules; generated redirects must not be silently omitted.');
export default withMDX({
  ...(staticExport?{output:'export',images:{unoptimized:true}}:{}),
  experimental:{globalNotFound:true,inlineCss:true},
  pageExtensions:['ts','tsx','mdx'],poweredByHeader:false,
  ...(!staticExport?{async redirects(){return redirects;}}:{}),
});
