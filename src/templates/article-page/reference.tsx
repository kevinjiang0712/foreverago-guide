import Link from 'next/link';
import {buildReferenceArticle} from './build';
import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {resolveTarget} from '@/content/references';
import {Media} from '@/components/content/Media';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
import {bossIndexModel} from '../boss-index/model';
import {characterDatabaseModel} from '../character-database/model';
import {ArticleFacts,ArticleTable,ArticleStatus,ArticleSteps,ArticleFaq} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';

export function referenceArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const record=index.records[`${page.locale}:${page.articleRecord}`],ui=index.dictionaries[page.locale].ui;
 if(record.type==='build'||record.type==='build-library')return buildReferenceArticle(index,page,body);
 const referencePage={...page,records:[page.articleRecord!]};
 const sections:Record<string,ReactNode>={'article-body':<div data-template-body data-article-body>{body}</div>};
 if(record.type==='boss-index'){
  const {entries}=bossIndexModel(index,referencePage),detail=record.detail;
  if(detail){const boss=entries.find(entry=>entry.id===detail.entityId)!;const video=detail.videoAssetId?index.assets[detail.videoAssetId]:undefined;
   sections['boss-facts']=<><h3>{boss.name}</h3><ArticleFacts ui={ui} facts={[{label:ui.difficulty,value:boss.difficultyLabel},{label:ui.phases,value:boss.phaseCount},...detail.stats,...detail.facts]}/>{boss.asset.src&&<Media asset={boss.asset} locale={page.locale}/>} {video?.src&&<Media asset={video} locale={page.locale}/>}</>;
   sections.attacks=<ArticleTable label={detail.attacksTitle} columns={Object.values(detail.columns)}>{detail.attacks.map(attack=><tr key={attack.id}><th scope="row">{attack.name}</th><td>{attack.phases?.join(' / ')??ui.unknown}</td><td>{attack.windUpFrames??ui.unknown}</td><td>{attack.answer??ui.unknown} <ArticleStatus value={attack.verification} ui={ui}/></td></tr>)}</ArticleTable>;
  }
  const footerHref=record.footer.link?resolveTarget(index,page.locale,record.footer.link.target):null;
  sections['article-body']=<>{sections['article-body']}<p className="article-note">{record.footer.note}</p>{record.footer.link&&footerHref&&<Link href={footerHref}>{record.footer.link.label}<ArrowRightIcon/></Link>}</>;
  return {sections};
 }
 if(record.type==='character-database'){
  const {characters,lead}=characterDatabaseModel(index,referencePage);
  const name=(id:string)=>{const character=characters.find(entry=>entry.id===id)!;return character.href?<Link href={character.href}>{character.name}</Link>:character.name;};
  sections.lead=<><h3>{lead.name}</h3><p>{lead.summary}</p><ArticleFacts facts={lead.attributes} ui={ui}/>{lead.asset.src&&<Media asset={lead.asset} locale={page.locale} ratio="3/4"/>}</>;
  sections.relations=<><ArticleTable label={record.connections.title} columns={[ui.from,ui.to,ui.relation,ui.source]}>{record.relations.map((relation,i)=><tr key={i}><td>{name(relation.fromId)}</td><td>{name(relation.toId)}</td><td>{relation.label}</td><td>{relation.sourceLabel} <ArticleStatus value={relation.verification} ui={ui}/></td></tr>)}</ArticleTable><p className="article-note">{record.relationNote}</p></>;
  return {sections};
 }
 if(record.type==='mod-index'){
  sections['article-body']=<>{sections['article-body']}<aside className="article-note"><h3>{record.beforeInstall.title}</h3><p>{record.beforeInstall.description}</p></aside></>;
  sections.install=<ArticleSteps steps={record.installSteps} ui={ui}/>;
  sections.compat=<ArticleSteps steps={record.compatibility} ui={ui}/>;
  const asset=record.safetyAssetId?index.assets[record.safetyAssetId]:undefined;
  sections.safety=<><ArticleSteps steps={record.safetyNotes} ui={ui}/>{asset?.src&&<Media asset={asset} locale={page.locale}/>}<p className="article-note">{record.safetyCaption}</p></>;
  sections.faq=<ArticleFaq rows={record.faq} ui={ui}/>;
  sections.legal=<ArticleSteps steps={record.legalNotes} ui={ui}/>;
  return {sections};
 }
 throw new Error(`${page.sourcePath}: unsupported article record ${page.articleRecord}`);
}
