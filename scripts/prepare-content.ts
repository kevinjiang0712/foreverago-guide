import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {readSite} from '../src/content/read-site';
import {buildIndex} from '../src/content/build-index';
import {analyzeMdx} from '../src/content/remark-content.mjs';
import {validateAssetReference,validateTarget} from '../src/content/references';
import {lookup} from '../src/content/lookup';
import {contentError} from '../src/content/issues';
import {fixedPageAnchors,pageTemplateAnchors} from '../src/content/template-anchors';
import {writeGenerated} from '../src/content/write-generated';
import nextEnv from '@next/env';
export async function prepareContent(root:string,options:{preview:boolean}={preview:process.env.SITE_ENV==='preview'}){
  const input=await readSite(root);const index=buildIndex(input,options);
  const analyses=new Map<string,ReturnType<typeof analyzeMdx>>();
  for(const source of input.pages){
    const key=`${source.locale}:${source.id}`;if(!index.pagesByKey[key])continue;
    const analysis=analyzeMdx(source.mdxSource,source.sourcePath);
    const templateAnchors=[...fixedPageAnchors(source.template),...pageTemplateAnchors(index,source)];
    analysis.headingIds.forEach((id,i)=>{if(templateAnchors.includes(id))contentError(source.sourcePath,`MDX.headingIds.${i}`,id,`anchor is reserved by template ${source.template}; rename the body heading`);});
    analyses.set(key,analysis);index.pagesByKey[key].headings=analysis.headings;
  }
  for(const [key,analysis] of analyses){
    const page=index.pagesByKey[key];const production=index.site.mode==='production'&&page.status==='published';
    for(const reference of analysis.references){
      const file=`${page.sourcePath}:${reference.line}`;
      switch(reference.kind){
        case 'asset':validateAssetReference(index,reference.id,file,'Media.id',production);break;
        case 'record':{
          const record=lookup(index.records,`${page.locale}:${reference.id}`);
          if(!record)contentError(file,'DataTable.recordId',reference.id,'unknown record');
          if(record.type!=='table')contentError(file,'DataTable.recordId',reference.id,'DataTable requires a table record');
          if(production&&record.demo)contentError(file,'DataTable.recordId',reference.id,'reachable demo record is not production content');
          break;
        }
        case 'content':case 'category':case 'official':validateTarget(index,page.locale,{type:reference.kind,id:reference.id},file,'ContentLink.id',production);break;
        case 'image':{
          const asset=Object.values(index.assets).find(asset=>asset.src===reference.id);
          if(!asset)contentError(file,'image',reference.id,'image must be registered in content/assets.json');
          validateAssetReference(index,asset.id,file,'image',production);break;
        }
        case 'link':{
          if(/^https?:/.test(reference.id)){validateTarget(index,page.locale,{type:'external',url:reference.id},file,'link',production);break;}
          const hash=reference.id.indexOf('#');
          const path=hash<0?reference.id:reference.id.slice(0,hash);
          const anchor=hash<0?'':reference.id.slice(hash+1);const target=path?index.routes[path]:index.routes[page.path];
          if(!target)contentError(file,'link',reference.id,'unknown internal URL; prefer ContentLink with a stable ID');
          if(target.locale!==page.locale)contentError(file,'link',reference.id,'body links must resolve in the current language');
          if(anchor&&target.kind==='page'){
            let decoded:string;
            try{decoded=decodeURIComponent(anchor);}catch(error){
              if(error instanceof URIError)contentError(file,'link',reference.id,'invalid anchor encoding');
              throw error;
            }
            if(!analyses.get(target.bodyKey)?.headingIds.includes(decoded)&&!pageTemplateAnchors(index,index.pagesByKey[target.bodyKey]).includes(decoded))contentError(file,'link',reference.id,'unknown heading anchor');
          }
          break;
        }
      }
    }
  }
  const imports=Object.entries(index.pagesByKey).map(([key,page])=>`  ${JSON.stringify(key)}: () => import(${JSON.stringify(`../${page.sourcePath}`)}),`).join('\n');
  // All input/AST checks finish before any generated output is changed.
  await writeGenerated(join(root,'.generated/mdx-imports.ts'),`export const mdxImports = {\n${imports}\n};\n`);
  await writeGenerated(join(root,'.generated/redirects.json'),`${JSON.stringify(index.redirects,null,2)}\n`);
  await writeGenerated(join(root,'.generated/content-index.json'),`${JSON.stringify(index,null,2)}\n`);
  await writeGenerated(join(root,'.generated/preparation-error.ts'),'export const preparationError: string | null = null;\n');
  return index;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 nextEnv.loadEnvConfig(process.cwd());
 const index=await prepareContent(process.cwd());console.log(`Content prepared: ${Object.keys(index.routes).length} routes; ${Object.keys(index.pagesByKey).length} MDX modules.`);
}
