'use client';
import {useId,useRef,useState,type ReactNode} from 'react';
import './tabs.css';
export type TabItem={id:string;label:string;content:ReactNode};
export type TabsProps={label:string;items:TabItem[];initialId?:string};
export function Tabs({label,items,initialId}:TabsProps){
 const instance=useId();const buttons=useRef(new Map<string,HTMLButtonElement>());const [selectedId,setSelectedId]=useState(initialId??items[0]?.id);
 if(!items.length)throw new Error(`Tabs ${label}: requires at least one item`);
 const ids=new Set<string>();for(const item of items){if(!item.id.trim())throw new Error(`Tabs ${label}: empty item ID ${JSON.stringify(item.id)}`);if(ids.has(item.id))throw new Error(`Tabs ${label}: duplicate ID ${item.id}`);ids.add(item.id);}
 if(initialId!==undefined&&!ids.has(initialId))throw new Error(`Tabs ${label}: invalid initialId ${initialId}`);
 const activeId=selectedId&&ids.has(selectedId)?selectedId:initialId??items[0].id;
 function choose(index:number){const item=items[index];setSelectedId(item.id);buttons.current.get(item.id)?.focus();}
 return <div className="template-tabs"><div className="template-tablist" role="tablist" aria-label={label}>{items.map((item,index)=><button key={item.id} ref={button=>{if(button)buttons.current.set(item.id,button);else buttons.current.delete(item.id);}} type="button" role="tab" id={`${instance}-tab-${index}`} aria-controls={`${instance}-panel-${index}`} aria-selected={item.id===activeId} tabIndex={item.id===activeId?0:-1} onClick={()=>setSelectedId(item.id)} onKeyDown={event=>{const destination=event.key==='ArrowRight'?(index+1)%items.length:event.key==='ArrowLeft'?(index-1+items.length)%items.length:event.key==='Home'?0:event.key==='End'?items.length-1:null;if(destination!==null){event.preventDefault();choose(destination);}}}>{item.label}<span aria-hidden="true"/></button>)}</div>{items.map((item,index)=><div key={item.id} className="template-tabpanel" role="tabpanel" id={`${instance}-panel-${index}`} aria-labelledby={`${instance}-tab-${index}`} hidden={item.id!==activeId} tabIndex={0}>{item.content}</div>)}</div>;
}
