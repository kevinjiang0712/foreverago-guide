import type {ContentIndex,IndexedPage} from '@/content/types';

export type RelatedContentItem={id:string;path:string;title:string;description:string;categoryTitle:string;verification:IndexedPage['verification']};

export function buildRelatedContent(index:ContentIndex,current:IndexedPage,limit=3):RelatedContentItem[]{
 const pages=Object.values(index.pagesByKey).filter(page=>page.locale===current.locale&&page.id!==current.id);
 const byId=new Map(pages.map(page=>[page.id,page]));
 const category=index.categories[`${current.locale}:${current.category}`];
 const orderedIds=[...current.related,...[current.next,current.previous].filter((id):id is string=>Boolean(id)),...(category?.pages??[]).map(key=>index.pagesByKey[key]?.id).filter((id):id is string=>Boolean(id)),...pages.sort((a,b)=>{
  const aCategory=index.categories[`${a.locale}:${a.category}`]?.order??Number.MAX_SAFE_INTEGER;
  const bCategory=index.categories[`${b.locale}:${b.category}`]?.order??Number.MAX_SAFE_INTEGER;
  return aCategory-bCategory||(a.order??Number.MAX_SAFE_INTEGER)-(b.order??Number.MAX_SAFE_INTEGER)||a.title.localeCompare(b.title);
 }).map(page=>page.id)];
 const seen=new Set<string>();const selected:IndexedPage[]=[];
 for(const id of orderedIds){const page=byId.get(id);if(!page||seen.has(id))continue;seen.add(id);selected.push(page);if(selected.length===limit)break;}
 return selected.map(page=>({id:page.id,path:page.path,title:page.card?.title??page.title,description:page.card?.description??page.description,categoryTitle:index.categories[`${page.locale}:${page.category}`]?.title??index.dictionaries[page.locale].ui.page,verification:page.verification}));
}
