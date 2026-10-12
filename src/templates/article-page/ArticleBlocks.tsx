import type {ReactNode} from 'react';
import type {Dictionary} from '@/content/schemas/dictionary';
import {Disclosure} from '@/components/content/Disclosure';

type UI=Dictionary['ui'];
export function ArticleFacts({facts,ui}:{facts:{label:string;value:string|number|null}[];ui:UI}){
 if(!facts.length)return null;
 return <dl className="article-facts">{facts.map((fact,i)=><div key={i}><dt>{fact.label}</dt><dd>{fact.value??ui.unknown}</dd></div>)}</dl>;
}
export function ArticleStatus({value,ui}:{value:'confirmed'|'partial'|'unverified';ui:UI}){
 return <span className="article-status" data-verification={value}>{ui[value]}</span>;
}
export function ArticleTable({label,columns,children,className=''}:{label:string;columns:string[];children:ReactNode;className?:string}){
 return <div className={`article-table ${className}`} role="region" tabIndex={0} aria-label={label}><table><caption className="visually-hidden">{label}</caption><thead><tr>{columns.map((column,i)=><th scope="col" key={i}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
export function ArticleSteps({steps,ui}:{steps:{id:string;title:string;description:string;verification:'confirmed'|'partial'|'unverified'}[];ui:UI}){
 return <ol className="article-steps">{steps.map(step=><li key={step.id}><h3>{step.title}</h3><p>{step.description}</p><ArticleStatus value={step.verification} ui={ui}/></li>)}</ol>;
}
export function ArticleFaq({rows,ui}:{rows:{id:string;question:string;answer:string;verification:'confirmed'|'partial'|'unverified'}[];ui:UI}){
 return <div className="article-faq">{rows.map((row,i)=><Disclosure key={row.id} question={row.question} initialOpen={i===0}><p>{row.answer}</p><ArticleStatus value={row.verification} ui={ui}/></Disclosure>)}</div>;
}
