import type {ReactNode} from 'react';
import type {ContentIndex,ContentRoute} from '@/content/types';
import {buildBrand,buildFooter,buildLocaleChoices,buildNavigation} from '@/content/navigation';
import {LocaleProvider,ShellBackground} from './LocaleContext';
import {SiteHeader} from './SiteHeader';
import type {SiteSearchEntry} from './SiteSearch';
import {SiteFooter} from './SiteFooter';
import {AdProvider} from '@/components/ads/AdProvider';
import {AdRails} from '@/components/ads/AdRails';
import './site-chrome.css';
export function SiteShell({index,route,locale,pathname,defaultMode='night',children}:{index:ContentIndex;route?:ContentRoute;locale:string;pathname:string;defaultMode?:'day'|'night';children:ReactNode}){
 const dictionary=index.dictionaries[locale];
 if(!dictionary)throw new Error(`SiteShell: missing dictionary for locale ${locale}`);
 const navigationOrder=new Map(index.site.navigation[locale].flatMap(entry=>[entry.target,...entry.children.map(child=>child.target)]).filter(target=>target.type==='content').map((target,position)=>[target.id,position]));
 const searchEntries:SiteSearchEntry[]=Object.values(index.routes).filter(entry=>entry.locale===locale&&entry.kind==='page'&&index.pagesByKey[entry.bodyKey].category!=='_pages').map(entry=>{
  if(entry.kind!=='page')throw new Error(`Search route is not a page: ${entry.path}`);
  const page=index.pagesByKey[entry.bodyKey];return {id:page.id,href:entry.path,title:page.card?.title??page.title,description:page.description,section:dictionary.categories[page.category]?.title??dictionary.siteName,keywords:[page.id.replaceAll('-',' '),page.slug.replaceAll('-',' '),page.title,page.card?.description??'',...page.headings.map(heading=>heading.text)].join(' ')};
 }).sort((left,right)=>(navigationOrder.get(left.id)??Number.MAX_SAFE_INTEGER)-(navigationOrder.get(right.id)??Number.MAX_SAFE_INTEGER));
 const policyPage=route?.kind==='page'&&index.pagesByKey[route.bodyKey].category==='_pages';const adMode=!route||policyPage?'disabled':index.ads.mode;
 const adPaths=Object.fromEntries(Object.entries(index.routes).filter(([,entry])=>entry.kind!=='page'||index.pagesByKey[entry.bodyKey].category!=='_pages').map(([path,entry])=>[path,{tool:entry.kind==='page'&&['interactive-map','weapon-explorer'].includes(index.pagesByKey[entry.bodyKey].template)}]));
 return <div data-site-shell data-ad-mode={adMode}><AdProvider ads={index.ads} paths={adPaths} production={index.site.mode==='production'&&process.env.SITE_ENV!=='preview'&&process.env.NODE_ENV==='production'}><LocaleProvider locale={locale} dictionary={dictionary} homeHref={index.translationGroups.home[locale]}>
  <SiteHeader pathname={pathname} model={{brand:buildBrand(index,locale),items:buildNavigation(index,locale,route),locales:buildLocaleChoices(index,locale,route),siteId:index.site.siteId,searchEntries,defaultMode}}/>
  <ShellBackground><AdRails/>{children}<SiteFooter model={buildFooter(index,locale)}/></ShellBackground>
 </LocaleProvider></AdProvider></div>;
}
