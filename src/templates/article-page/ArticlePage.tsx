import {AdContentSlot} from '@/components/ads/AdContentSlot';
import Link from 'next/link';
import {Fragment,type ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {articleOutline} from '@/content/article-outline';
import {AnchorRail} from '@/components/chrome/AnchorRail';
import {Reveal} from '@/components/motion/Reveal';
import {Media} from '@/components/content/Media';
import {ArticleStatus} from './ArticleBlocks';
import {ConfiguredAdSlot,assertAdAnchor} from '@/components/ads/AdSlot';
import {wikiArticle} from './wiki';
import {referenceArticle} from './reference';
import {characterArticle} from './character';
import {weaponArticle} from './weapon';
import {systemsArticle} from './systems';
import {modArticle} from './mod';
import {CompletionTool} from '@/features/forever-ago/CompletionTool';
import {completionToolForPage} from '@/features/forever-ago/completion-data';
import '../wiki-page/wiki-page.css';
import './article-page.css';

export type ArticleModules={
 summary?:ReactNode;
 sections:Record<string,ReactNode>;
};

export function ArticlePage({index,page,body}:{index:ContentIndex;page:IndexedPage;body:ReactNode}){
 const ui=index.dictionaries[page.locale].ui;
 const policyPage=page.category==='_pages';const adMode=policyPage?'disabled':index.ads.mode;
 const category=index.categories[`${page.locale}:${page.category}`];
 const heroArt=page.assets.hero?index.assets[page.assets.hero]:undefined;
 const modules=(()=>{switch(page.template){
  case 'wiki-page':return page.articleRecord?referenceArticle(index,page,body):wikiArticle(index,page,body);
  case 'character-detail':return characterArticle(index,page,body);
  case 'weapon-detail':return weaponArticle(index,page,body);
  case 'systems-reference':return systemsArticle(index,page,body);
  case 'mod-detail':return modArticle(index,page,body);
  default:throw new Error(`${page.sourcePath}: unsupported article type ${page.template}`);
 }})();
 const sections=articleOutline(index,page);
 const inlineAdAfter=sections[Math.min(1,sections.length-1)]?.id;
 assertAdAnchor(index.ads,'a2',['content-midpoint',...sections.map(section=>section.id)],'article-page');
 const bodyAds=page.template==='wiki-page'&&!page.articleRecord;
 const immediateBody=index.site.siteId==='forever-ago'&&['forever-ago-game-length','forever-ago-photo-puzzle','forever-ago-camera-achievements'].includes(page.id);
 const a2=(sectionId:string,position:'before'|'after')=>bodyAds?null:<>{sectionId===inlineAdAfter&&<ConfiguredAdSlot ads={index.ads} mode={adMode} placement="a2" template="article-page" anchor="content-midpoint" position={position}/>}<ConfiguredAdSlot ads={index.ads} mode={adMode} placement="a2" template="article-page" anchor={sectionId} position={position}/></>;
 for(const section of sections)if(modules.sections[section.id]===undefined)throw new Error(`${page.sourcePath}: missing article module ${section.id}`);
 const hasCompletionTool=index.site.siteId==='forever-ago'&&page.locale==='en'&&completionToolForPage(page.id)!==null;
 const headings=[...(hasCompletionTool?[{id:'completion-checklist',text:'Completion checklist',depth:2 as const}]:[]),...sections.flatMap((section,i)=>[
  ...(section.title?[{id:section.id,text:section.title,depth:2 as const}]:[]),
  ...(i===0?page.headings:[]),
 ])];
 return <div data-template="article-page" data-article-type={page.template}>
  <header className="article-hero inner-hero" data-hero-size="article" data-theme-mode="night" data-floor="hero" data-has-art={Boolean(heroArt?.src)}>
   {heroArt?.src&&<div className="article-hero-art"><Media asset={heroArt} locale={page.locale} eager/></div>}
   <div className="article-header container inner-hero-content">
   <nav className="breadcrumb" aria-label={ui.breadcrumb}><Link href={index.translationGroups.home[page.locale]} prefetch={false}>{ui.home}</Link><span aria-hidden="true">/</span>{category&&<><Link href={category.path} prefetch={false}>{category.title}</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{page.title}</span></nav>
   <div className="article-kicker">{category&&<span>{category.title}</span>}{!policyPage&&<ArticleStatus value={page.verification} ui={ui}/>} {!policyPage&&page.demo&&<span>{ui.demo}</span>}</div>
   <div className="article-hero-copy"><h1>{page.title}</h1>
   <section className="article-quick-answer" aria-labelledby="article-quick-answer-title"><h2 id="article-quick-answer-title">Quick Answer</h2>{(page.quickAnswer??[page.description]).map((line,i)=><p key={i}>{line}</p>)}</section>
   {(page.author||page.gameVersion||page.updatedAt)&&<div className="article-metadata">
    {page.author&&<span>{ui.author}: {page.author.url?<a href={page.author.url} rel="noopener noreferrer" target="_blank">{page.author.name}</a>:page.author.name}</span>}
    {page.gameVersion&&<span>{ui.version}: {page.gameVersion}</span>}
    {page.updatedAt&&<span>{ui.updated}: <time dateTime={page.updatedAt}>{page.updatedAt}</time></span>}
   </div>}
   </div></div>
  </header>
  <main id="main" className="article-main container">
   {modules.summary&&<div className="article-summary" data-article-summary>{modules.summary}</div>}
   <div className="article-layout">
    <div className="article-directory"><AnchorRail headings={headings} label={ui.onThisPage} mobilePicker={false}/></div>
    <article className="article-content">
     <CompletionTool index={index} page={page}/>
     {sections.map(section=><Fragment key={section.id}>{a2(section.id,'before')}<Reveal as="section" id={section.id} className="article-section" data-floor={section.id} data-revealed={immediateBody&&section.id==='article-body'?'true':undefined}>
      {section.title&&<h2>{section.title}</h2>}{section.description&&<p className="article-section-description">{section.description}</p>}
      {modules.sections[section.id]}
     </Reveal>{!bodyAds&&!policyPage&&section.id===sections[0]?.id&&<AdContentSlot/>}{a2(section.id,'after')}</Fragment>)}
    </article>
   </div>
  </main>
 </div>;
}
