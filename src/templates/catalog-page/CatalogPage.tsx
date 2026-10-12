import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {articleOutline} from '@/content/article-outline';
import {fixedPageAnchors} from '@/content/template-anchors';
import {LegacyListAnchor} from '../list-page/LegacyListAnchor';
import {catalogModel} from './model';
import {CatalogBrowser} from './CatalogBrowser';
import {CatalogHeader} from './CatalogHeader';
import './catalog-page.css';
export function CatalogPage({index,page}:{index:ContentIndex;page:IndexedPage}){
 const model=catalogModel(index,page),dictionary=index.dictionaries[page.locale];
 const guide=page.listGuide?index.pagesByKey[`${page.locale}:${page.listGuide}`]:undefined;
 return <div data-template="catalog-page" data-catalog-kind={model.kind}>
  {guide&&<LegacyListAnchor redirects={page.template==='build-library'?Object.fromEntries([['find-build',`${page.path}#browse`],['setups',`${page.path}#browse`],...model.entries.filter(entry=>entry.path).map(entry=>[`setup-${entry.id}`,entry.path!])]):undefined} legacyAnchors={fixedPageAnchors(page.template)} href={guide.path} anchors={articleOutline(index,guide).map(section=>section.id)}/>}
  <CatalogHeader index={index} page={page} compact/>
  <main id="main" className="container catalog-main" data-floor="list">
   <CatalogBrowser model={model} locale={page.locale} ui={dictionary.ui} copy={dictionary.catalog} ads={index.ads}/>
   {guide&&<aside className="catalog-guide"><div><strong>{guide.title}</strong><p>{guide.description}</p></div><Link href={guide.path} className="button button-ghost">{dictionary.ui.details}</Link></aside>}
  </main>
 </div>;
}
