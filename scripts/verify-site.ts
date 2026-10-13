import {renderedTemplate} from '../src/content/template-layouts';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium,type Browser} from '@playwright/test';
import type {ContentIndex} from '../src/content/types';
import {buildNavigation} from '../src/content/navigation';
import {createMetadata} from '../src/seo/metadata';
import {languageAlternates} from '../src/seo/alternates';
import {createStructuredData} from '../src/seo/structured-data';
import {randomUUID} from 'node:crypto';
import {runCommand,startProductionServer} from './test-server';
export async function verifySite(root:string,options:{url?:string;build?:boolean;signal?:AbortSignal}={}){
 const artifact=join(root,'.artifacts/site');await mkdir(artifact,{recursive:true});const runId=randomUUID();
 await writeFile(join(artifact,'summary.json'),JSON.stringify({runId,status:'running'})+'\n');
 const results:{path:string;locale:string;status:'passed'|'failed';errors:string[];links:number}[]=[];
 const anchors=new Map<string,Set<string>>();const fragmentLinks:{from:string;path:string;fragment:string;href:string}[]=[];
 const runErrors:string[]=[];let stage='build';let index:ContentIndex|undefined;let urlCount:number|null=null;
 let started:Awaited<ReturnType<typeof startProductionServer>>|undefined,browser:Browser|undefined;let cancellation:Promise<void>|undefined;
 const cancel=()=>{cancellation=browser?.close().catch(error=>{runErrors.push(`cancel browser: ${String(error)}`);});};
 options.signal?.addEventListener('abort',cancel,{once:true});
 try{
  options.signal?.throwIfAborted();if(options.build!==false)await runCommand('npm',['run','build'],root,{signal:options.signal});options.signal?.throwIfAborted();
  stage='index';index=JSON.parse(await readFile(join(root,'.generated/content-index.json'),'utf8')) as ContentIndex;
  urlCount=Object.keys(index.routes).length;
  if(!urlCount)throw new Error('Content index contains no routes');
  stage='server';started=options.url?undefined:await startProductionServer(root);
  options.signal?.throwIfAborted();const url=options.url??started!.url;const origins=new Set([new URL(url).origin,new URL(index.site.siteUrl).origin]);stage='browser';
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});options.signal?.throwIfAborted();
  const context=await browser.newContext({viewport:{width:1240,height:900}});
  stage='routes';for(const route of Object.values(index.routes)){
   const page=await context.newPage();const errors:string[]=[];page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
   let links=0;
   try{
    const response=await page.goto(new URL(route.path,url).href,{waitUntil:'networkidle'});
    anchors.set(route.path,new Set(await page.locator('[id]').evaluateAll(elements=>elements.map(element=>element.id))));
    if(response?.status()!==200)errors.push(`HTTP ${response?.status()}`);
    if(await page.locator('h1').count()!==1)errors.push('Expected exactly one H1');
    if(await page.locator('html').getAttribute('lang')!==route.locale)errors.push(`Incorrect HTML language, expected ${route.locale}`);
    const metadata=createMetadata(index,route);
    if(await page.title()!==metadata.title)errors.push(`Incorrect page title: ${await page.title()}`);
    if(await page.locator('meta[name="description"]').getAttribute('content')!==metadata.description)errors.push('Incorrect description');
    const actualTemplate=await page.locator('[data-template]').getAttribute('data-template');const expectedTemplate=route.kind==='home'?'site-home':route.kind==='category'?'list-page':renderedTemplate(index.pagesByKey[route.bodyKey].template);
    if(actualTemplate!==expectedTemplate)errors.push(`Incorrect template: ${actualTemplate}, expected ${expectedTemplate}`);
    const adMode=await page.locator('[data-site-shell]').getAttribute('data-ad-mode');
    const expectedAdMode=route.kind==='page'&&index.pagesByKey[route.bodyKey].category==='_pages'?'disabled':index.ads.mode;
    if(adMode!==expectedAdMode)errors.push(`Incorrect ad mode: ${adMode}, expected ${expectedAdMode}`);
    if(index.ads.mode==='disabled'&&await page.locator('[data-ad-placement]').count())errors.push('Disabled ads must not render placement elements');
    const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
    if(canonical!==new URL(route.path,index.site.siteUrl).href)errors.push(`Incorrect canonical: ${canonical}`);
    const robots=await page.locator('meta[name="robots"]').getAttribute('content');
    const directives=new Set(robots?.toLowerCase().split(',').map(token=>token.trim()));
    if(!directives.has('follow')||!directives.has(route.indexable?'index':'noindex')||directives.has(route.indexable?'noindex':'index')||directives.has('nofollow')||directives.has('none'))errors.push(`Incorrect robots for indexable=${route.indexable}: ${robots}`);
    const alternates=await page.locator('link[rel="alternate"][hreflang]').evaluateAll(links=>links.map(link=>[link.getAttribute('hreflang'),link.getAttribute('href')]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
    if(JSON.stringify(alternates)!==JSON.stringify(Object.entries(languageAlternates(index,route)).sort((a,b)=>a[0].localeCompare(b[0]))))errors.push('Incorrect language alternates');
    const actualNavigation=await page.locator('.site-navigation > .site-nav-item').evaluateAll(items=>items.map(item=>{
     const copy=item.cloneNode(true) as Element;copy.querySelectorAll('.site-current-label,.site-caret').forEach(node=>node.remove());
     const link=copy.querySelector(':scope > .site-nav-link');
     return {label:link?.textContent?.trim()??'',href:link?.getAttribute('href')??null,children:[...copy.querySelectorAll('.site-submenu > .site-subrow')].map(child=>({label:child.textContent?.trim()??'',href:child.getAttribute('href')}))};
    }));
    const normalizedHref=(href:string|null)=>href?decodeURI(href):null;
    const normalizeLinks=(items:typeof actualNavigation)=>items.map(item=>({...item,href:normalizedHref(item.href),children:item.children.map(child=>({...child,href:normalizedHref(child.href)}))}));
    const expectedNavigation=buildNavigation(index,route.locale,route).map(item=>({label:item.label,href:item.href,children:item.children.map(child=>({label:child.label,href:child.href}))}));
    if(JSON.stringify(normalizeLinks(actualNavigation))!==JSON.stringify(normalizeLinks(expectedNavigation)))errors.push('Navigation items do not match the content index');
    const structuredData=await page.locator('script[type="application/ld+json"]').allTextContents();
    if(structuredData.length!==1||JSON.stringify(JSON.parse(structuredData[0]))!==JSON.stringify({'@context':'https://schema.org','@graph':createStructuredData(index,route)}))errors.push('Incorrect structured data');
    const current=await page.locator('.site-navigation [aria-current="page"]').evaluateAll(links=>links.map(link=>link.getAttribute('href')));const expected=buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href);
    if(JSON.stringify(current.map(href=>href?decodeURI(href):href))!==JSON.stringify(expected))errors.push(`Incorrect current navigation: ${JSON.stringify(current)}`);
    const hrefs=await page.locator('body a[href]').evaluateAll(anchors=>anchors.map(anchor=>anchor.getAttribute('href')!));
    for(const href of new Set(hrefs)){
     const target=new URL(href,new URL(route.path,url));if(!origins.has(target.origin))continue;links++;
     const pathname=decodeURIComponent(target.pathname);
     if(!index.routes[pathname]&&!index.redirects.some(redirect=>redirect.source===pathname))errors.push(`Unknown internal link: ${href}`);
     if(target.hash)fragmentLinks.push({from:route.path,path:pathname,fragment:decodeURIComponent(target.hash.slice(1)),href});
    }
   }catch(error){errors.push(error instanceof Error?error.message:String(error));}
   results.push({path:route.path,locale:route.locale,status:errors.length?'failed':'passed',errors,links});await page.close();
  }
  stage='redirects';
  for(const redirect of index.redirects){
   const response=await context.request.get(new URL(redirect.source,url).href,{maxRedirects:0});
   const location=response.headers().location;const expectedStatus=redirect.permanent?308:307;
   if(response.status()!==expectedStatus||!location||new URL(location,url).href!==new URL(redirect.destination,url).href)results.push({path:redirect.source,locale:'',status:'failed',errors:[`Incorrect redirect response: HTTP ${response.status()} Location ${location??'(missing)'}; expected ${expectedStatus} ${redirect.destination}`],links:0});
  }
  stage='anchors';
  for(const link of fragmentLinks){
   let path=link.path;const seen=new Set<string>();
   while(!seen.has(path)){seen.add(path);const redirect=index.redirects.find(redirect=>redirect.source===path);if(!redirect)break;path=decodeURIComponent(new URL(redirect.destination,url).pathname);}
   if(!anchors.get(path)?.has(link.fragment)){const result=results.find(result=>result.path===link.from)!;result.errors.push(`Missing anchor: ${link.href}`);result.status='failed';}
  }
  stage='sitemap';const siteUrl=index.site.siteUrl;const expectedSitemap=Object.values(index.routes).filter(route=>route.indexable).map(route=>new URL(route.path,siteUrl).href).sort();
  const sitemapResponse=await context.request.get(new URL('/sitemap.xml',url).href);const xml=await sitemapResponse.text();
  const parser=await context.newPage();
  const sitemap=await parser.evaluate(xml=>{
   const document=new DOMParser().parseFromString(xml,'application/xml');const root=document.documentElement;const namespace='http://www.sitemaps.org/schemas/sitemap/0.9';
   const entries=[...root.children];const valid=!document.querySelector('parsererror')&&root.localName==='urlset'&&root.namespaceURI===namespace&&entries.every(entry=>entry.localName==='url'&&entry.namespaceURI===namespace&&[...entry.children].filter(child=>child.localName==='loc'&&child.namespaceURI===namespace).length===1);
   return {valid,urls:valid?entries.map(entry=>entry.getElementsByTagNameNS(namespace,'loc')[0].textContent?.trim()??'').sort():[]};
  },xml);await parser.close();
  if(sitemapResponse.status()!==200||!sitemap.valid||JSON.stringify(sitemap.urls)!==JSON.stringify(expectedSitemap))results.push({path:'/sitemap.xml',locale:'',status:'failed',errors:['Invalid sitemap XML or URLs do not match indexable content'],links:0});
  await context.close();options.signal?.throwIfAborted();
 }catch(error){runErrors.push(`${stage}: ${error instanceof Error?error.message:String(error)}`);}
 finally{options.signal?.removeEventListener('abort',cancel);await cancellation;for(const cleanup of [()=>browser?.close(),()=>started?.stop()])try{await cleanup();}catch(error){runErrors.push(`cleanup: ${String(error)}`);}}
 const checked=results.filter(result=>result.locale).length;
 const summary={runId,status:!runErrors.length&&urlCount!==null&&checked===urlCount&&results.every(result=>result.status==='passed')?'passed':'failed',checkedAt:new Date().toISOString(),siteMode:index?.site?.mode??null,server:options.url?'provided':'production',buildExecuted:options.build!==false,urlCount,checked,runErrors,results};
 await writeFile(join(artifact,'summary.json'),JSON.stringify(summary,null,2)+'\n');
 if(summary.status!=='passed')throw new Error(`Site verification failed: ${[...runErrors,...results.filter(result=>result.status==='failed').map(result=>`${result.path}: ${result.errors.join('; ')}`)].join('\n')}`);
 return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await verifySite(process.cwd()),null,2));
