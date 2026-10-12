import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import GithubSlugger from 'github-slugger';
const components={ContentLink:['id','type'],Media:['id'],DataTable:['recordId'],Notice:['tone','title'],Steps:[],PolicyValue:['field'],PolicyContact:[],YouTube:['url','title']};
const inlineTags=new Set(['br','sub','sup','kbd','strong','em']);
function contentAst(tree,file,lineOffset=0){
  const slugger=new GithubSlugger();const headings=[];const references=[];const headingIds=[];const definitions=new Map();
  const collectDefinitions=node=>{
    if(node.type==='definition'&&!definitions.has(node.identifier))definitions.set(node.identifier,node.url);
    for(const child of node.children??[])collectDefinitions(child);
  };
  collectDefinitions(tree);
  const fail=(node,message)=>{throw new Error(`${file}:${(node.position?.start.line??1)+lineOffset} :: MDX :: ${message}`);};
  const textOf=node=>node.type==='text'||node.type==='inlineCode'?node.value:(node.children??[]).map(textOf).join('');
  function walk(node){
    const line=(node.position?.start.line??1)+lineOffset;
    if(['mdxjsEsm','mdxFlowExpression','mdxTextExpression','html'].includes(node.type))fail(node,`unsupported executable syntax ${node.type}`);
    if(node.type==='heading'){
      if(node.depth===1)fail(node,'H1 belongs to the page template; body headings start at H2');
      const text=textOf(node);if(!text.trim())fail(node,'heading must have visible text');
      const id=slugger.slug(text);node.data={...node.data,hProperties:{...node.data?.hProperties,id}};
      headingIds.push(id);
      if(node.depth===2||node.depth===3)headings.push({id,text,depth:node.depth});
    }
    if(node.type==='mdxJsxFlowElement'||node.type==='mdxJsxTextElement'){
      if(!Object.hasOwn(components,node.name)&&!inlineTags.has(node.name))fail(node,`unknown component ${node.name}`);
      const allowed=components[node.name]??[];const props={};
      for(const attribute of node.attributes){
        if(attribute.type!=='mdxJsxAttribute'||!allowed.includes(attribute.name))fail(attribute,`unregistered attribute ${attribute.name??'spread'} on ${node.name}`);
        if(Object.hasOwn(props,attribute.name))fail(attribute,`duplicate attribute ${attribute.name}`);
        let value=attribute.value;
        if(value&&typeof value==='object'){
          try{value=JSON.parse(value.value);}catch{fail(attribute,`attribute ${attribute.name} requires a literal JSON value, not code`);}
        }
        if(typeof value!=='string'||!value.trim())fail(attribute,`attribute ${attribute.name} requires nonempty text`);
        props[attribute.name]=value;
      }
      if(node.name==='ContentLink'){
        const kind=props.type??'content';if(!['content','category','official'].includes(kind))fail(node,`ContentLink type ${kind} is not registered`);
        if(!props.id)fail(node,'ContentLink requires id');references.push({kind,id:props.id,line});
      }
      if(node.name==='Media'){
        if(!props.id)fail(node,'Media requires id');references.push({kind:'asset',id:props.id,line});
      }
      if(node.name==='YouTube'){
        if(!props.url||!props.title)fail(node,'YouTube requires url and title');
        let url;try{url=new URL(props.url);}catch{fail(node,'YouTube requires a valid HTTPS URL');}
        if(url.protocol!=='https:'||!['youtube.com','www.youtube.com','m.youtube.com','youtu.be','youtube-nocookie.com','www.youtube-nocookie.com'].includes(url.hostname))fail(node,'YouTube requires a supported HTTPS URL');
      }
      if(node.name==='DataTable'){
        if(!props.recordId)fail(node,'DataTable requires recordId');references.push({kind:'record',id:props.recordId,line});
      }
      if(node.name==='PolicyValue'&&!['siteName','gameName','effectiveDate'].includes(props.field))fail(node,`unknown PolicyValue field ${props.field??''}`);
      if(node.name==='Notice'&&props.tone&&!['info','warning','danger'].includes(props.tone))fail(node,`unknown Notice tone ${props.tone}`);
    }
    if(node.type==='link'||node.type==='linkReference'){
      const url=node.type==='link'?node.url:definitions.get(node.identifier);
      if(!url)fail(node,`missing link definition ${node.identifier}`);
      if(!/^(https?:\/\/|\/(?!\/)|#(?=.))/u.test(url)||/[\\\u0000-\u001f]/.test(url))fail(node,`unsupported link URL ${JSON.stringify(url)}`);
      if(/^https?:/.test(url)){try{new URL(url);}catch{fail(node,`invalid URL ${url}`);}}
      references.push({kind:'link',id:url,line});
    }
    if(node.type==='image'||node.type==='imageReference'){
      const url=node.type==='image'?node.url:definitions.get(node.identifier);
      if(!url)fail(node,`missing image definition ${node.identifier}`);
      references.push({kind:'image',id:url,line});
    }
    for(const child of node.children??[])walk(child);
  }
  walk(tree);return {headings,headingIds,references};
}
export function analyzeMdx(source,file,lineOffset=0){
  const parser=unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter).use(remarkGfm);
  let tree;
  try{tree=parser.parse(source);}catch(error){throw new Error(`${file}:${(error.line??1)+lineOffset} :: MDX :: ${error.message}`,{cause:error});}
  return contentAst(tree,file,lineOffset);
}
export default function remarkContent(){
  return (tree,file)=>{
    file.data.content=contentAst(tree,file.path??'MDX');
    const headingPositions=tree.children.flatMap((node,index)=>node.type==='heading'&&node.depth===2?[index]:[]);
    const nativeAt=headingPositions[1]??tree.children.length;
    const inlineAt=headingPositions.length>=4?headingPositions[Math.max(3,Math.floor(headingPositions.length*.65))]:null;
    const marker=slot=>({type:'mdxJsxFlowElement',name:'BodyAdSlot',attributes:[{type:'mdxJsxAttribute',name:'slot',value:slot}],children:[]});
    tree.children=tree.children.flatMap((node,index)=>[...(index===nativeAt?[marker('native')]:[]),...(index===inlineAt?[marker('inline')]:[]),node]);
    if(nativeAt===tree.children.length)tree.children.push(marker('native'));
  };
}
