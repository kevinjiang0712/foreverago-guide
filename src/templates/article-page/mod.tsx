import Link from 'next/link';
import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {Gallery} from '@/components/interactive/Gallery';
import {Tabs} from '@/components/interactive/Tabs';
import {TrackButton} from '@/components/interactive/TrackButton';
import {modDetailModel} from '../mod-detail/model';
import {ArticleFacts,ArticleTable,ArticleSteps,ArticleFaq} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
export function modArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const {record,mod,gallery}=modDetailModel(index,page);const ui=index.dictionaries[page.locale].ui;const columns=record.columns;const empty=null;
 const status=(verification:'confirmed'|'partial'|'unverified')=><span className="article-status" data-verification={verification}>{ui[verification]}</span>;
 const external=(url:string,label:string)=><a href={url} target="_blank" rel="noopener noreferrer">{label}<ArrowRightIcon/><span className="visually-hidden"> {ui.external}</span></a>;
 const modLink=(id:string|null,title:string)=>{const other=id?index.records[`${page.locale}:${id}`]:null;return other?.type==='mod'&&other.contentId?<Link href={index.translationGroups[other.contentId][page.locale]}>{title}</Link>:title;};
 const allTabs=[{id:'files',label:record.tabs.files,content:<>{record.files.length?<div className="mod-files"><ArticleTable label={record.tabs.files} columns={[columns.file,columns.version,ui.fileSize,columns.uploaded,columns.notes]}>{record.files.map(file=><tr key={file.id}><td>{file.url?external(file.url,file.title):file.title}{!file.url&&<span className="article-status" data-file-unavailable>{ui.unavailable}</span>}</td><td>{file.version??ui.unknown}</td><td>{file.size??ui.unknown}</td><td>{file.uploadedAt??ui.unknown}</td><td>{file.description}{status(file.verification)}</td></tr>)}</ArticleTable></div>:empty}<p className="article-note">{record.filesNote}</p></>},{id:'changelog',label:record.tabs.changelog,content:record.changelog.length?<div className="mod-changelog">{record.changelog.map(change=><article key={change.id}><div className="mod-entry-meta"><h3>{change.version??ui.unknown}</h3><span>{change.date??ui.unknown}</span></div><ul>{change.changes.map((item,i)=><li key={i}><span aria-hidden="true" className="mod-change-marker"/><span>{item}</span></li>)}</ul>{status(change.verification)}</article>)}</div>:empty},{id:'posts',label:record.tabs.posts,content:<>{record.posts.length?<div className="mod-posts">{record.posts.map(post=><article key={post.id}><div className="mod-entry-meta"><h3>{post.author}</h3><span>{post.date??ui.unknown}</span></div><p>{post.body}</p>{status(post.verification)}</article>)}</div>:empty}<p className="article-note">{record.postsNote}</p></>},{id:'permissions',label:record.tabs.permissions,content:<>{record.permissions.length?<div className="mod-permissions"><ArticleTable label={record.tabs.permissions} columns={[columns.permission,columns.terms]}>{record.permissions.map(permission=><tr key={permission.id}><td>{permission.title}</td><td>{permission.description}{status(permission.verification)}</td></tr>)}</ArticleTable></div>:empty}<p className="article-note">{record.permissionsNote}</p></>}];

 const counts=[record.files.length,record.changelog.length,record.posts.length,record.permissions.length];
 const tabs=allTabs.filter((_,i)=>counts[i]>0);const images=gallery.filter(asset=>asset.src);
 return {summary:<>
  {mod.description!==page.description&&<p>{mod.description}</p>}
  <div className="article-metadata" data-mod-metadata><span>{ui.author}: {mod.authorName??ui.unknown}</span><span>{ui.version}: {mod.releaseVersion??ui.unknown}</span><span>{record.categoryLabel}</span><span>{ui.updated}: {mod.updatedAt??ui.unknown}</span></div>
  <ArticleFacts facts={[{label:ui.downloads,value:mod.downloads},{label:ui.endorsements,value:mod.endorsements},{label:ui.fileSize,value:mod.fileSize},{label:ui.testedVersions,value:mod.testedVersions.join(', ')||null},...record.facts]} ui={ui}/>
  <div className="article-actions">{record.authorUrl?external(record.authorUrl,ui.authorPage):<span className="article-note">{ui.authorPage}: {ui.unavailable}</span>}<TrackButton siteId={index.site.siteId} modId={mod.id} dataVersion={record.dataVersion} labels={ui}/></div><p className="article-note">{record.authorNote}</p>
 </>,sections:{
  overview:<><div data-template-body data-article-body>{body}</div><div className="article-evidence"><h3>{ui.evidenceLimit}</h3><p>{record.evidenceNote}</p></div>{images.length>0&&<Gallery images={images} locale={page.locale} label={ui.gallery} emptyLabel={ui.modArtwork} selectLabel={ui.select}/>}</>,
  requirements:<ArticleTable label={record.sections.requirements.title} columns={[columns.requirement,columns.version,columns.reason,columns.status]}>{record.requirements.map(requirement=><tr key={requirement.id}><td>{modLink(requirement.modId,requirement.title)}</td><td>{requirement.version??ui.unknown}</td><td>{requirement.reason}</td><td>{requirement.status}{status(requirement.verification)}</td></tr>)}</ArticleTable>,
  install:<ArticleSteps steps={record.installSteps} ui={ui}/>,
  tabs:tabs.length?<Tabs label={record.sections.tabs.title} items={tabs}/>:null,
  conflicts:<ArticleTable label={record.sections.conflicts.title} columns={[columns.mod,columns.interaction,columns.resolution,columns.status]}>{record.conflicts.map(conflict=><tr key={conflict.id}><td>{modLink(conflict.modId,conflict.title)}</td><td>{conflict.interaction}</td><td>{conflict.resolution??ui.unknown}</td><td>{status(conflict.verification)}</td></tr>)}</ArticleTable>,
  faq:<ArticleFaq rows={record.faq} ui={ui}/>,
  report:<>{record.feedbackOptions.map(option=><div className="article-entry" key={option.id}><h3>{option.title}</h3><p>{option.description}</p></div>)}{record.feedbackTarget?<div data-feedback-link>{external(record.feedbackTarget,ui.request)}</div>:<p className="article-note" data-feedback-unavailable>{ui.feedbackUnavailable}</p>}</>,
 }};
}
