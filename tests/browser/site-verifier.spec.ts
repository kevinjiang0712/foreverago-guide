import {renderedTemplate} from '../../src/content/template-layouts';
import {test,expect} from '@playwright/test';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import type {AddressInfo} from 'node:net';
import {siteFixture} from '../unit/site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {createMetadata} from '../../src/seo/metadata';
import {buildNavigation} from '../../src/content/navigation';
import {createStructuredData} from '../../src/seo/structured-data';
import {verifySite} from '../../scripts/verify-site';

const escapeHtml=(value:unknown)=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const expectedFailures={missingNavigation:'Navigation items do not match',htmlSitemap:'Invalid sitemap XML',absoluteInternalLink:'Unknown internal link',crossPageAnchor:'Missing anchor',redirectAnchor:'Missing anchor',brokenRedirect:'Incorrect redirect response',wrongRedirect:'Incorrect redirect response',heroLink:'Unknown internal link',conflictingRobots:'Incorrect robots'};
for(const defect of ['control','missingNavigation','htmlSitemap','absoluteInternalLink','crossPageAnchor','redirectAnchor','brokenRedirect','wrongRedirect','heroLink','conflictingRobots'] as const)test(`site verifier rejects incomplete output: ${defect}`,async()=>{
 const index=buildIndex(await siteFixture(),{preview:false});
 index.redirects.push({source:'/legacy-test',destination:'/',permanent:true});
 const root=await mkdtemp(join(tmpdir(),'verify-site-negative-'));
 await mkdir(join(root,'.generated'));await writeFile(join(root,'.generated/content-index.json'),JSON.stringify(index));
 await mkdir(join(root,'.artifacts/site'),{recursive:true});await writeFile(join(root,'.artifacts/site/summary.json'),JSON.stringify({status:'passed',runId:'old'}));
 const server=createServer((request,response)=>{
  if(request.url==='/legacy-test'&&defect!=='brokenRedirect'){response.statusCode=308;response.setHeader('Location',defect==='wrongRedirect'?'/ja':'/');response.end();return;}
  if(request.url==='/favicon.ico'){response.statusCode=204;response.end();return;}
  response.setHeader('Content-Type','text/html; charset=utf-8');
  if(request.url==='/sitemap.xml'){
   if(defect==='htmlSitemap')response.end('<html><body>Error page instead of sitemap</body></html>');
   else{response.setHeader('Content-Type','application/xml');response.end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');}
   return;
  }
  const route=index.routes[decodeURI(request.url??'/')];if(!route){response.statusCode=404;response.end('Not found');return;}
  const metadata=createMetadata(index,route);
  const navigation=buildNavigation(index,route.locale,route).filter(item=>defect!=='missingNavigation'||item.current);
  const link=(item:{href:string|null;label:string;current?:boolean},className:string)=>item.href?`<a class="${className}" href="${escapeHtml(item.href)}"${item.current?' aria-current="page"':''}>${escapeHtml(item.label)}</a>`:`<span class="${className}">${escapeHtml(item.label)}</span>`;
  const navHtml=navigation.map(item=>`<div class="site-nav-item">${link(item,'site-nav-link')}<div class="site-submenu">${item.children.map(child=>link(child,'site-subrow')).join('')}</div></div>`).join('');
  const template=route.kind==='home'?'site-home':route.kind==='category'?'list-page':renderedTemplate(index.pagesByKey[route.bodyKey].template);
  const otherPath=Object.keys(index.routes).find(path=>path!==route.path)!;
  const jsonLd=JSON.stringify({'@context':'https://schema.org','@graph':createStructuredData(index,route)}).replaceAll('<','\\u003c');
  response.end(`<html lang="${route.locale}"><head><meta charset="utf-8"><title>${escapeHtml(metadata.title)}</title><meta name="description" content="${escapeHtml(metadata.description)}"><meta name="robots" content="${defect==='conflictingRobots'?'noindex, follow, nofollow':'noindex, follow'}"><link rel="canonical" href="${escapeHtml(new URL(route.path,index.site.siteUrl).href)}"><script type="application/ld+json">${jsonLd}</script></head><body><div data-site-shell data-ad-mode="${index.ads.mode}"><nav class="site-navigation">${navHtml}</nav><div data-template="${template}">${defect==='heroLink'?'<section><a href="/missing-hero-destination">Hero CTA</a></section>':''}<main id="main"><h1>${escapeHtml(route.title)}</h1>${defect==='absoluteInternalLink'?`<a href="${index.site.siteUrl}/missing-route">Broken absolute internal link</a>`:''}<a href="${otherPath}#main">Valid cross-page anchor</a><a href="/legacy-test#main">Valid redirect anchor</a>${defect==='redirectAnchor'?'<a href="/legacy-test#absent-review-target">Missing redirect anchor</a>':''}${defect==='crossPageAnchor'?`<a href="${otherPath}#absent-review-target">Missing cross-page anchor</a>`:''}</main></div></div></body></html>`);
 });
 await new Promise<void>(accept=>server.listen(0,'127.0.0.1',accept));
 try{
  let rejected=false;try{await verifySite(root,{build:false,url:`http://127.0.0.1:${(server.address() as AddressInfo).port}`});}catch{rejected=true;}
  const report=JSON.parse(await readFile(join(root,'.artifacts/site/summary.json'),'utf8'));
  expect(report.runId).not.toBe('old');expect(report.checked).toBe(Object.keys(index.routes).length);
  if(defect==='control'){expect(rejected).toBe(false);expect(report.status).toBe('passed');}
  else{expect(rejected).toBe(true);expect(report.status).toBe('failed');expect(report.results.some((result:{errors:string[]})=>result.errors.some(error=>error.includes(expectedFailures[defect])))).toBe(true);}
 }finally{await new Promise(accept=>server.close(accept));await rm(root,{recursive:true,force:true});}
});

test('site verifier cancellation closes a browser waiting for a response and records failure',async()=>{
 const root=await mkdtemp(join(tmpdir(),'verify-site-abort-'));const controller=new AbortController();let requested=false;let abortedAt:number|undefined;
 const index=buildIndex(await siteFixture(),{preview:false});await mkdir(join(root,'.generated'));await writeFile(join(root,'.generated/content-index.json'),JSON.stringify(index));
 const server=createServer(()=>{requested=true;abortedAt??=Date.now();controller.abort();});
 await new Promise<void>(accept=>server.listen(0,'127.0.0.1',accept));
 try{
  const begin=Date.now();await expect(verifySite(root,{build:false,url:`http://127.0.0.1:${(server.address() as AddressInfo).port}`,signal:controller.signal})).rejects.toThrow('Site verification failed');
  expect(requested).toBe(true);if(abortedAt===undefined)throw new Error('The hanging request did not trigger cancellation');
  // Measure cancellation after the request arrives, independently of browser startup.
  const settledAt=Date.now();await test.info().attach('cancellation-timing',{body:JSON.stringify({startupMilliseconds:abortedAt-begin,cancellationMilliseconds:settledAt-abortedAt}),contentType:'application/json'});expect(settledAt-abortedAt).toBeLessThan(5000);
  const report=JSON.parse(await readFile(join(root,'.artifacts/site/summary.json'),'utf8'));expect(report.status).toBe('failed');expect(report.runErrors.length).toBeGreaterThan(0);
 }finally{server.closeAllConnections();await new Promise(accept=>server.close(accept));await rm(root,{recursive:true,force:true});}
});
