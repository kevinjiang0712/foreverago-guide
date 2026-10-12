import Link from 'next/link';
import type {CSSProperties,ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {Media} from '@/components/content/Media';
import {systemsReferenceModel} from '../systems-reference/model';
import {ArticleStatus,ArticleTable} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';

export function systemsArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const {record,items,diagram}=systemsReferenceModel(index,page);const ui=index.dictionaries[page.locale].ui;const columns=record.columns;
 const itemName=(id:string)=>{const item=items.find(item=>item.id===id);if(!item)throw new Error(`${record.id}: unknown stat item ${id}`);return item.href?<Link href={item.href}>{item.name}</Link>:item.name;};
 return {sections:{
  mechanisms:<><div data-template-body data-article-body>{body}</div><div className="article-entries">{record.mechanisms.map(mechanism=><div key={mechanism.id} data-mechanism-id={mechanism.id}><h3><span className="article-mechanism-icon" aria-hidden="true" style={{'--mechanism-icon':`url(/ui/icons/${mechanism.icon}.svg)`} as CSSProperties}/>{mechanism.title}</h3><p>{mechanism.description}</p><ArticleStatus value={mechanism.verification} ui={ui}/></div>)}</div>{diagram.src&&<Media asset={diagram} locale={page.locale} ratio="16/9"/>}</>,
  combos:<ArticleTable label={record.combos.title} columns={[columns.route,columns.input,columns.frames,columns.use]}>{record.comboRoutes.map(route=><tr key={route.id} data-combo-id={route.id}><td>{route.name}</td><td>{route.input??ui.unknown}</td><td>{route.frames??ui.unknown}</td><td>{route.use??ui.unknown}<ArticleStatus value={route.verification} ui={ui}/></td></tr>)}</ArticleTable>,
  items:<><div className="article-card-grid">{items.map(item=><div className="article-card" key={item.id} data-item-id={item.id}>{item.asset.src&&<Media asset={item.asset} locale={page.locale} ratio="1/1"/>}<h3>{itemName(item.id)}</h3><p className="article-note">{item.kind}</p><p>{item.summary}</p><ArticleStatus value={item.verification} ui={ui}/></div>)}</div>{record.stats.length>0&&<ArticleTable label={record.items.title} columns={[columns.item,columns.attack,columns.speed,columns.notes]}>{record.stats.map(stat=><tr key={stat.itemId}><td>{itemName(stat.itemId)}</td><td>{stat.attack??ui.unknown}</td><td>{stat.speed??ui.unknown}</td><td>{stat.note}<ArticleStatus value={stat.verification} ui={ui}/></td></tr>)}</ArticleTable>}</>,
 }};
}
