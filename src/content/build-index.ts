import {linkCharacterDetails} from './character-detail-links';
import {buildArticle} from './build-articles';
import {isListType} from './template-layouts';
import {validateTemplateRecord} from './template-references';
import type {SiteInput,SourcePage} from './read-site';
import type {ContentIndex,ContentRoute} from './types';
import {contentError} from './issues';
import {indexBy} from './lookup';
import {localePath,reservedRoots} from './paths';
import {isIndexable,isProductionOrigin} from './publication';
import {validateAssetReference,validateHomeReferences,validateTarget} from './references';
import {communityLinkIds,policyPageIds} from './navigation';
function sortPages(a:SourcePage,b:SourcePage):number{
  const order=(a.order??Infinity)-(b.order??Infinity);
  if(Number.isFinite(order)&&order!==0)return order;
  if((a.order===undefined)!==(b.order===undefined))return a.order===undefined?1:-1;
  return (b.updatedAt??b.publishedAt??'').localeCompare(a.updatedAt??a.publishedAt??'')||a.id.localeCompare(b.id);
}
export function buildIndex(input:SiteInput,options:{preview:boolean}):ContentIndex{
  const {site}=input;const production=site.mode==='production';
  if(production&&!isProductionOrigin(site.siteUrl))contentError('config/site.json','siteUrl',site.siteUrl,'production requires a real HTTPS origin');
  const dictionaries=indexBy(input.dictionaries.map(d=>[d.locale,d]));
  const homes=indexBy(input.homes.map(home=>[home.locale,{...home,hero:{...home.hero,title:dictionaries[home.locale].siteName}}]));
  const index:ContentIndex={site,ads:input.ads,preview:options.preview,dictionaries,homes,assets:indexBy(input.assets.map(a=>[a.id,a])),records:indexBy(input.records.map(r=>[`${r.locale}:${r.id}`,r])),routes:indexBy([]),pagesByKey:indexBy([]),translationGroups:indexBy([]),categories:indexBy([]),redirects:[]};
  const pathFor=(locale:string,segments:string[])=>localePath(site.defaultLocale,locale,segments);
  const indexable=(page:{status:'draft'|'published'|'archived';demo:boolean;seo?:{noindex:boolean}},empty=false)=>isIndexable({mode:site.mode,preview:options.preview,status:page.status,demo:page.demo,noindex:site.seo.noindex||page.seo?.noindex,empty});
  const register=(route:ContentRoute,source:string)=>{
    if(index.routes[route.path])contentError(source,'path',route.path,`route collision with ${index.routes[route.path].contentId}`);
    index.routes[route.path]=route;
    (index.translationGroups[route.contentId]??=indexBy([]))[route.locale]=route.path;
  };
  const validatePublished=(page:{status:string;demo:boolean},source:string)=>{
    if(production&&page.status==='published'&&page.demo)contentError(source,'demo',page.demo,'published demonstration content is not allowed in production');
  };
  for(const home of input.homes){
    validatePublished(home,home.sourcePath);
    register({kind:'home',locale:home.locale,path:pathFor(home.locale,[]),contentId:'home',title:home.title,description:home.description,indexable:indexable(home),publishedAt:home.publishedAt,updatedAt:home.updatedAt},home.sourcePath);
  }
  const reserved=new Set([...reservedRoots,...site.locales]);
  for(const category of input.categories){
    if(category.heroAsset)validateAssetReference(index,category.heroAsset,'config/categories.json',`${category.id}.heroAsset`,production);
    if(reserved.has(category.slug))contentError('config/categories.json',`${category.id}.slug`,category.slug,'reserved root segment');
    if(category.landing&&!input.pages.some(p=>p.id===category.landing))contentError('config/categories.json',`${category.id}.landing`,category.landing,'unknown landing content');
    for(const page of input.pages.filter(page=>page.id===category.landing))if(page.category!==category.id)contentError('config/categories.json',`${category.id}.landing`,page.id,`landing must belong to category ${category.id}`);
    for(const locale of site.locales){
      const dictionary=index.dictionaries[locale].categories[category.id];
      if(dictionary.seo?.image)validateAssetReference(index,dictionary.seo.image,`content/locales/${locale}.json`,`categories.${category.id}.seo.image`,production);
      const published=input.pages.filter(page=>page.locale===locale&&page.category===category.id&&page.status==='published').sort(sortPages);
      const path=pathFor(locale,[category.slug]);
      const landing=published.find(p=>p.id===category.landing);
      index.categories[`${locale}:${category.id}`]={...category,locale,path,...dictionary,pages:published.map(p=>`${locale}:${p.id}`),visible:category.navigation&&(published.length>0||Boolean(category.characterIds?.length)||category.showWhenEmpty)};
      if(!landing)register({kind:'category',locale,path,categoryId:category.id,contentId:`category:${category.id}`,title:dictionary.title,description:dictionary.description,indexable:indexable({status:'published',demo:site.mode==='demo'},published.length===0&&!category.characterIds?.length)},'config/categories.json');
    }
  }
  const rendering=input.pages.filter(page=>page.status==='published'||options.preview);
  for(const page of rendering){
    validatePublished(page,page.sourcePath);
    const category=input.categories.find(c=>c.id===page.category);
    if(page.category!=='_pages'&&!category)contentError(page.sourcePath,'category',page.category,'unknown category');
    if(page.category==='_pages'&&reserved.has(page.slug))contentError(page.sourcePath,'slug',page.slug,'reserved root segment');
    const landing=category?.landing===page.id&&page.status==='published';
    const path=pathFor(page.locale,category?[category.slug,...(landing?[]:[page.slug])]:[page.slug]);
    const key=`${page.locale}:${page.id}`;
    if(index.pagesByKey[key])contentError(page.sourcePath,'id',page.id,'duplicate content ID');
    const {body,bodyLineOffset,mdxSource,...metadata}=page;
    void body; void bodyLineOffset; void mdxSource;
    index.pagesByKey[key]={...metadata,path,headings:[]};
    register({kind:'page',locale:page.locale,path,categoryId:page.category,bodyKey:key,contentId:page.id,title:page.title,description:page.description,indexable:indexable(page),publishedAt:page.publishedAt,updatedAt:page.updatedAt},page.sourcePath);
  }
  for(const category of Object.values(index.categories)){
    const pages=category.pages.map(key=>index.pagesByKey[key]);
    pages.forEach((page,i)=>{
      if(!page.previous&&i>0)page.previous=pages[i-1].id;
      if(!page.next&&i<pages.length-1)page.next=pages[i+1].id;
    });
  }
  linkCharacterDetails(index);
  for(const category of Object.values(index.categories))if(category.characterIds){
    if(new Set(category.characterIds).size!==category.characterIds.length)contentError('config/categories.json',`${category.id}.characterIds`,category.characterIds,'duplicate character IDs');
    category.characterIds.forEach((id,i)=>{
      const record=index.records[`${category.locale}:${id}`];
      if(!record||record.type!=='character')contentError('config/categories.json',`${category.id}.characterIds.${i}`,id,'requires a character record in the same language');
      if(production&&record.demo)contentError('config/categories.json',`${category.id}.characterIds.${i}`,id,'production category cannot list a demo character');
    });
  }
  for(const key of Object.keys(index.records))validateTemplateRecord(index,key,false);
  for(const page of Object.values(index.pagesByKey)){
    if(page.template==='database-index'&&page.records.filter(id=>index.records[`${page.locale}:${id}`]?.type==='database-index').length!==1)contentError(page.sourcePath,'records',page.records,'requires exactly one database-index record');
    if(page.template==='database-detail'){
      const entries=page.records.map(id=>index.records[`${page.locale}:${id}`]).filter(record=>record?.type==='database-entry');
      if(entries.length!==1||entries[0].type!=='database-entry'||entries[0].contentId!==page.id)contentError(page.sourcePath,'records',page.records,'requires exactly one database-entry linking back to this page');
      const entry=entries[0];const catalogue=Object.values(index.pagesByKey).find(candidate=>candidate.locale===page.locale&&candidate.template==='database-index'&&candidate.records.includes(entry.databaseId));
      if(!catalogue||catalogue.category!==page.category)contentError(page.sourcePath,'category',page.category,'database detail requires its catalogue in the same category');
    }
    if(['boss-index','character-database','character-detail','systems-reference','weapon-detail','build-library','weapon-explorer','mod-index','mod-detail','interactive-map'].includes(page.template)&&page.records.filter(id=>index.records[`${page.locale}:${id}`]?.type===page.template).length!==1)contentError(page.sourcePath,'records',page.records,`requires exactly one ${page.template} record`);
    if(isListType(page.template)&&input.pages.find(source=>source.locale===page.locale&&source.id===page.id)!.body.trim())contentError(page.sourcePath,'body',page.id,'move list body content to its listGuide article');
    if(isListType(page.template)&&page.listGuide===undefined)contentError(page.sourcePath,'listGuide',page.listGuide,'requires an explicit article ID or null when no reference article is provided');
    if(page.listGuide){
      const guide=index.pagesByKey[`${page.locale}:${page.listGuide}`];
      if(!isListType(page.template)||!guide||guide.template!=='wiki-page'||guide.status!=='published'||guide.category!==page.category||!guide.articleRecord||!page.records.includes(guide.articleRecord)||index.records[`${page.locale}:${guide.articleRecord}`]?.type!==page.template)contentError(page.sourcePath,'listGuide',page.listGuide,'requires a published article in this category using the list record');
    }
    if(page.articleRecord){
      const record=index.records[`${page.locale}:${page.articleRecord}`];
      if(page.template!=='wiki-page'||!page.records.includes(page.articleRecord)||!record||!['boss-index','character-database','mod-index','build-library','build'].includes(record.type))contentError(page.sourcePath,'articleRecord',page.articleRecord,'requires a supported listed article record on a wiki-page');
    }
    if(page.template==='build-library'){
      const library=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library')!;
      if(library.type==='build-library')for(const id of library.buildIds){const article=buildArticle(index,page.locale,library.id,id);if(article.category!==page.category)contentError(article.sourcePath,'category',article.category,'build article must belong to its library category');}
    }
    if(page.articleRecord&&index.records[`${page.locale}:${page.articleRecord}`]?.type==='build'){
      const libraries=page.records.map(id=>index.records[`${page.locale}:${id}`]).filter(record=>record?.type==='build-library'&&record.buildIds.includes(page.articleRecord!));
      if(libraries.length!==1)contentError(page.sourcePath,'records',page.records,'build article requires exactly one library containing its build');
    }
    if(page.listGroup&&!Object.hasOwn(index.dictionaries[page.locale].listGroups,page.listGroup))contentError(page.sourcePath,'listGroup',page.listGroup,`missing listGroups translation in ${page.locale}`);
    const requireContent=(id:string,field:string)=>{if(!index.translationGroups[id]?.[page.locale])contentError(page.sourcePath,field,id,`no reachable content in ${page.locale}`);};
    page.related.forEach(id=>requireContent(id,'related'));
    if(page.previous)requireContent(page.previous,'previous');if(page.next)requireContent(page.next,'next');
    if(page.guide?.table){
      const record=index.records[`${page.locale}:${page.guide.table}`];
      if(!record||record.type!=='table')contentError(page.sourcePath,'guide.table',page.guide.table,'requires a table record in the same language');
      if(!page.records.includes(page.guide.table))contentError(page.sourcePath,'guide.table',page.guide.table,'must also be declared in records');
    }
    if(page.guide?.route)validateAssetReference(index,page.guide.route,page.sourcePath,'guide.route',production&&page.status==='published');
    for(const id of page.records){
      const record=index.records[`${page.locale}:${id}`];if(!record)contentError(page.sourcePath,'records',id,'unknown record');
      validateTemplateRecord(index,`${page.locale}:${id}`,production&&page.status==='published');
      if(production&&page.status==='published'&&record.demo)contentError(page.sourcePath,'records',id,'reachable demo record is not production content');
    }
    for(const [slot,id] of Object.entries(page.assets))validateAssetReference(index,id,page.sourcePath,`assets.${slot}`,production&&page.status==='published');
    if(page.card)validateAssetReference(index,page.card.image,page.sourcePath,'card.image',production&&page.status==='published');
    if(page.seo?.image)validateAssetReference(index,page.seo.image,page.sourcePath,'seo.image',production&&page.status==='published');
  }
  if(site.brand.logo)validateAssetReference(index,site.brand.logo,'config/site.json','brand.logo',production);
  if(site.seo.image)validateAssetReference(index,site.seo.image,'config/site.json','seo.image',production);
  for(const id of communityLinkIds){
    if(!Object.hasOwn(site.officialLinks,id))contentError('config/site.json',`officialLinks.${id}`,undefined,'required Community link; use null when unavailable');
    if(site.officialLinks[id])validateTarget(index,site.defaultLocale,{type:'official',id},'config/site.json',`officialLinks.${id}`,production);
  }
  if(site.policies)for(const locale of site.locales){
    if(!index.dictionaries[locale].footer.columns['about-policies'])contentError(`content/locales/${locale}.json`,'footer.columns.about-policies',undefined,'policy pages require the About & Policies footer label');
    for(const id of policyPageIds){const page=index.pagesByKey[`${locale}:${id}`];if(!page||page.category!=='_pages'||page.template!=='wiki-page'||page.status!=='published')contentError('config/site.json',`policies.${locale}.${id}`,id,'requires a published _pages wiki-page in every enabled locale');}
  }
  for(const id of Object.keys(site.homepage.layoutOverrides))if(!input.categories.some(category=>category.id===id))contentError('config/site.json','homepage.layoutOverrides',id,'unknown category');
  for(const locale of site.locales){
    if(!index.dictionaries[locale].footer.columns.community)contentError(`content/locales/${locale}.json`,'footer.columns.community',undefined,'missing Community footer label');
    validateHomeReferences(index,locale,production);
    site.navigation[locale].forEach((entry,i)=>{
      const links=[{entry,path:`navigation.${locale}.${i}.target`},...entry.children.map((child,j)=>({entry:child,path:`navigation.${locale}.${i}.children.${j}.target`}))];
      for(const {entry:link,path} of links){
        const target=link.target;
        if(target.type==='content'&&!input.pages.some(page=>page.id===target.id&&page.locale===locale&&page.status==='published'))contentError('config/site.json',path,target,`navigation requires published content in ${locale}`);
        validateTarget(index,locale,link.target,'config/site.json',path,production);
      }
    });
    const targets=site.footer.columns.flatMap(column=>column.links);
    targets.forEach((target,i)=>validateTarget(index,locale,target,'config/site.json',`links.${i}`,production));
  }
  const redirectSources=new Set<string>();
  for(const [i,redirect] of site.redirects.entries()){
    const destination=index.translationGroups[redirect.to]?.[redirect.locale];
    if(!destination)contentError('config/site.json',`redirects.${i}.to`,redirect.to,'target is not reachable in requested locale');
    const source=redirect.from.length>1?redirect.from.replace(/\/$/,''):redirect.from;
    if(/[:*()+{}[\]\\]/.test(source))contentError('config/site.json',`redirects.${i}.from`,source,'expected a literal old path, not a route pattern');
    if(source.includes('//')||source.split('/').some(part=>part==='.'||part==='..'||/%2f|%5c|%2e/i.test(part)))contentError('config/site.json',`redirects.${i}.from`,source,'invalid redirect path');
    if(index.routes[source]||redirectSources.has(source))contentError('config/site.json',`redirects.${i}.from`,source,'redirect collision or loop');
    if(reservedRoots.has(source.split('/')[1]))contentError('config/site.json',`redirects.${i}.from`,source,'reserved redirect source');
    redirectSources.add(source);index.redirects.push({source,destination,permanent:redirect.permanent});
  }
  return index;
}
