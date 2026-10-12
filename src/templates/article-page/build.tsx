import Link from 'next/link';
import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import type {BuildRecord,BuildLibraryRecord} from '@/content/schemas/templates/build-library';
import type {Dictionary} from '@/content/schemas/dictionary';
import {buildArticle} from '@/content/build-articles';
import {Media} from '@/components/content/Media';
import {Tabs} from '@/components/interactive/Tabs';
import {CopyButton} from '@/components/interactive/CopyButton';
import {ArticleFacts,ArticleStatus,ArticleTable,ArticleFaq} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';

type Setup=Pick<BuildRecord,'equipment'|'bestFor'|'avoidIf'|'howItWorks'|'artifactPriority'|'buildOrder'|'howToPlay'|'risks'|'evidenceNote'|'verification'>;
function Priority({setup,ui}:{setup:Setup;ui:Dictionary['ui']}){
 return <ArticleTable label={ui.artifactPriority} columns={[ui.priority,ui.equipment,ui.instruction]}>{setup.artifactPriority.map(row=><tr key={row.id}><td>{row.priority}</td><td>{row.items}</td><td>{row.instruction}</td></tr>)}</ArticleTable>;
}
function Variant({setup,ui}:{setup:Setup;ui:Dictionary['ui']}){
 return <div className="article-entries"><ArticleStatus value={setup.verification} ui={ui}/><div><h3>{ui.equipment}</h3><ArticleFacts facts={setup.equipment} ui={ui}/></div><div><h3>{ui.bestFor}</h3><p>{setup.bestFor}</p><h3>{ui.avoidIf}</h3><p>{setup.avoidIf}</p></div><div><h3>{ui.howItWorks}</h3><p>{setup.howItWorks}</p></div>{setup.artifactPriority.length>0&&<div><h3>{ui.artifactPriority}</h3><Priority setup={setup} ui={ui}/></div>}{setup.buildOrder.length>0&&<div><h3>{ui.buildOrder}</h3><ol>{setup.buildOrder.map((step,i)=><li key={i}>{step}</li>)}</ol></div>}<div><h3>{ui.howToPlay}</h3><p>{setup.howToPlay}</p><h3>{ui.buildRisks}</h3><p>{setup.risks}</p><h3>{ui.evidenceLimit}</h3><p>{setup.evidenceNote}</p></div></div>;
}
function Presets({rows,ui}:{rows:BuildLibraryRecord['presets'];ui:Dictionary['ui']}){
 return <div className="article-entries">{rows.map(preset=><div key={preset.id}><h3>{preset.title}</h3><p>{preset.description}</p><ArticleStatus value={preset.verification} ui={ui}/><CopyButton code={preset.code} labels={ui}/></div>)}</div>;
}
export function buildReferenceArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const reference=index.records[`${page.locale}:${page.articleRecord}`];
 const build=reference.type==='build'?reference:undefined;
 const library=reference.type==='build-library'?reference:page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library');
 if(library?.type!=='build-library')throw new Error(`${page.sourcePath}: missing build library`);
 const ui=index.dictionaries[page.locale].ui;
 const presets=library.presets.filter(preset=>!build||preset.buildId===build.id),rescue=library.rescueRows.filter(row=>!build||row.buildId===build.id);
 const sections:Record<string,ReactNode>={
  'article-body':<div data-template-body data-article-body>{body}{build&&<p>{build.summary}</p>}</div>,
  evidence:build?<><p>{build.evidenceNote}</p><p className="article-note">{ui.buildFeedback}: {ui.unavailable}</p></>:<div className="article-entries">{library.evidenceLegend.map(entry=><div key={entry.id}><h3>{entry.label}</h3><p>{entry.description}</p><ArticleStatus value={entry.verification} ui={ui}/></div>)}</div>,
  presets:<Presets rows={presets} ui={ui}/>,
  rescue:<ArticleTable label={library.sections.rescue.title} columns={[library.columns.build,library.columns.protectFirst,library.columns.ifMissing,library.columns.pivot]}>{rescue.map(row=>{const article=buildArticle(index,page.locale,library.id,row.buildId);return <tr key={row.id}><td><Link href={article.path}>{article.title}</Link><ArticleStatus value={row.verification} ui={ui}/></td><td>{row.protectFirst??ui.unknown}</td><td>{row.ifMissing??ui.unknown}</td><td>{row.pivot??ui.unknown}</td></tr>;})}</ArticleTable>,
  faq:<ArticleFaq rows={library.faq} ui={ui}/>,
 };
 if(build){
  const asset=build.assetId?index.assets[build.assetId]:undefined;
  sections.equipment=<><ArticleFacts facts={[...build.facts,...build.equipment]} ui={ui}/>{asset?.src&&<Media asset={asset} locale={page.locale}/>}</>;
  sections.fit=<><p>{build.bestFor}</p><h3>{ui.avoidIf}</h3><p>{build.avoidIf}</p></>;
  sections['how-it-works']=<p>{build.howItWorks}</p>;
  sections.priority=<Priority setup={build} ui={ui}/>;
  sections['build-order']=<ol>{build.buildOrder.map((step,i)=><li key={i}>{step}</li>)}</ol>;
  sections['how-to-play']=<p>{build.howToPlay}</p>;sections.risks=<p>{build.risks}</p>;
  sections.variants=<Tabs label={ui.variants} items={build.variants.map(variant=>({id:variant.id,label:variant.label,content:<Variant setup={variant} ui={ui}/>}))}/>;
 }
 return {sections};
}
