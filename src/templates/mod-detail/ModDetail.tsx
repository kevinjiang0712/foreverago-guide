import type {ReactNode} from 'react';
import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {articleOutline} from '@/content/article-outline';
import {CatalogHeader} from '../catalog-page/CatalogHeader';
import {DetailSections} from '../catalog-page/DetailSections';
import {modArticle} from '../article-page/mod';
import {modDetailModel} from './model';
import '../catalog-page/catalog-page.css';
import '../article-page/article-page.css';
import '../wiki-page/wiki-page.css';
import './mod-detail.css';
export function ModDetail({index,page,body}:{index:ContentIndex;page:IndexedPage;body:ReactNode}){
 const {record,mod}=modDetailModel(index,page),dictionary=index.dictionaries[page.locale],modules=modArticle(index,page,body),sections=articleOutline(index,page);
 const catalogue=Object.values(index.pagesByKey).find(candidate=>candidate.locale===page.locale&&candidate.template==='mod-index'&&candidate.records.some(id=>{const item=index.records[`${page.locale}:${id}`];return item.type==='mod-index'&&item.modIds.includes(mod.id);}));
 return <div data-template="mod-detail"><CatalogHeader index={index} page={page}/><main className="container catalog-main" id="main">
  {catalogue&&<Link className="button button-ghost" href={catalogue.path}>← {dictionary.catalog.backToCatalog}</Link>}
{page.quickAnswer&&<section className="article-quick-answer" aria-label="Quick Answer">{page.quickAnswer.map((line,i)=><p key={i}>{line}</p>)}</section>}
  <div className="mod-detail-layout"><aside className="mod-detail-summary">{modules.summary}{record.files.length>0&&<a className="button button-primary" href="#tabs">{record.tabs.files}</a>}<nav aria-label={dictionary.ui.onThisPage}>{sections.map(section=><a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</nav></aside>
  <article className="article-content"><DetailSections sections={sections} modules={modules.sections} ads={index.ads}/></article></div>
 </main></div>;
}
