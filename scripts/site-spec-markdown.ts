import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkGfm from 'remark-gfm';
import {contentError} from '../src/content/issues';
import {youtubeVideoId} from '../src/content/youtube';

type MarkdownNode={type:string;url?:string;depth?:number;value?:string;children?:MarkdownNode[];position?:{start:{offset?:number;line?:number};end:{offset?:number}}};
type Replacement={start:number;end:number;text:string};
export function convertSiteMarkdown(source:string,file:string,paths:{content:Record<string,string>;category:Record<string,string>;assets:Set<string>}):string{
 const tree=unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source) as MarkdownNode;
 const replacements:Replacement[]=[];let seenH2=false;
 const add=(node:MarkdownNode,text:string)=>{
  const start=node.position?.start.offset,end=node.position?.end.offset;
  if(start===undefined||end===undefined)contentError(file,'body',node.type,'missing source position');
  replacements.push({start,end,text});
 };
 const textOf=(node:MarkdownNode):string=>node.type==='text'||node.type==='inlineCode'?node.value??'':(node.children??[]).map(textOf).join('');
 const walk=(node:MarkdownNode,parent?:MarkdownNode)=>{
  if(['mdxjsEsm','mdxFlowExpression','mdxTextExpression','mdxJsxFlowElement','mdxJsxTextElement','html'].includes(node.type))contentError(file,`body:${node.position?.start.line??1}`,node.type,'only ordinary Markdown is accepted');
  if(node.type==='heading'){
   if(node.depth===2)seenH2=true;
   else if(node.depth!==3||!seenH2)contentError(file,`body:${node.position?.start.line??1}`,node.depth,'body headings must be H2 or H3; H3 follows H2');
  }
  if(node.type==='table'){
   const width=node.children?.[0]?.children?.length??0;
   node.children?.forEach((row,i)=>{if(row.children?.length!==width)contentError(file,`body.table.${i}`,row.children?.length,'table rows must have the same number of cells');});
  }
  if(node.type==='image'){
   const match=/^asset:([a-z][a-z0-9-]*)$/.exec(node.url??'');
   if(!match||!paths.assets.has(match[1]))contentError(file,`body:${node.position?.start.line??1}`,node.url,'image requires a registered asset:ID');
   if(parent?.type!=='paragraph'||parent.children?.length!==1)contentError(file,`body:${node.position?.start.line??1}`,node.url,'asset image must occupy its own paragraph');
   add(node,`<Media id=${JSON.stringify(match[1])} />`);
   return;
  }
  if(node.type==='link'){
   const url=node.url??'';
   const internal=/^(content|category):([a-z][a-z0-9-]*)$/.exec(url);
   if(internal){
    const path=paths[internal[1] as 'content'|'category'][internal[2]];
    if(!path)contentError(file,`body:${node.position?.start.line??1}`,url,'unknown internal reference');
    const original=source.slice(node.position?.start.offset,node.position?.end.offset);
    const replaced=original.replace(`](${url})`,`](${path})`);
    if(replaced===original)contentError(file,`body:${node.position?.start.line??1}`,original,'use a direct Markdown link without a title');
    add(node,replaced);
   }else if(/^https:\/\//.test(url)){
    const title=textOf(node);
    if(parent?.type==='paragraph'&&parent.children?.length===1&&youtubeVideoId(url)){
     if(!title||Array.from(title).length>120)contentError(file,`body:${node.position?.start.line??1}`,title,'YouTube title must contain 1–120 characters');
     add(node,`<YouTube url=${JSON.stringify(url)} title=${JSON.stringify(title)} />`);
    }
   }else contentError(file,`body:${node.position?.start.line??1}`,url,'links must use content:ID, category:ID, or HTTPS');
   return;
  }
  for(const child of node.children??[])walk(child,node);
 };
 walk(tree);
 let output=source;
 for(const replacement of replacements.sort((a,b)=>b.start-a.start))output=output.slice(0,replacement.start)+replacement.text+output.slice(replacement.end);
 return output;
}
