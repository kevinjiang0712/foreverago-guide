import type {ContentIndex,ContentRoute} from '@/content/types';
import {absoluteUrl} from './alternates';
import {shareImage} from './metadata';
export function serializeJsonLd(value:unknown):string{return JSON.stringify(value).replace(/</g,'\\u003c');}
export function createStructuredData(index:ContentIndex,route:ContentRoute):Record<string,unknown>[] {
 const dictionary=index.dictionaries[route.locale];const url=absoluteUrl(index,route.path);const home=absoluteUrl(index,index.translationGroups.home[route.locale]);const image=shareImage(index,route);
 const graph:Record<string,unknown>[]=[{'@type':'WebSite','@id':`${home}#website`,url:home,name:dictionary.siteName,inLanguage:route.locale},{'@type':'WebPage','@id':`${url}#webpage`,url,name:route.title,description:route.description,inLanguage:route.locale,isPartOf:{'@id':`${home}#website`}}];
 const crumbs=[{name:dictionary.ui.home,item:home}];
 if(route.kind!=='home'){
  const category=index.categories[`${route.locale}:${route.categoryId}`];
  if(category&&category.path!==route.path)crumbs.push({name:category.title,item:absoluteUrl(index,category.path)});
  crumbs.push({name:route.title,item:url});
 }
 if(route.kind!=='home')graph.push({'@type':'BreadcrumbList',itemListElement:crumbs.map((crumb,i)=>({'@type':'ListItem',position:i+1,...crumb}))});
 if(route.kind==='page'&&index.pagesByKey[route.bodyKey].template==='wiki-page'&&index.pagesByKey[route.bodyKey].author){
  const page=index.pagesByKey[route.bodyKey];const publication=page;
  graph.push({'@type':'Article',headline:route.title,description:route.description,inLanguage:route.locale,mainEntityOfPage:{'@id':`${url}#webpage`},...(publication?.publishedAt?{datePublished:publication.publishedAt}:{}),...(publication?.updatedAt?{dateModified:publication.updatedAt}:{}),...(page.author?{author:{'@type':'Person',...page.author}}:{}),...(image?{image:image.url}:{})});
 }
 if(route.kind==='category'){
  const entries=index.categories[`${route.locale}:${route.categoryId}`].pages.map(key=>index.pagesByKey[key]);
  graph.push({'@type':'ItemList',name:route.title,numberOfItems:entries.length,itemListElement:entries.map((page,i)=>({'@type':'ListItem',position:i+1,name:page.title,url:absoluteUrl(index,page.path)}))});
 }
 return graph;
}
