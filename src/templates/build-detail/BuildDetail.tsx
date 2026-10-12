import type {ReactNode} from 'react';
import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {articleOutline} from '@/content/article-outline';
import {CatalogHeader} from '../catalog-page/CatalogHeader';
import {DetailSections} from '../catalog-page/DetailSections';
import {buildReferenceArticle} from '../article-page/build';
import {ArticleFacts} from '../article-page/ArticleBlocks';
import {Media} from '@/components/content/Media';
import {BuildWorkbench} from './BuildWorkbench';
import '../catalog-page/catalog-page.css';
import '../article-page/article-page.css';
import '../wiki-page/wiki-page.css';
import './build-detail.css';
export function BuildDetail({index,page,body}:{index:ContentIndex;page:IndexedPage;body:ReactNode}){
 const build=page.articleRecord?index.records[`${page.locale}:${page.articleRecord}`]:undefined;
 if(build?.type!=='build')throw new Error(`${page.id}: requires a build record`);
 const dictionary=index.dictionaries[page.locale],modules=buildReferenceArticle(index,page,body);
 const library=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library');
 const catalogue=Object.values(index.pagesByKey).find(candidate=>candidate.locale===page.locale&&candidate.template==='build-library'&&library&&candidate.records.includes(library.id));
 const sections=articleOutline(index,page).filter(section=>['article-body','presets','rescue'].includes(section.id));
 return <div data-template="build-detail"><CatalogHeader index={index} page={page}/><main className="container catalog-main" id="main">
  {catalogue&&<Link className="button button-ghost" href={catalogue.path}>← {dictionary.catalog.backToCatalog}</Link>}
  {build.facts.length>0&&<div className="build-facts"><ArticleFacts facts={build.facts} ui={dictionary.ui}/></div>}
{page.quickAnswer&&<section className="article-quick-answer" aria-label="Quick Answer">{page.quickAnswer.map((line,i)=><p key={i}>{line}</p>)}</section>}
  <BuildWorkbench build={build} ui={dictionary.ui} copy={dictionary.catalog}/>
  <div className="article-content build-notes"><DetailSections sections={sections} modules={modules.sections} ads={index.ads}/>{build.assetId&&index.assets[build.assetId]?.src&&<Media asset={index.assets[build.assetId]} locale={page.locale}/>}</div>
 </main></div>;
}
