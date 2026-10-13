'use client';
import Link from 'next/link';
import {useId,useRef,useState} from 'react';
import {completionChapters,completionTypeLabels,type CompletionType,type CompletionToolMode,type LinkedCompletionEntry} from './completion-data';
import {changeCompletionStage,completionStageCount,parseCompletionProgress,serializeCompletionProgress} from './completion-progress';
import {saveCompletionProgress,useCompletionProgress} from './completion-store';

const toolTitles:Record<CompletionToolMode,string>={all:'Your completion route',achievements:'Achievement checklist',collectibles:'Collectible & photo checklist',memories:'Vignette checklist',rests:'Old Bones rest checklist',photos:'Photo task checklist'};
const stageLabels=['Petals collected','Vignette unlocked','Memory photographed'];
const completionLabels:Record<Exclude<CompletionType,'memory'>,string>={achievement:'Achievement unlocked',rest:'Rest performed',photo:'Task finished'};
const chapterLabels=new Map(completionChapters.map(chapter=>[chapter.id,chapter.label]));

export function CompletionTracker({entries,mode,trackerHref}:{entries:LinkedCompletionEntry[];mode:CompletionToolMode;trackerHref?:string}){
  const fieldId=useId();const snapshot=useCompletionProgress();const ready=snapshot.status!=='loading';
  const [query,setQuery]=useState('');const [chapter,setChapter]=useState('all');const [type,setType]=useState<CompletionType|'all'>('all');
  const [status,setStatus]=useState('all');const [notice,setNotice]=useState('');const [restoring,setRestoring]=useState(false);
  const restoreInput=useRef<HTMLInputElement>(null);
  const types=[...new Set(entries.map(entry=>entry.type))];
  const completed=entries.filter(entry=>(snapshot.progress[entry.id]??0)===completionStageCount(entry)).length;
  const search=query.trim().toLowerCase();
  const visible=entries.filter(entry=>{
    const stage=snapshot.progress[entry.id]??0;const done=stage===completionStageCount(entry);
    return (type==='all'||entry.type===type)&&(chapter==='all'||entry.chapter===chapter)
      &&(status==='all'||(status==='done'&&done)||(status==='remaining'&&!done)||(status==='started'&&stage>0&&!done))
      &&(!search||[entry.name,entry.location,entry.action,entry.condition,chapterLabels.get(entry.chapter)].join(' ').toLowerCase().includes(search));
  });
  function toggleStage(entry:LinkedCompletionEntry,stage:number,checked:boolean){
    saveCompletionProgress(changeCompletionStage(snapshot.progress,entry,stage,checked));
    setNotice(`${entry.name}: ${checked?(entry.type==='memory'?stageLabels[stage-1]:'marked complete'):'progress updated'}.`);
  }
  function clearFilters(){setQuery('');setChapter('all');setType('all');setStatus('all');}
  function downloadBackup(){
    const url=URL.createObjectURL(new Blob([serializeCompletionProgress(snapshot.progress)],{type:'application/json'}));
    const download=document.createElement('a');download.href=url;download.download='forever-ago-progress.json';download.click();URL.revokeObjectURL(url);
    setNotice('Progress backup downloaded.');
  }
  async function restoreBackup(file:File){
    setRestoring(true);
    try{
      if(file.size>100_000)throw new Error('The backup is too large. Choose a Forever Ago progress backup.');
      const restored=parseCompletionProgress(await file.text());
      if(!window.confirm('Replace your current Forever Ago checklist with this backup?'))return;
      saveCompletionProgress(restored,true);setNotice('Progress restored from the selected backup.');
    }catch(error){setNotice(error instanceof Error?`Backup not restored: ${error.message}`:'The backup could not be read. Your current progress is unchanged.');}
    finally{setRestoring(false);if(restoreInput.current)restoreInput.current.value='';}
  }
  function resetProgress(){
    if(!window.confirm('Reset every Forever Ago checklist on this browser? All achievement, vignette, rest and photo checks will be cleared.'))return;
    saveCompletionProgress({},true);setNotice('All checklist progress reset.');
  }
  return <section id="completion-checklist" className="completion-tool" data-completion-tool={mode} aria-labelledby={`${fieldId}-title`}>
    <div className="completion-heading">
      <div><span className="completion-eyebrow">Plan the next stop</span><h2 id={`${fieldId}-title`}>{toolTitles[mode]}</h2></div>
      <div className="completion-total"><strong>{completed}<span> / {entries.length}</span></strong><span>tasks complete</span></div>
    </div>
    <p className="completion-intro">Find the next action, follow its guide, then mark the result. Your checks carry across these guides on this browser.</p>
    {entries.some(entry=>entry.type==='achievement')&&<p className="completion-scope">29 achievements · 1,000 Epic XP. XP is for Epic Games Store; it does not represent Steam points or PlayStation trophy grades. Mark achievements after checking your platform list.</p>}
    {mode==='photos'&&<p className="completion-scope">These are documented photography tasks, rather than every possible scenery photograph. Optional petal memories have their own checklist.</p>}
    {mode==='memories'&&<p className="completion-scope">Track the local petal search, unlock message and gathering-point photograph separately. Use the live counter for the mosaic pumpkin; its exact petal total is not established here.</p>}
    {mode==='rests'&&<p className="completion-scope">Two gas-station rests, three diner rests and one resort rest. For a completion attempt, follow one continuous journey and check Old Bones in your platform list.</p>}
    {mode!=='all'&&trackerHref&&<Link className="completion-route-link" href={`${trackerHref}#completion-checklist`}>Open the full completion tracker <span aria-hidden="true">→</span></Link>}
    <noscript><p className="completion-scope">The checklist and guide links are available below. Enable JavaScript to filter tasks and save your progress.</p></noscript>
    <div className="completion-filters">
      <div className="completion-search"><label htmlFor={`${fieldId}-search`}>Search tasks</label><input id={`${fieldId}-search`} type="search" placeholder="Name, landmark or action" value={query} onChange={event=>setQuery(event.target.value)} disabled={!ready}/></div>
      <div><label htmlFor={`${fieldId}-chapter`}>Chapter / road stop</label><select id={`${fieldId}-chapter`} value={chapter} onChange={event=>setChapter(event.target.value)} disabled={!ready}><option value="all">All road stops</option>{completionChapters.filter(candidate=>entries.some(entry=>entry.chapter===candidate.id)).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}</select></div>
      <div><label htmlFor={`${fieldId}-status`}>Progress</label><select id={`${fieldId}-status`} value={status} onChange={event=>setStatus(event.target.value)} disabled={!ready}><option value="all">All tasks</option><option value="remaining">Remaining</option><option value="done">Complete</option>{types.includes('memory')&&<option value="started">Vignettes in progress</option>}</select></div>
    </div>
    {types.length>1&&<div className="completion-types" role="group" aria-label="Task type"><button type="button" aria-pressed={type==='all'} onClick={()=>setType('all')} disabled={!ready}>All types <span>{entries.length}</span></button>{types.map(candidate=><button type="button" key={candidate} aria-pressed={type===candidate} onClick={()=>setType(candidate)} disabled={!ready}>{completionTypeLabels[candidate]} <span>{entries.filter(entry=>entry.type===candidate).length}</span></button>)}</div>}
    <div className="completion-results"><p role="status" aria-live="polite" aria-atomic="true">{visible.length} of {entries.length} tasks shown · {completed} complete</p>{(query||chapter!=='all'||type!=='all'||status!=='all')&&<button type="button" onClick={clearFilters}>Clear filters</button>}</div>
    {visible.length===0?<div className="completion-empty"><h3>No matching tasks</h3><p>Try a different landmark, road stop or progress filter.</p><button type="button" onClick={clearFilters}>Show all tasks</button></div>:<div className="completion-route-groups">{completionChapters.filter(candidate=>visible.some(entry=>entry.chapter===candidate.id)).map(candidate=><section key={candidate.id} className="completion-route-group" aria-labelledby={`${fieldId}-${candidate.id}`}>
      <header className="completion-stop-heading"><h3 id={`${fieldId}-${candidate.id}`}>{candidate.label}</h3><span>{visible.filter(entry=>entry.chapter===candidate.id).length} tasks</span></header>
      <ol className="completion-list">{visible.filter(entry=>entry.chapter===candidate.id).map(entry=>{
      const stage=snapshot.progress[entry.id]??0;const done=stage===completionStageCount(entry);
      return <li key={entry.id} id={`check-${entry.id}`} className="completion-task" data-task-id={entry.id} data-complete={done}>
        <div className="completion-task-meta"><span>{chapterLabels.get(entry.chapter)}</span><span>{completionTypeLabels[entry.type]}</span>{entry.epicXP!==undefined&&<span>{entry.epicXP} Epic XP</span>}</div>
        <h4>{entry.name}</h4><p className="completion-location"><strong>Where:</strong> {entry.location}</p><p className="completion-action">{entry.action}</p>
        <p className="completion-condition"><strong>Done when:</strong> {entry.condition}</p>
        <div className="completion-task-footer">
          {entry.type==='memory'?<fieldset className="completion-stages"><legend className="completion-visually-hidden">{entry.name} progress</legend>{stageLabels.map((label,index)=><label key={label}><input type="checkbox" aria-label={`${entry.name}: ${label}`} checked={stage>index} disabled={!ready||stage<index} onChange={event=>toggleStage(entry,index+1,event.target.checked)}/><span>{label}</span></label>)}</fieldset>:<label className="completion-check"><input type="checkbox" aria-label={`${entry.name}: ${completionLabels[entry.type]}`} checked={done} disabled={!ready} onChange={event=>toggleStage(entry,1,event.target.checked)}/><span>{completionLabels[entry.type]}</span></label>}
          <Link href={entry.href}>Step-by-step guide <span aria-hidden="true">↗</span></Link>
        </div>
      </li>;
    })}</ol></section>)}</div>}
    <div className="completion-save-status" role="status" aria-live="polite" aria-atomic="true">
      {snapshot.status==='loading'?'Loading your saved progress…':snapshot.status==='saved'?'Progress saved on this browser.':snapshot.status==='damaged'?'Your saved progress could not be opened. Your existing save is kept unchanged. You can keep using this checklist for this visit, restore a backup, or explicitly reset it.':'Saving is unavailable in this browser. You can use the checklist for this visit and download a backup before leaving.'}
    </div>
    <p className="completion-notice" role="status" aria-live="polite" aria-atomic="true">{notice}</p>
    <details className="completion-management"><summary>Manage progress</summary><p>Download a backup before switching browsers or clearing site data. Restoring a backup replaces your checklist; it does not alter your game save.</p><div><button type="button" disabled={!ready} onClick={downloadBackup}>Download backup</button><button type="button" disabled={!ready||restoring} onClick={()=>restoreInput.current?.click()}>{restoring?'Reading backup…':'Restore backup'}</button><button type="button" className="completion-reset" disabled={!ready} onClick={resetProgress}>Reset all progress</button></div><input ref={restoreInput} className="completion-visually-hidden" type="file" accept="application/json,.json" tabIndex={-1} aria-label="Choose a Forever Ago progress backup" onChange={event=>{const file=event.target.files?.[0];if(file)void restoreBackup(file);}}/></details>
  </section>;
}
