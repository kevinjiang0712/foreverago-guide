import Link from 'next/link';
import type {ContentIndex,IndexedCategory,IndexedPage} from '@/content/types';
import {articleOutline} from '@/content/article-outline';
import {fixedPageAnchors} from '@/content/template-anchors';
import {Media} from '@/components/content/Media';
import {EmptyState} from '@/components/content/EmptyState';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
import {ListBrowser} from './ListBrowser';
import {listPageModel} from './model';
import {LegacyListAnchor} from './LegacyListAnchor';
import './list-page.css';

export function ListPage({index,category,page}:{index:ContentIndex;category?:IndexedCategory;page?:IndexedPage}){
 const source=page??category;if(!source)throw new Error('ListPage requires a page or category');
 const dictionary=index.dictionaries[source.locale];
 const heroId=page?.assets.hero??category?.heroAsset,hero=heroId?index.assets[heroId]:undefined;
 const guide=page?.listGuide?index.pagesByKey[`${page.locale}:${page.listGuide}`]:undefined;
 const model=listPageModel(index,source);
 const compactCards=source.id==='weapons';
 const taskDirectory=!!category&&index.site.siteId==='forever-ago';
 const priorityIds=index.homes[source.locale].featured.pinnedIds??[];
 const priorityLinks=taskDirectory?priorityIds.map(id=>model.entries.find(entry=>entry.id===id)).filter(entry=>entry!==undefined).slice(0,3):[];
 return <div data-template="list-page" data-list-type={page?.template??'category'}>
  {guide&&<LegacyListAnchor redirects={page?.template==='build-library'?Object.fromEntries([['find-build',`${page.path}#browse`],['setups',`${page.path}#browse`],...model.entries.map(entry=>[`setup-${entry.id}`,entry.path!])]):undefined} legacyAnchors={page?fixedPageAnchors(page.template):[]} href={guide.path} anchors={[...articleOutline(index,guide).map(section=>section.id),...guide.headings.map(heading=>heading.id)]}/>}
  <header className="list-hero inner-hero" data-floor="hero" data-theme-mode="night" data-has-art={!!hero?.src}>
   {hero?.src&&<div className="list-hero-art" aria-hidden="true"><Media asset={hero} locale={source.locale} variant="inner-hero"/></div>}
   <div className="container list-hero-content inner-hero-content">
    <nav className="breadcrumb" aria-label={dictionary.ui.breadcrumb}><Link href={index.translationGroups.home[source.locale]}>{dictionary.ui.home}</Link><span aria-hidden="true">/</span><span aria-current="page">{source.title}</span></nav>
    <div className="list-hero-copy"><h1>{source.title}</h1><p>{source.description}</p></div>
   </div>
  </header>
  <main id="main" className="container list-main" data-floor="list">
   {guide&&<aside className="list-guide" aria-labelledby="list-guide-title"><div><strong className="list-guide-title" id="list-guide-title">{guide.title}</strong><p>{guide.description}</p></div><Link className="button button-ghost" href={guide.path}>{dictionary.ui.details}<ArrowRightIcon/></Link></aside>}
   {priorityLinks.length>0&&<section className="list-task-start" aria-labelledby="list-task-start-title"><div><h2 id="list-task-start-title">Start with your goal</h2><p>Pick a route below, or search the full collection by task.</p></div><div className="list-task-links">{priorityLinks.map(entry=><Link key={entry.id} href={entry.path!}><span>{entry.title}</span><ArrowRightIcon/></Link>)}</div></section>}
   {model.entries.length?<ListBrowser key={`${source.locale}:${source.id}`} model={model} locale={source.locale} copy={dictionary.ui} ads={index.ads} compactCards={compactCards} taskDirectory={taskDirectory}/>:<EmptyState title={dictionary.ui.empty} description={dictionary.ui.emptyReason}/>}
  </main>
 </div>;
}
