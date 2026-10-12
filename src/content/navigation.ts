import type {ContentIndex,ContentRoute} from './types';
import type {LinkTarget} from './references';
import {resolveTarget} from './references';
import {lookup} from './lookup';
import {buildHomeDiscovery} from './home-discovery';
export const policyPageIds=['about','contact','privacy','terms'] as const;
export const communityLinkIds=['official','steam','discord','youtube'] as const;
export type ChromeLink={id:string;label:string;href:string|null};
export type NavigationItem=ChromeLink&{current:boolean;children:ChromeLink[]};
export type LocaleChoice={locale:string;label:string;href:string|null;homeHref:string;current:boolean};
export type BrandModel={name:string;href:string;logoSrc:string|null};
export type FooterModel={brand:BrandModel;description:string;disclaimer:string;copyright:string;externalLabel:string;unavailableLabel:string;columns:{id:string;title:string;links:ChromeLink[]}[]};
function targetId(target:LinkTarget):string{return target.type==='home'?'home':target.type==='external'?`external:${target.url}`:`${target.type}:${target.id}`;}
function linkModel(index:ContentIndex,locale:string,target:LinkTarget):ChromeLink{
 const dictionary=index.dictionaries[locale];const href=resolveTarget(index,locale,target);
 const label=target.type==='home'?dictionary.ui.home:target.type==='category'?dictionary.categories[target.id].title:target.type==='official'?dictionary.officialLinks[target.id]:target.type==='external'?new URL(target.url).hostname:href?index.routes[href].title:dictionary.ui.unavailable;
 return {id:targetId(target),label,href};
}
export function buildBrand(index:ContentIndex,locale:string):BrandModel{
 const dictionary=index.dictionaries[locale];
 return {name:dictionary.siteName,href:index.translationGroups.home[locale],logoSrc:'/favicon.ico'};
}
export function buildNavigation(index:ContentIndex,locale:string,route?:ContentRoute):NavigationItem[]{
 const link=(entry:ContentIndex['site']['navigation'][string][number]['children'][number],primary:boolean):ChromeLink=>{
  const category=entry.target.type==='category'?index.categories[`${locale}:${entry.target.id}`]:undefined;
  const count=(category?.characterIds?.length??0)+(category?.pages.length??0);
  const href=primary&&category&&!category.landing&&count<3?null:resolveTarget(index,locale,entry.target);
  return {id:targetId(entry.target),label:entry.label,href};
 };
 const items=index.site.navigation[locale].map(entry=>({...link(entry,true),current:false,children:entry.children.map(child=>link(child,false))}));
 if(route){
  const exact=items.find(item=>item.id===`content:${route.contentId}`);
  const section=route.kind==='home'?items.find(item=>item.id==='home'):items.find(item=>item.id===`category:${route.categoryId}`);
  const parent=items.find(item=>item.children.some(child=>child.id===`content:${route.contentId}`||(route.kind!=='home'&&child.id===`category:${route.categoryId}`)||(route.kind==='home'&&child.id==='home')));
  const current=exact??section??parent;if(current)current.current=true;
 }
 return items;
}
export function buildLocaleChoices(index:ContentIndex,locale:string,route?:ContentRoute):LocaleChoice[]{
 return index.site.locales.map(language=>({locale:language,label:index.dictionaries[language].languageName,href:route?lookup(index.translationGroups,route.contentId)?.[language]??null:null,homeHref:index.translationGroups.home[language],current:language===locale}));
}
export function buildFooter(index:ContentIndex,locale:string):FooterModel{
 const dictionary=index.dictionaries[locale];
 const navigation={id:'navigation',title:dictionary.footer.columns.navigation,links:buildNavigation(index,locale).map(({id,label,href})=>({id,label,href}))};
 const featured={id:'featured',title:dictionary.footer.columns.featured,links:buildHomeDiscovery(index,locale).featured.map(link=>({id:`content:${link.id}`,label:link.title,href:link.path}))};
 const policies=index.site.policies?{id:'about-policies',title:dictionary.footer.columns['about-policies'],links:policyPageIds.map(id=>linkModel(index,locale,{type:'content',id}))}:null;
 const communityLinks=communityLinkIds.map(id=>linkModel(index,locale,{type:'official',id})).filter(link=>link.href);
 const community=communityLinks.length?{id:'community',title:dictionary.footer.columns.community,links:communityLinks}:null;
 const configured=index.site.footer.columns.filter(column=>!['navigation','featured','about-policies','community','official'].includes(column.id)).map(column=>({id:column.id,title:dictionary.footer.columns[column.id],links:column.links.map(target=>linkModel(index,locale,target))}));
 const columns=[navigation,featured,...(policies?[policies]:[]),...(community?[community]:[]),...configured];
 return {brand:buildBrand(index,locale),description:dictionary.footer.description,disclaimer:dictionary.footer.disclaimer,copyright:dictionary.footer.copyright,externalLabel:dictionary.ui.external,unavailableLabel:dictionary.ui.unavailable,columns};
}
