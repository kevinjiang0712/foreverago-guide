import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {PageHero} from '@/components/content/PageHero';
import {SectionHeading} from '@/components/content/SectionHeading';
import {Media} from '@/components/content/Media';
import {Disclosure} from '@/components/content/Disclosure';
import {Reveal} from '@/components/motion/Reveal';
import {AnchorRail} from '@/components/chrome/AnchorRail';
import {MapViewport} from '@/components/interactive/MapViewport';
import {ConfiguredAdSlot,assertAdAnchor} from '@/components/ads/AdSlot';
import {interactiveMapModel} from './model';
import './interactive-map.css';
export function InteractiveMap({index,page,body}:{index:ContentIndex;page:IndexedPage;body:ReactNode}){
 const {record,headings,pinLinks}=interactiveMapModel(index,page),ui=index.dictionaries[page.locale].ui;
 const regionImages=Object.fromEntries(record.regions.map(region=>[region.id,region.imageAssetId?<Media asset={index.assets[region.imageAssetId]} locale={page.locale} ratio={`${region.width}/${region.height}`}/>:null]));
 const a2Anchors=['map','legend','locations','progress','how-to','faq'];assertAdAnchor(index.ads,'a2',a2Anchors,'interactive-map');
 const a2=(anchor:string,position:'before'|'after')=><ConfiguredAdSlot ads={index.ads} placement="a2" template="interactive-map" anchor={anchor} position={position}/>;
 return <div data-template="interactive-map"><PageHero index={index} locale={page.locale} pathname={page.path} title={page.title} description={page.description} label={`${record.demo?`${ui.demo} · `:''}${ui[record.verification]} · ${record.regions.length} ${ui.mapRegions} · ${record.pins.length} ${ui.mapPins}`} categoryId={page.category} assetId={page.assets.hero}/><AnchorRail headings={headings} label={ui.onThisPage}/><main id="main" className="container map-main">
  <MapViewport key={`${page.locale}:${record.mapId}:${record.dataVersion}`} record={record} siteId={index.site.siteId} labels={ui} pinLinks={pinLinks} regionImages={regionImages} progressImage={record.progressImageAssetId?<Media asset={index.assets[record.progressImageAssetId]} locale={page.locale} ratio="4/3"/>:null} ads={index.ads}/>
  {a2('how-to','before')}
  <Reveal as="section" id="how-to" data-floor="how-to" className="map-floor"><SectionHeading {...record.sections['how-to']}/><div data-template-body className="map-body">{body}</div><ol className="map-instructions">{record.instructions.map((row,i)=><li key={row.id}><span aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>{row.title}</h3><p>{row.description}</p><small className="map-verification" data-verification={row.verification}>{ui[row.verification]}</small></div></li>)}</ol>{!record.instructions.length&&<p>{ui.empty}</p>}</Reveal>
  {a2('how-to','after')}{a2('faq','before')}
  <Reveal as="section" id="faq" data-floor="faq" className="map-floor map-last"><SectionHeading {...record.sections.faq}/><div className="map-faq">{record.faq.map((row,i)=><Disclosure key={row.id} question={row.question} initialOpen={i===0}><p>{row.answer}</p><small className="map-verification" data-verification={row.verification}>{ui[row.verification]}</small></Disclosure>)}{!record.faq.length&&<p>{ui.empty}</p>}</div></Reveal>
  {a2('faq','after')}
 </main></div>;
}
