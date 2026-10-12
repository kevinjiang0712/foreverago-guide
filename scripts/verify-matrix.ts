import {mkdtemp,mkdir,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {chromium,type Browser,type Page} from '@playwright/test';
import {templateNames,type TemplateName} from '../src/content/template-names';
import {prepareTheme,readPreset} from '../src/content/theme';
import type {ContentIndex} from '../src/content/types';
import {startProductionServer} from './test-server';
import {matrixExpectation,inspectMatrixLayout,inspectTextContrast,revealPage} from './matrix-page';
import presetManifest from '../src/styles/presets/manifest.json';
const widths=[390,834,1240,1600] as const;
const themes=Object.keys(presetManifest);
type MatrixOptions={url?:string;templates?:TemplateName[];themes?:string[];widths?:number[]};
type MatrixResult={template:string;theme:string;mode:'day'|'night';width:number;pageUrl:string;status:'passed'|'failed';screenshot:string|null;checks:Record<string,unknown>;errors:string[]};
function validateSelection<T>(selected:T[],allowed:readonly T[],label:string){
 if(!selected.length||new Set(selected).size!==selected.length||selected.some(value=>!allowed.includes(value)))throw new Error(`Invalid matrix ${label}: ${JSON.stringify(selected)}; expected nonempty unique supported values`);
}
export async function verifyMatrix(root:string,options:MatrixOptions={}){
 const scoped=Boolean(options.templates||options.themes||options.widths);const runId=randomUUID();const startedAt=new Date().toISOString();
 const artifact=join(root,'.artifacts',scoped?'matrix-scoped':'matrix');const runDirectory=join(artifact,runId);await mkdir(runDirectory,{recursive:true});
 const report=join(artifact,'summary.json');await writeFile(report,JSON.stringify({runId,startedAt,status:'running',scoped})+'\n');
 const selectedTemplates=options.templates??[...templateNames],selectedWidths=options.widths??[...widths],selectedThemes=options.themes??themes;
 const expected=selectedTemplates.length*selectedThemes.length*2*selectedWidths.length;
 const planned=selectedThemes.flatMap(theme=>(['day','night'] as const).flatMap(mode=>selectedTemplates.flatMap(template=>selectedWidths.map(width=>({template,theme,mode,width})))));
 const results:MatrixResult[]=[],runErrors:string[]=[];const chromeSignatures=new Map<string,string>();
 let themeRoot:string|undefined,started:Awaited<ReturnType<typeof startProductionServer>>|undefined,browser:Browser|undefined;
 try{
  validateSelection(selectedTemplates,templateNames,'templates');validateSelection(selectedWidths,widths,'widths');validateSelection(selectedThemes,themes,'themes');
  if(planned.length!==expected)throw new Error(`Matrix expected ${expected} combinations; found ${planned.length}`);
  const index=JSON.parse(await readFile(join(root,'.generated/content-index.json'),'utf8')) as ContentIndex;
  const presets=JSON.parse(await readFile(join(root,'src/styles/presets/manifest.json'),'utf8')) as Record<string,{day:string;night:string}>;
  if(Object.keys(presets).length!==themes.length||themes.some(theme=>!presets[theme]?.day||!presets[theme]?.night))throw new Error('Matrix requires complete day/night pairs for every maintained preset');
  const routes=selectedTemplates.map(template=>{
   const route=Object.values(index.routes).find(route=>route.locale===index.site.defaultLocale&&(template==='site-home'?route.kind==='home'&&index.homes[route.locale].status==='published':route.kind==='page'&&index.pagesByKey[route.bodyKey].template===template&&index.pagesByKey[route.bodyKey].status==='published'));
   if(!route)throw new Error(`Matrix requires a real published sample for template ${template}`);return {template,route,expectation:matrixExpectation(index,route,template)};
  });
  themeRoot=await mkdtemp(join(tmpdir(),'game-wiki-matrix-theme-'));started=options.url?undefined:await startProductionServer(root);const baseUrl=options.url??started!.url;
  await cp(join(root,'src/styles/presets'),join(themeRoot,'src/styles/presets'),{recursive:true});await mkdir(join(themeRoot,'config'),{recursive:true});
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  for(const theme of selectedThemes){
   await writeFile(join(themeRoot,'config/theme.json'),JSON.stringify({preset:theme,defaultMode:'night',common:{},day:{},night:{},fonts:[]}));await prepareTheme(themeRoot);
   const css=await readFile(join(themeRoot,'.generated/theme.css'),'utf8');await writeFile(join(runDirectory,`${theme}.css`),css);
   for(const mode of ['day','night'] as const){
    const tokens=await readPreset(root,theme,mode);const context=await browser.newContext({viewport:{width:1240,height:900}});
    try{
     await context.addInitScript(({siteId,mode})=>localStorage.setItem(`${siteId}:mode`,mode),{siteId:index.site.siteId,mode});
     await context.route('**/__matrix_theme.css',route=>route.fulfill({status:200,contentType:'text/css',body:css}));
     const combinations=routes.flatMap(route=>selectedWidths.map(width=>({...route,width})));let cursor=0;
     async function captureNext(){while(cursor<combinations.length){const {template,route,expectation,width}=combinations[cursor++];
      let page:Page|undefined;const errors:string[]=[];const checks:Record<string,unknown>={};let screenshot:string|null=null;const pageUrl=new URL(route.path,baseUrl).href;
      try{
       page=await context.newPage();
       page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
       page.on('request',request=>{if(/(?:support\.js|_ds_bundle|nav-controls\.js|page-interactions\.js)/.test(request.url()))errors.push(`Prototype runtime request: ${request.url()}`);});
       await page.setViewportSize({width,height:900});const response=await page.goto(pageUrl,{waitUntil:'networkidle'});checks.http=response?.status();if(response?.status()!==200)throw new Error(`HTTP ${response?.status()}`);
       await page.addStyleTag({url:`${baseUrl}/__matrix_theme.css`});await page.evaluate(()=>document.fonts.ready);
       const actual=await page.evaluate(()=>({mode:document.documentElement.dataset.mode,surface:getComputedStyle(document.documentElement).getPropertyValue('--surface-page').trim(),font:getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim(),loadedFonts:[...document.fonts].filter(font=>font.status==='loaded').map(font=>font.family)}));checks.theme=actual;
       if(actual.mode!==mode||actual.surface.toLowerCase()!==tokens['--surface-page'].toLowerCase())errors.push(`Theme tokens not applied: expected ${theme}/${mode}/${tokens['--surface-page']}`);
       const family=tokens['--font-display'].split(',')[0].trim().replace(/^["']|["']$/g,'');if(!actual.loadedFonts.some(font=>font.replace(/^["']|["']$/g,'')===family))errors.push(`Display font not loaded: ${family}`);
       await revealPage(page);const layout=await inspectMatrixLayout(page,expectation);checks.layout=layout.measured;errors.push(...layout.errors);
       const contrasts=await inspectTextContrast(page,'[data-template] .button-primary, [data-template] button[aria-pressed="true"], .page-pager a:first-of-type, h1, main p, main h2, main h3');checks.textContrast=contrasts;
       for(const color of contrasts)if(color.ratio<4.5)errors.push(`Text contrast ${color.ratio.toFixed(2)}:1: ${color.text}`);
       const states=[];
       for(const selector of ['[data-template] .button-primary:not(:disabled)','[data-template] button[aria-pressed="true"]','.page-pager a:first-of-type']){
        const control=page.locator(selector).first();if(!await control.count()||!await control.isVisible())continue;
        await control.hover();const hovered=await inspectTextContrast(page,selector);states.push({selector,state:'hover',colors:hovered});
        await page.mouse.down();try{const pressed=await inspectTextContrast(page,selector);states.push({selector,state:'press',colors:pressed});}finally{await page.mouse.move(0,0);await page.mouse.up();}
       }
       checks.interactiveContrast=states;for(const state of states)for(const color of state.colors)if(color.ratio<4.5)errors.push(`${state.state} contrast ${color.ratio.toFixed(2)}:1: ${color.text}`);
       checks.chrome=await page.evaluate(()=>({brand:document.querySelector('.site-brand')?.textContent,nav:[...document.querySelectorAll('.site-navigation > .site-nav-item > .site-nav-link')].map(link=>({href:link.getAttribute('href'),label:link.childNodes[0]?.textContent})),controls:[...document.querySelectorAll('.site-drawer-controls .site-control-label, .site-drawer-controls button[aria-label], .site-burger')].map(control=>({tag:control.tagName,label:control.getAttribute('aria-label')??control.textContent?.trim()})),footer:document.querySelector('footer')?.textContent}));
       const chromeKey=`${theme}:${mode}:${width}`;const signature=JSON.stringify(checks.chrome),first=chromeSignatures.get(chromeKey);if(first&&first!==signature)errors.push('Header/footer differs between templates');else chromeSignatures.set(chromeKey,signature);
       await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(400);
       const filename=`${template}--${theme}--${mode}--${width}.png`;await page.screenshot({path:join(runDirectory,filename),fullPage:true});screenshot=join('.artifacts',scoped?'matrix-scoped':'matrix',runId,filename);checks.screenshotSha256=createHash('sha256').update(await readFile(join(runDirectory,filename))).digest('hex');
      }catch(error){errors.push(error instanceof Error?error.message:String(error));}
      finally{try{await page?.close();}catch(error){errors.push(`Page close: ${String(error)}`);}}
      results.push({template,theme,mode,width,pageUrl,status:errors.length?'failed':'passed',screenshot,checks,errors});
      console.log(`${results.length}/${expected} ${template} ${theme}/${mode} ${width}: ${errors.length?'failed':'passed'}`);
     }}await Promise.all(Array.from({length:Math.min(4,combinations.length)},()=>captureNext()));
    }finally{await context.close();}
   }
  }
 }catch(error){runErrors.push(error instanceof Error?error.message:String(error));}
 finally{
  for(const cleanup of [()=>browser?.close(),()=>started?.stop(),()=>themeRoot?rm(themeRoot,{recursive:true,force:true}):undefined])try{await cleanup();}catch(error){runErrors.push(`Cleanup: ${String(error)}`);}
 }
 const missing=planned.filter(combination=>!results.some(result=>result.template===combination.template&&result.theme===combination.theme&&result.mode===combination.mode&&result.width===combination.width));
 results.sort((a,b)=>a.template.localeCompare(b.template)||a.theme.localeCompare(b.theme)||a.mode.localeCompare(b.mode)||a.width-b.width);
 const failed=results.filter(result=>result.status==='failed').length,captured=results.filter(result=>result.screenshot).length;
 const status=runErrors.length||failed||missing.length||captured!==expected?'failed':'passed';
 const summary={runId,startedAt,finishedAt:new Date().toISOString(),status,scoped,server:options.url?'provided':'production',expected,captured,passed:results.length-failed,failed,blocked:missing.length,runErrors,missing,results};
 await writeFile(report,JSON.stringify(summary,null,2)+'\n');if(!scoped){await mkdir(join(root,'docs/verification'),{recursive:true});const index={...summary,evidenceReport:join('.artifacts','matrix','summary.json'),results:results.map(result=>{
  const normal=result.checks.textContrast as {ratio:number}[]|undefined;
  const states=result.checks.interactiveContrast as {selector:string;state:string;colors:{ratio:number}[]}[]|undefined;
  return {...result,checks:{http:result.checks.http,theme:result.checks.theme,layout:result.checks.layout,screenshotSha256:result.checks.screenshotSha256,
   textContrast:normal?{samples:normal.length,minimum:normal.length?Math.min(...normal.map(sample=>sample.ratio)):null}:null,
   interactiveContrast:states?.map(state=>({selector:state.selector,state:state.state,samples:state.colors.length,minimum:state.colors.length?Math.min(...state.colors.map(sample=>sample.ratio)):null})),
   chromeSha256:result.checks.chrome?createHash('sha256').update(JSON.stringify(result.checks.chrome)).digest('hex'):null}};
 })};await writeFile(join(root,'docs/verification/matrix-summary.json'),JSON.stringify(index,null,2)+'\n');}
 if(status!=='passed')throw new Error(`Matrix incomplete: ${summary.passed} passed, ${failed} failed, ${missing.length} blocked; ${runErrors.join('; ')}; ${report}`);
 return summary;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await verifyMatrix(process.cwd());
