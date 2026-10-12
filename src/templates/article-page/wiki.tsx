import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {DataTable} from '@/components/content/DataTable';
import {Media} from '@/components/content/Media';
import type {ArticleModules} from './ArticlePage';

export function wikiArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const guide=page.guide;const ui=index.dictionaries[page.locale].ui;
 const table=guide?.table?index.records[`${page.locale}:${guide.table}`]:undefined;
 const route=guide?.route?index.assets[guide.route]:undefined;
 return {
  sections:{'article-body':<><div data-template-body data-article-body>{body}</div>{table?.type==='table'&&<DataTable record={table} unknown={ui.unknown}/>} {route?.src&&<Media asset={route} locale={page.locale}/>}</>},
 };
}
