import Link from 'next/link';
import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import type {WeaponDetailRecord} from '@/content/schemas/templates/weapon-detail';
import {Gallery} from '@/components/interactive/Gallery';
import {Media} from '@/components/content/Media';
import {Tabs} from '@/components/interactive/Tabs';
import {weaponDetailModel} from '../weapon-detail/model';
import {ArticleFacts,ArticleTable,ArticleSteps,ArticleFaq} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';
function UpgradeBranches({nodes,parentId,tierLabel,statusLabels}:{nodes:WeaponDetailRecord['upgradeNodes'];parentId:string|null;tierLabel:string;statusLabels:Record<string,string>}){return <div className={parentId===null?'weapon-upgrades':'weapon-upgrade-children'}>{nodes.filter(node=>node.parentId===parentId).map(node=><div className="weapon-upgrade" key={node.id} data-upgrade-id={node.id}><div className="weapon-upgrade-heading"><span>{node.name}</span><span>{tierLabel} {node.tier}</span></div><p>{node.description}</p><span className="article-status" data-verification={node.verification}>{statusLabels[node.verification]}</span>{nodes.some(child=>child.parentId===node.id)&&<UpgradeBranches nodes={nodes} parentId={node.id} tierLabel={tierLabel} statusLabels={statusLabels}/>}</div>)}</div>;}
export function weaponArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const {record,weapon,icon,gallery,builds,pairings}=weaponDetailModel(index,page);const ui=index.dictionaries[page.locale].ui;const columns=record.columns;
 const empty=null;
 const status=(verification:WeaponDetailRecord['verification'])=><span className="article-status" data-verification={verification}>{ui[verification]}</span>;
 const allTabs=[{id:'moveset',label:record.tabs.moveset,content:<>{record.moveset.length?<ArticleTable label={record.tabs.moveset} columns={[columns.action,columns.input,columns.frames,columns.coverage,columns.notes]} className="weapon-moveset">{record.moveset.map(move=><tr key={move.id}><td>{move.action}</td><td>{move.input??ui.unknown}</td><td>{move.frames??ui.unknown}</td><td>{move.coverage??ui.unknown}</td><td>{move.notes}{status(move.verification)}</td></tr>)}</ArticleTable>:empty}<p className="article-note">{record.movesetNote}</p></>},
 {id:'upgrades',label:record.tabs.upgrades,content:<><p className="article-note">{record.upgradeNote}</p>{record.upgradeNodes.length?<UpgradeBranches nodes={record.upgradeNodes} parentId={null} tierLabel={ui.tier} statusLabels={ui}/>:empty}</>},
 {id:'changes',label:record.tabs.changes,content:<>{record.patchHistory.length?<ArticleTable label={record.tabs.changes} columns={[columns.patch,columns.change]} className="weapon-patches">{record.patchHistory.map(patch=><tr key={patch.id}><td>{patch.version??ui.unknown}</td><td>{patch.change}{status(patch.verification)}</td></tr>)}</ArticleTable>:empty}<p className="article-note">{record.patchNote}</p></>},
 {id:'builds',label:record.tabs.builds,content:builds.length?<div className="article-card-grid">{builds.map(build=><Link href={build.href} key={build.contentId} className="article-card" data-lift>{status(build.verification)}<h3>{build.title}</h3><p>{build.description}</p></Link>)}</div>:empty}];

 const counts=[record.moveset.length,record.upgradeNodes.length,record.patchHistory.length,builds.length];
 const tabs=allTabs.filter((_,i)=>counts[i]>0);
 const images=gallery.filter(asset=>asset.src);
 return {
  summary:icon.src||weapon.facts.length||weapon.summary!==page.description?<div className="article-identity">{icon.src&&<Media asset={icon} locale={page.locale} ratio="1/1" className="article-icon"/>}<div>{weapon.summary!==page.description&&<p>{weapon.summary}</p>}<ArticleFacts facts={weapon.facts} ui={ui}/></div></div>:undefined,
  sections:{
   overview:<><div data-template-body data-article-body>{body}</div>{record.namingNote&&<p className="article-note">{ui.namingNote}: {record.namingNote}</p>}{weapon.tags.length>0&&<p className="article-note">{weapon.tags.join(' · ')}</p>}{images.length>0&&<Gallery images={images} locale={page.locale} label={ui.gallery} emptyLabel={ui.weaponArtwork} selectLabel={ui.select}/>}<div className="article-evidence"><h3>{ui.evidenceLimit}</h3><p>{record.evidenceNote}</p></div></>,
   unlock:<ArticleSteps steps={record.unlockSteps} ui={ui}/>,
   tabs:tabs.length?<Tabs label={record.detail.title} items={tabs}/>:null,
   matchups:<ArticleTable label={record.matchupSection.title} columns={[columns.situation,columns.result,columns.answer]} className="weapon-matchups">{record.matchups.map(matchup=><tr key={matchup.id}><td>{matchup.contentId?<Link href={index.translationGroups[matchup.contentId][page.locale]}>{matchup.situation}</Link>:matchup.situation}</td><td>{matchup.result??ui.unknown}{status(matchup.verification)}</td><td>{matchup.answer??ui.unknown}</td></tr>)}</ArticleTable>,
   pairs:<div className="article-entries">{pairings.map(pair=><div key={pair.recordId}><h3>{pair.href?<Link href={pair.href}>{pair.name}</Link>:pair.name}</h3><p className="article-note">{pair.kind}</p><p>{pair.description}</p>{status(pair.verification)}</div>)}</div>,
   faq:<ArticleFaq rows={record.faq} ui={ui}/>,
  },
 };
}
