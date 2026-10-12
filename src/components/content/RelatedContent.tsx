import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {Reveal} from '@/components/motion/Reveal';
import {buildRelatedContent} from './related-content';
import './related-content.css';

export function RelatedContent({index,page}:{index:ContentIndex;page:IndexedPage}){
 if(page.category==='_pages')return null;
 const dictionary=index.dictionaries[page.locale];const copy=dictionary.relatedContent;const items=buildRelatedContent(index,page);
 if(!items.length)return null;
 const category=index.categories[`${page.locale}:${page.category}`];const headingId=`related-content-${page.id}`;
 return <Reveal as="aside" className="related-content" data-floor="related-content" aria-labelledby={headingId}><div className="container"><div className="related-content-header"><div className="section-heading"><div className="section-label"><span aria-hidden="true"/>{copy.eyebrow}</div><h2 id={headingId}>{copy.title}</h2><p>{copy.description}</p></div>{category&&<Link href={category.path} className="related-content-all">{copy.browse} {category.title}</Link>}</div><div className="related-content-grid">{items.map((item,index)=><Link href={item.path} className="related-content-card" data-lift key={item.id}><div className="related-content-meta"><span className="related-content-number">{String(index+1).padStart(2,'0')}</span><span className="related-content-category">{item.categoryTitle}</span><span className="related-content-status">{dictionary.ui[item.verification]}</span></div><h3>{item.title}</h3><p>{item.description}</p><span className="button button-ghost related-content-action">{copy.open}</span></Link>)}</div></div></Reveal>;
}
