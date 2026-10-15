'use client';
import {useId,useState,type CSSProperties} from 'react';

type FaqItem={question:string;answer:string};

function RevealedAnswer({answer}:{answer:string}){
 return <p className="home-faq-answer"><span className="visually-hidden">{answer}</span><span className="home-faq-answer-visual" aria-hidden="true">{Array.from(answer).map((character,index)=><span className="home-faq-answer-char" style={{'--faq-char-index':Math.min(index,80)} as CSSProperties} key={`${index}:${character}`}>{character===' '?String.fromCharCode(160):character}</span>)}</span></p>;
}

function FaqRow({item,expanded,onToggle}:{item:FaqItem;expanded:boolean;onToggle:()=>void}){
 const id=useId();
 return <div className="home-faq-item" data-expanded={expanded}>
  <button type="button" className="home-faq-question" id={`${id}-question`} aria-controls={`${id}-answer`} aria-expanded={expanded} onClick={onToggle}><span>{item.question}</span><span className="home-faq-caret" aria-hidden="true"/></button>
  <div id={`${id}-answer`} role="region" aria-labelledby={`${id}-question`} className="home-faq-answer-body" inert={!expanded} aria-hidden={!expanded}><div><RevealedAnswer answer={item.answer}/></div></div>
 </div>;
}

export function HomeFaqAccordion({items}:{items:FaqItem[]}){
 const [openIndex,setOpenIndex]=useState<number|null>(null);
 return <>
  <div className="home-faq-list">{items.map((item,index)=><FaqRow key={item.question} item={item} expanded={openIndex===index} onToggle={()=>setOpenIndex(current=>current===index?null:index)}/>)}</div>
  <noscript>
   <style>{'.home-faq-list{display:none}'}</style>
   <div className="home-faq-fallback">{items.map(item=><details className="home-faq-item" key={item.question}>
    <summary className="home-faq-question"><span>{item.question}</span><span className="home-faq-caret" aria-hidden="true"/></summary>
    <p className="home-faq-answer">{item.answer}</p>
   </details>)}</div>
  </noscript>
 </>;
}
