import {AdContentSlot} from '@/components/ads/AdContentSlot';
import Link from 'next/link';
import {Fragment} from 'react';
import {HeroMotion,HeroTitle} from '@/components/motion/HeroMotion';
import {Reveal} from '@/components/motion/Reveal';
import type {ContentIndex} from '@/content/types';
import type {HomeDiscoveryLink,HomeFloorLayout} from '@/content/home-discovery';
import {Media} from '@/components/content/Media';
import {VideoCard} from '@/components/content/VideoCard';
import {ContentLink} from '@/components/content/ContentLink';
import {SectionHeading} from '@/components/content/SectionHeading';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
import {ConfiguredAdSlot,assertAdAnchor} from '@/components/ads/AdSlot';
import {homeModel} from './model';
import {HomeFaqAccordion} from './HomeFaqAccordion';
import {WeaponShuffleGrid} from './WeaponShuffleGrid';
import {CharacterSpotlight} from './CharacterSpotlight';
import './site-home.css';

function DiscoveryCard({index,locale,item,layout,featured=false,carousel=false,hoverReveal=false,showMeta=true}:{index:ContentIndex;locale:string;item:HomeDiscoveryLink;layout:HomeFloorLayout;featured?:boolean;carousel?:boolean;hoverReveal?:boolean;showMeta?:boolean}){
 const imageId=item.thumbnailId??((featured||carousel||hoverReveal)?item.heroId:undefined);const thumbnail=imageId?index.assets[imageId]:undefined;
 return <Link href={item.path} className={`home-discovery-card home-discovery-card--${layout}${featured?' home-discovery-card--featured':''}${carousel?' home-discovery-card--carousel':''}${hoverReveal?' home-discovery-card--hover-reveal':''}`}>
  {thumbnail?.src&&(featured||carousel||hoverReveal||layout==='media')?<Media asset={thumbnail} locale={locale} variant="card"/>:null}
  <span className="home-discovery-card__body">
   {showMeta&&<span className="home-discovery-card__meta"><span>{item.categoryTitle}</span>{!carousel&&<span>{item.verification}</span>}</span>}
   <h3>{item.title}</h3>
   <span className="home-discovery-card__description">{item.description}</span>
   <span className="home-discovery-card__arrow"><ArrowRightIcon/></span>
  </span>
 </Link>;
}

export function SiteHome({index,locale}:{index:ContentIndex;locale:string}){
 const {home,dictionary,featured,floors,categories,characterSpotlight}=homeModel(index,locale);const {ui}=dictionary;
 const weaponShowcaseAsset=home.weaponShowcase?index.assets[home.weaponShowcase.asset]:undefined;
 const categoryOrder=new Map(categories.map(category=>[category.id,category.order]));
 const categorySections=floors.map((floor,i)=>({kind:'category' as const,order:home.articleFloors!==undefined?i:categoryOrder.get(floor.id)??Number.MAX_SAFE_INTEGER,floor}));
 const characterSections=characterSpotlight?[{kind:'characters' as const,order:home.articleFloors!==undefined?floors.length:characterSpotlight.order,spotlight:characterSpotlight}]:[];
 const weaponSections=home.articleFloors!==undefined&&home.weaponShowcase&&'title' in home.weaponShowcase?[{kind:'weapons' as const,order:floors.length+1,showcase:home.weaponShowcase}]:[];
 const homeSections=[...categorySections,...characterSections,...weaponSections].sort((a,b)=>a.order-b.order);
 const sectionAnchor=(section:(typeof homeSections)[number])=>section.kind==='characters'?'category-characters':section.kind==='weapons'?`category-${section.showcase.categoryId}`:`category-${section.floor.id}`;
 const a2Anchors=['featured','about',...homeSections.map(sectionAnchor),'faq'];
 assertAdAnchor(index.ads,'a2',a2Anchors,'site-home');
 const a2=(anchor:string,position:'before'|'after')=><ConfiguredAdSlot ads={index.ads} placement="a2" template="site-home" anchor={anchor} position={position}/>;
 const faqSupport=home.faq.support?<p className="home-faq-support">{home.faq.support.prefix} <ContentLink index={index} locale={locale} target={home.faq.support.link.target}>{home.faq.support.link.label}</ContentLink> {home.faq.support.suffix}</p>:null;
 const renderSection=(section:(typeof homeSections)[number])=>{
  if(section.kind==='characters')return <Reveal><CharacterSpotlight entries={section.spotlight.entries} locale={locale} copy={section.spotlight.copy} path={section.spotlight.path} actionLabel={ui.viewAll}/></Reveal>;
  if(section.kind==='weapons')return weaponShowcaseAsset?.src?<Reveal as="section" data-floor={`category-${section.showcase.categoryId}`} className="home-floor home-weapon-floor"><div className="home-weapon-copy"><SectionHeading eyebrow={section.showcase.eyebrow} title={section.showcase.title} description={section.showcase.description}/><Link href={index.categories[`${locale}:${section.showcase.categoryId}`].path} className="button button-ghost">{ui.viewAll}<ArrowRightIcon/></Link></div><WeaponShuffleGrid src={weaponShowcaseAsset.src} label={section.showcase.ariaLabel}/></Reveal>:null;
  const floor=section.floor;
  if(floor.id==='weapons'&&home.articleFloors===undefined&&home.weaponShowcase&&weaponShowcaseAsset?.src)return <Reveal as="section" data-floor={`category-${floor.id}`} className="home-floor home-weapon-floor"><div className="home-weapon-copy"><SectionHeading eyebrow={floor.eyebrow} title={floor.title} description={floor.description}/><Link href={floor.path} className="button button-ghost">{ui.viewAll}<ArrowRightIcon/></Link></div><WeaponShuffleGrid src={weaponShowcaseAsset.src} label={home.weaponShowcase.ariaLabel}/></Reveal>;
  if(home.articleFloors!==undefined)return <Reveal as="section" data-floor={`category-${floor.id}`} className="home-floor home-task-floor"><div className="floor-heading-row"><div className="section-heading"><h2>{floor.title}</h2><p>{floor.description}</p></div></div><div className="home-route-list">{floor.items.map(item=><Link key={item.id} href={item.path} className="home-route-link"><span><h3>{item.title}</h3><span>{item.description}</span></span><ArrowRightIcon/></Link>)}</div></Reveal>;
  const hoverReveal=floor.id==='guides'||floor.hoverReveal;
  return <Reveal as="section" data-floor={`category-${floor.id}`} className={`home-floor home-category-floor home-category-floor--${floor.layout}${floor.hoverReveal?' home-article-floor':''}`}><div className="floor-heading-row"><SectionHeading eyebrow={floor.eyebrow} title={floor.title} description={floor.description}/></div><div className={`home-discovery-grid home-discovery-grid--${floor.layout}${hoverReveal?' home-discovery-grid--hover-reveal':''}`}>{floor.items.map(item=><DiscoveryCard key={item.id} index={index} locale={locale} item={item} layout={floor.layout} hoverReveal={hoverReveal} showMeta={false}/>)}</div></Reveal>;
 };
 return <div data-template="site-home">
  <HeroMotion className="home-hero" data-floor="hero"><Media asset={index.assets[home.hero.asset]} locale={locale} variant="hero"/><div aria-hidden="true" className="hero-veil"/><div aria-hidden="true" className="hero-vignette"/>
   <div className="home-hero-grid"><div className="hero-eyebrow" data-hero-step><span aria-hidden="true"/>{home.hero.eyebrow}</div><div className="hero-copy"><HeroTitle title={home.hero.title} fontSize="var(--fluid-d1)"/><p data-hero-step>{home.hero.description}</p><div className="hero-actions" data-hero-step>{home.cta.links.map((link,i)=><ContentLink key={link.label} index={index} locale={locale} target={link.target} className={i===0?'button button-primary':i===1?'button button-secondary':'text-action'}>{i===0&&<span aria-hidden="true" data-sweep/>}<span className="button-label">{link.label}</span></ContentLink>)}</div></div>{home.hero.video&&<div id="video" className="hero-aside"><VideoCard url={home.hero.video.url} title={home.hero.video.title}/></div>}{home.hero.stats&&<div className="hero-stat-run">{home.hero.stats.map(stat=><span key={stat.label}>{stat.label} <span>{stat.value??ui.unknown}</span></span>)}</div>}</div>
  </HeroMotion>
  <main id="main" className="container home-main">

   <Reveal as="section" data-floor="featured" className="home-featured"><div className="home-featured-heading"><SectionHeading {...home.featured}/></div><div className="home-goal-grid">{featured.map((item,i)=><Link key={item.id} href={item.path} className="home-goal-link" data-primary={i===0}><span className="home-goal-section">{i===0?'Keep your progress':item.categoryTitle}</span><h3>{item.title}</h3><p>{item.description}</p><span className="home-goal-action">{i===0?'Open tracker':i===1?'Follow the route':'Read the guide'}<ArrowRightIcon/></span></Link>)}</div></Reveal>
   <AdContentSlot/>{a2('about','before')}
   <Reveal as="section" data-floor="about" className="home-floor home-about"><div className="home-about-grid"><div><SectionHeading {...home.about}/>{home.about.paragraphs.map((paragraph,i)=><p className="home-about-paragraph" key={i}>{paragraph}</p>)}<ContentLink index={index} locale={locale} target={home.about.link.target} className="text-action">{home.about.link.label}<ArrowRightIcon/></ContentLink></div><dl className="fact-sheet">{home.about.facts.map(fact=><div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value??ui.unknown}</dd></div>)}</dl></div></Reveal>
   {a2('about','after')}
   {homeSections.map((section,sectionIndex)=><Fragment key={section.kind==='characters'?'characters':section.kind==='weapons'?'weapons':section.floor.id}>
    {a2(sectionAnchor(section),'before')}
    {renderSection(section)}
    {a2(sectionAnchor(section),'after')}
    {sectionIndex===0&&index.ads.placements.a2['site-home'].anchor==='featured'&&<AdContentSlot slot="inline"/>}
   </Fragment>)}
   {a2('faq','before')}
   <Reveal as="section" id="faq" data-floor="faq" className="home-faq"><div className="home-faq-grid"><div className="home-faq-intro"><SectionHeading {...home.faq}/>{faqSupport&&<div className="home-faq-support-slot home-faq-support-slot--desktop">{faqSupport}</div>}</div><div><HomeFaqAccordion items={home.faq.items}/>{faqSupport&&<div className="home-faq-support-slot home-faq-support-slot--mobile">{faqSupport}</div>}</div></div></Reveal>
   {a2('faq','after')}
  </main>
 </div>;
}
