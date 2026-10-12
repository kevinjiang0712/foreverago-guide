import {AdContentSlot} from '@/components/ads/AdContentSlot';
import {Fragment,type ReactNode} from 'react';
import type {ArticleSection} from '@/content/article-outline';
import type {AdsConfig} from '@/content/schemas/ads';
import {ConfiguredAdSlot,assertAdAnchor} from '@/components/ads/AdSlot';
export function DetailSections({sections,modules,ads}:{sections:ArticleSection[];modules:Record<string,ReactNode>;ads:AdsConfig}){
 assertAdAnchor(ads,'a2',['content-midpoint',...sections.map(section=>section.id)],'article-page');
 const midpoint=sections[Math.min(1,sections.length-1)]?.id;
 const ad=(id:string,position:'before'|'after')=><>{id===midpoint&&<ConfiguredAdSlot ads={ads} placement="a2" template="article-page" anchor="content-midpoint" position={position}/>}<ConfiguredAdSlot ads={ads} placement="a2" template="article-page" anchor={id} position={position}/></>;
 return <>{sections.map(section=><Fragment key={section.id}>{ad(section.id,'before')}<section className="article-section" id={section.id} data-floor={section.id}>{section.title&&<h2>{section.title}</h2>}{section.description&&<p>{section.description}</p>}{modules[section.id]}</section>{section.id===sections[0]?.id&&<AdContentSlot/>}{ad(section.id,'after')}</Fragment>)}</>;
}
