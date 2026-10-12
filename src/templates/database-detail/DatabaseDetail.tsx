import type {ReactNode} from 'react';
import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {CatalogHeader} from '../catalog-page/CatalogHeader';
import {DetailSections} from '../catalog-page/DetailSections';
import {ArticleFacts} from '../article-page/ArticleBlocks';
import {catalogValue} from '../catalog-page/model';
import {databaseDetailModel} from './model';
import '../catalog-page/catalog-page.css';
import '../article-page/article-page.css';
import '../wiki-page/wiki-page.css';
import './database-detail.css';
export function DatabaseDetail({index,page,body}:{index:ContentIndex;page:IndexedPage;body:ReactNode}){
 const {entry,database,catalogue}=databaseDetailModel(index,page),dictionary=index.dictionaries[page.locale];
 const sections=[{id:'parameters',title:dictionary.catalog.parameters},{id:'overview',title:dictionary.catalog.overview}];
 const modules={parameters:<ArticleFacts facts={database.fields.map(field=>({label:field.label,value:catalogValue(entry.values[field.id],field,dictionary.ui.unknown)}))} ui={dictionary.ui}/>,overview:<div data-template-body>{body}</div>};
 return <div data-template="database-detail"><CatalogHeader index={index} page={page}/><main id="main" className="container catalog-main database-detail-main"><Link href={catalogue.path} className="button button-ghost">← {dictionary.catalog.backToCatalog}</Link>{page.quickAnswer&&<section className="article-quick-answer" aria-label="Quick Answer">{page.quickAnswer.map((line,i)=><p key={i}>{line}</p>)}</section>}
<article className="article-content database-detail-content"><DetailSections sections={sections} modules={modules} ads={index.ads}/></article></main></div>;
}
