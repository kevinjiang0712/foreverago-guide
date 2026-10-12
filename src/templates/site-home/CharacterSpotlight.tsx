import Link from 'next/link';
import type {ListEntry} from '../list-page/model';
import {Media} from '@/components/content/Media';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';

export function CharacterSpotlight({entries,locale,copy,path,actionLabel}:{entries:ListEntry[];locale:string;copy:{eyebrow:string;title:string;description:string};path:string;actionLabel:string}){
 return <section className="home-floor character-spotlight" aria-labelledby="character-spotlight-title" data-floor="category-characters" data-character-spotlight>
  <div className="character-spotlight-heading"><p className="eyebrow">{copy.eyebrow}</p><h2 id="character-spotlight-title">{copy.title}</h2><p>{copy.description}</p></div>
  <div className="character-spotlight-grid">{entries.slice(0,3).map(entry=><article className="character-spotlight-card" key={entry.id}>
   {entry.thumbnail&&<div className="character-spotlight-avatar"><Media asset={entry.thumbnail} locale={locale} variant="card"/></div>}
   <div className="character-spotlight-copy"><p className="character-spotlight-role">{entry.label}</p><h3>{entry.title}</h3><p>{entry.description}</p></div>
  </article>)}</div>
  <div className="character-spotlight-action"><Link href={path} className="button button-ghost">{actionLabel}<ArrowRightIcon/></Link></div>
 </section>;
}
