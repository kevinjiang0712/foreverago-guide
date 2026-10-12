'use client';
import {useState} from 'react';
import type {BuildRecord} from '@/content/schemas/templates/build-library';
import type {Dictionary} from '@/content/schemas/dictionary';
import {ArticleFacts,ArticleStatus,ArticleTable} from '../article-page/ArticleBlocks';
export function BuildWorkbench({build,ui,copy}:{build:BuildRecord;ui:Dictionary['ui'];copy:Dictionary['catalog']}){
 const [selected,setSelected]=useState('base');
 const setup=build.variants.find(variant=>variant.id===selected)??build;
 return <div className={`build-workbench${build.variants.length?'':' build-workbench-single'}`}>
  {build.variants.length>0&&<aside className="build-stage-picker" id="variants" data-floor="variants"><strong>{copy.stages}</strong><div role="group" aria-label={copy.stages}>{[{id:'base',label:copy.baseSetup},...build.variants].map(stage=><button className="button button-ghost" key={stage.id} aria-pressed={selected===stage.id} onClick={()=>setSelected(stage.id)}>{stage.label}</button>)}</div><ArticleStatus value={setup.verification} ui={ui}/></aside>}
  <div className="build-setup article-content" aria-live="polite">
   <section className="article-section" id="equipment" data-floor="equipment"><h2>{ui.equipment}</h2><ArticleFacts facts={setup.equipment} ui={ui}/>{setup.skills.length>0&&<><h3>{copy.skills}</h3><ArticleFacts facts={setup.skills.map(skill=>({label:skill.name,value:skill.value}))} ui={ui}/></>}{!setup.equipment.length&&!setup.skills.length&&<p>{ui.unknown}</p>}</section>
   <section className="article-section" id="fit" data-floor="fit"><h2>{ui.bestFor}</h2><p>{setup.bestFor}</p><h3>{ui.avoidIf}</h3><p>{setup.avoidIf}</p></section>
   <section className="article-section" id="how-it-works" data-floor="how-it-works"><h2>{ui.howItWorks}</h2><p>{setup.howItWorks}</p></section>
   {(build.artifactPriority.length>0||build.variants.some(variant=>variant.artifactPriority.length>0))&&<section className="article-section" id="priority" data-floor="priority"><h2>{ui.artifactPriority}</h2>{setup.artifactPriority.length?<ArticleTable label={ui.artifactPriority} columns={[ui.priority,ui.equipment,ui.instruction]}>{setup.artifactPriority.map(row=><tr key={row.id}><td>{row.priority}</td><td>{row.items}</td><td>{row.instruction}</td></tr>)}</ArticleTable>:<p>{ui.unknown}</p>}</section>}
   {(build.buildOrder.length>0||build.variants.some(variant=>variant.buildOrder.length>0))&&<section className="article-section" id="build-order" data-floor="build-order"><h2>{ui.buildOrder}</h2>{setup.buildOrder.length?<ol>{setup.buildOrder.map((step,i)=><li key={i}>{step}</li>)}</ol>:<p>{ui.unknown}</p>}</section>}
   <section className="article-section" id="how-to-play" data-floor="how-to-play"><h2>{ui.howToPlay}</h2><p>{setup.howToPlay}</p></section>
   <section className="article-section" id="risks" data-floor="risks"><h2>{ui.buildRisks}</h2><p>{setup.risks}</p></section>
   <section className="article-section" id="evidence" data-floor="evidence"><h2>{ui.evidenceLimit}</h2><p>{setup.evidenceNote}</p></section>
  </div>
 </div>;
}
