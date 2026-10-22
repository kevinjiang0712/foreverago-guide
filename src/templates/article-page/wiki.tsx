import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {DataTable} from '@/components/content/DataTable';
import {Media} from '@/components/content/Media';
import type {ArticleModules} from './ArticlePage';
import {PhotoPuzzleNavigator} from '@/features/forever-ago/PhotoPuzzleNavigator';

export function wikiArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const guide=page.guide;const ui=index.dictionaries[page.locale].ui;
 const table=guide?.table?index.records[`${page.locale}:${guide.table}`]:undefined;
 const route=guide?.route?index.assets[guide.route]:undefined;
 const photoStops=index.site.siteId==='forever-ago'&&page.locale==='en'&&page.id==='forever-ago-photo-puzzle'?[
  {id:'finish-the-physical-photo-before-searching-again',label:'Opening: develop and place the print'},
  {id:'photograph-the-dog-and-report-the-result',label:'Diner: dog photo and booth permission'},
  {id:'solve-the-petal-vignette-camera-stage',label:'Petals: counter or memory reveal'},
  {id:'resort-boat-photograph-and-rowing',label:'Resort: boat photo and rowing'},
  {id:'lighthouse-photo-sequence',label:'Lighthouse: sign and upper-section photo'},
 ]:null;
 if(photoStops)for(const stop of photoStops)if(!page.headings.some(heading=>heading.id===stop.id))throw new Error(`Missing photo solution heading: ${stop.id}`);
 return {
  sections:{'article-body':<>{photoStops&&<PhotoPuzzleNavigator stops={photoStops}/>}<div data-template-body data-article-body>{body}</div>{table?.type==='table'&&<DataTable record={table} unknown={ui.unknown}/>} {route?.src&&<Media asset={route} locale={page.locale}/>}</>},
 };
}
