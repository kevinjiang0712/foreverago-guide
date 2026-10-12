import {catalogModel} from '../src/templates/catalog-page/model';
import {isArticleType,isListType} from '../src/content/template-layouts';
import {listPageModel} from '../src/templates/list-page/model';
import {articleOutline} from '../src/content/article-outline';
import type {Page} from '@playwright/test';
import sharp from 'sharp';
import type {ContentIndex,ContentRoute} from '../src/content/types';
import type {TemplateName} from '../src/content/template-names';
import {buildNavigation} from '../src/content/navigation';
import {homeModel} from '../src/templates/site-home/model';
import {contrastRatio} from '../src/content/theme';
export const matrixFloors:Partial<Record<TemplateName,string[]>>={
 'site-home':['hero'],
 'wiki-page':['hero','article-body'],
 'boss-index':['hero','list'],
 'character-database':['hero','list'],
 'character-detail':['hero','article-body','attributes','skills','acquisition'],
 'systems-reference':['hero','mechanisms','combos','items'],
 'weapon-detail':['hero','overview','unlock','tabs','matchups','pairs','faq'],
 'build-library':['hero','list'],
 'weapon-explorer':['hero','comparison','explorer','playstyles','details','tier-list','unlocks','upgrades','changes','faq'],
 'interactive-map':['hero','map','legend','locations','progress','how-to','faq'],
 'mod-index':['hero','list'],
 'database-index':['hero','list'],
 'database-detail':['hero','parameters','overview'],
 'mod-detail':['hero','overview','requirements','install','tabs','conflicts','faq','report'],
};
export function matrixExpectation(index:ContentIndex,route:ContentRoute,template:TemplateName){
 const floors=matrixFloors[template]?.slice();if(!floors)throw new Error(`No reviewed floor contract for ${template}`);
 const page=route.kind==='page'?index.pagesByKey[route.bodyKey]:undefined;
 const record=page?.records.map(id=>index.records[`${route.locale}:${id}`]).find(record=>record.type===template);
 if(page&&['build-library','mod-index','database-index'].includes(template)){
  catalogModel(index,page);return {template:'catalog-page',title:page.title,floors:['hero','list'],media:{} as Record<string,number>,assetIds:[] as string[],currentHrefs:buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href)};
 }
 if(page&&template==='database-detail')return {template:'database-detail',title:page.title,floors,media:{} as Record<string,number>,assetIds:[] as string[],currentHrefs:buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href)};
 if(page&&isListType(template)){
  const model=listPageModel(index,page);
  const assetIds=[page.assets.hero,...model.entries.slice(0,model.perPage).map(entry=>entry.thumbnail?.id)].filter((id):id is string=>Boolean(id&&index.assets[id]?.src));
  return {template:'list-page',title:page.title,floors:['hero','list'],media:{} as Record<string,number>,assetIds,currentHrefs:buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href)};
 }
 if(page&&isArticleType(template)){
  const buildDetail=page.articleRecord&&index.records[`${page.locale}:${page.articleRecord}`]?.type==='build';
  const candidates:(string|null|undefined)[]=buildDetail||template==='mod-detail'?[]:[page.assets.hero,page.guide?.route];
  const reference=page.articleRecord?index.records[`${page.locale}:${page.articleRecord}`]:undefined;
  if(reference?.type==='build')candidates.push(reference.assetId);
  if(reference?.type==='boss-index'&&reference.detail)candidates.push(reference.entities.find(entity=>entity.id===reference.detail!.entityId)?.assetId,reference.detail.videoAssetId);
  if(reference?.type==='character-database'){const lead=index.records[`${page.locale}:${reference.leadCharacterId}`];if(lead.type==='character')candidates.push(lead.assetId);}
  if(reference?.type==='mod-index')candidates.push(reference.safetyAssetId);
  if(record?.type==='character-detail'){
   const character=index.records[`${page.locale}:${record.characterId}`];if(character.type==='character')candidates.push(character.assetId);
   candidates.push(...record.skills.map(skill=>skill.iconAssetId));
  }
  if(record?.type==='weapon-detail'||record?.type==='mod-detail')candidates.push(...record.gallery);
  if(record?.type==='weapon-detail'){const weapon=index.records[`${page.locale}:${record.weaponId}`];if(weapon.type==='weapon')candidates.push(weapon.iconAssetId);}
  if(record?.type==='systems-reference'){
   candidates.push(record.diagramAssetId);
   for(const id of record.itemIds){const item=index.records[`${page.locale}:${id}`];if(item.type==='weapon'||item.type==='item')candidates.push(item.assetId);}
  }
  const assetIds=candidates.filter((id):id is string=>Boolean(id&&index.assets[id]?.src));
  return {template:buildDetail?'build-detail':template==='mod-detail'?'mod-detail':'article-page',title:page.title,floors:['hero',...articleOutline(index,page).map(section=>section.id)],media:{} as Record<string,number>,assetIds,currentHrefs:buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href)};
 }

 const media:Record<string,number>={hero:1};const title=page?.title??index.homes[route.locale].hero.title;
 if(template==='site-home'){
  const model=homeModel(index,route.locale);const categoryOrder=new Map(model.categories.map(category=>[category.id,category.order]));media.hero=1;
  const sections=[...model.floors.map(floor=>({id:`category-${floor.id}`,order:categoryOrder.get(floor.id)??Number.MAX_SAFE_INTEGER})),...(model.characterSpotlight?[{id:'category-characters',order:model.characterSpotlight.order}]:[])].sort((a,b)=>a.order-b.order);
  floors.splice(0,floors.length,'hero','featured','about',...sections.map(section=>section.id),'faq');
 }
 else if(record?.type==='boss-index'){media['boss-index']=record.entities.length+Number(Boolean(record.unrevealed));media['boss-detail']=record.detail?2:0;}
 else if(record?.type==='character-database'){media.lead=1;media.cast=record.characterIds.length+Number(Boolean(record.unrevealed));}

 else if(record?.type==='build-library'){media['find-build']=record.buildIds.filter(id=>{const build=index.records[`${route.locale}:${id}`];return build.type==='build'&&Boolean(build.assetId);}).length;}
 else if(record?.type==='weapon-explorer'){media.explorer=1;media.details=record.detailSections.length;media.upgrades=1;}
 else if(record?.type==='interactive-map'){media.map=1;media.progress=1;}
 else if(record?.type==='mod-index'){media.browse=Math.min(record.perPage,record.modIds.length);media.safety=1;}
 return {template,title,floors,media,assetIds:[] as string[],currentHrefs:buildNavigation(index,route.locale,route).filter(item=>item.current).map(item=>item.href)};
}
export type MatrixExpectation=ReturnType<typeof matrixExpectation>;
export async function inspectMatrixLayout(page:Page,expected:MatrixExpectation){
 const measured=await page.evaluate(()=>({
  templates:[...document.querySelectorAll('[data-template]')].map(element=>element.getAttribute('data-template')),
  headings:[...document.querySelectorAll('h1')].map(element=>(element.querySelector('.sr-only')??element).textContent?.trim()),
  currentHrefs:[...document.querySelectorAll('.site-navigation [aria-current="page"]')].map(element=>element.getAttribute('href')),
  floors:[...document.querySelectorAll('[data-template] [data-floor]')].map(element=>{
   const box=element.getBoundingClientRect();let opacity=1;let ancestor:Element|null=element;
   while(ancestor){opacity*=Number(getComputedStyle(ancestor).opacity);ancestor=ancestor.parentElement;}
   return {id:element.getAttribute('data-floor'),width:box.width,height:box.height,visible:element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),opacity};
  }),
  media:[...document.querySelectorAll('[data-template] .media-slot, [data-template] .mod-placeholder, [data-template] .map-plate-placeholder, [data-template] .map-comparison-placeholder')].filter(element=>!element.closest('[role="tabpanel"][hidden], details:not([open])')).map(element=>{
   const box=element.getBoundingClientRect();const image=element.querySelector('img');let exposed=true;let ancestor=element.parentElement;
   while(ancestor){const style=getComputedStyle(ancestor);const bounds=ancestor.getBoundingClientRect();if(/hidden|clip|scroll|auto/.test(style.overflowX)&&(box.right<=bounds.left||box.left>=bounds.right))exposed=false;if(/hidden|clip|scroll|auto/.test(style.overflowY)&&(box.bottom<=bounds.top||box.top>=bounds.bottom))exposed=false;ancestor=ancestor.parentElement;}
   return {assetId:element.getAttribute('data-media-id'),floor:element.closest('[data-floor]')?.getAttribute('data-floor'),width:box.width,height:box.height,visible:element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}),exposed,loaded:!image||(image.complete&&image.naturalWidth>0),imageVisible:!image||(image.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&image.getBoundingClientRect().width>0&&image.getBoundingClientRect().height>0&&getComputedStyle(image).clipPath==='none')};
  }),
  titles:[...document.querySelectorAll('h1')].map(element=>{
   const box=element.getBoundingClientRect();const glyphs=[...element.querySelectorAll('[data-word]>span')];const rectangles:DOMRect[]=[];const textParents:Element[]=[];let visible=element.checkVisibility({checkOpacity:true,checkVisibilityCSS:true});
   const textWalker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);while(textWalker.nextNode()){const node=textWalker.currentNode;if(node.textContent?.trim()&&node.parentElement&&!node.parentElement.closest('.sr-only,.visually-hidden'))textParents.push(node.parentElement);}
   for(const glyph of [...glyphs,...textParents]){let ancestor:Element|null=glyph;let opacity=1;while(ancestor){const style=getComputedStyle(ancestor);opacity*=Number(style.opacity);if(style.clipPath!=='none'||(style.clip!=='auto'&&style.clip!==''))visible=false;ancestor=ancestor.parentElement;}if(opacity<.99||!glyph.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))visible=false;}
   if(glyphs.length)rectangles.push(...glyphs.map(glyph=>glyph.getBoundingClientRect()));
   else {const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(!node.textContent?.trim()||(node.parentElement?.closest('.sr-only,[aria-hidden="true"]')))continue;const range=document.createRange();range.selectNodeContents(node);rectangles.push(...range.getClientRects());}}
   let clipped=false;let ancestor:Element|null=element;while(ancestor){const style=getComputedStyle(ancestor);const bounds=ancestor.getBoundingClientRect();if(/hidden|clip|scroll|auto/.test(style.overflowX))clipped||=rectangles.some(rect=>rect.left<bounds.left-1||rect.right>bounds.right+1);if(/hidden|clip|scroll|auto/.test(style.overflowY))clipped||=rectangles.some(rect=>rect.top<bounds.top-1||rect.bottom>bounds.bottom+1);ancestor=ancestor.parentElement;}
   return {width:box.width,height:box.height,glyphCount:rectangles.length,clipped,visible};
  }),
  viewport:document.documentElement.clientWidth,width:document.documentElement.scrollWidth,
 }));
 const errors:string[]=[];
 if(JSON.stringify(measured.templates)!==JSON.stringify([expected.template]))errors.push(`Wrong template: ${measured.templates.join(', ')}`);
 if(JSON.stringify(measured.headings)!==JSON.stringify([expected.title.trim()]))errors.push(`Wrong H1: ${JSON.stringify(measured.headings)}`);
 if(JSON.stringify(measured.currentHrefs.map(href=>href?decodeURI(href):href))!==JSON.stringify(expected.currentHrefs))errors.push(`Wrong current navigation: ${JSON.stringify(measured.currentHrefs)}`);
 if(JSON.stringify(measured.floors.map(floor=>floor.id))!==JSON.stringify(expected.floors))errors.push(`Missing, extra or reordered floors: ${measured.floors.map(floor=>floor.id).join(', ')}`);
 if(measured.floors.some(floor=>!floor.visible||floor.opacity<.99||floor.width<=0||floor.height<=0))errors.push('Fixed floor or its ancestor remains hidden');
 for(const [floor,minimum] of Object.entries(expected.media))if(measured.media.filter(media=>media.floor===floor).length<minimum)errors.push(`Missing media in ${floor}; requires ${minimum}`);
 for(const id of expected.assetIds)if(!measured.media.some(media=>media.assetId===id))errors.push(`Missing supplied article asset: ${id}`);
 if(measured.media.some(media=>!media.visible||media.width<=0||media.height<=0||(media.exposed&&(!media.loaded||!media.imageVisible))))errors.push('Media is hidden, empty or failed to load');
 if(measured.titles.some(title=>title.clipped||!title.glyphCount||!title.visible))errors.push('Hero title glyphs are clipped or missing');
 if(measured.width>measured.viewport+1)errors.push(`Horizontal overflow: ${measured.width}/${measured.viewport}`);
 return {measured,errors};
}
export type PaintLayer={background:string;opacity:number;backgroundImage?:string};
function rgba(value:string):number[]{
 const channels=value.match(/[\d.]+/g)?.map(Number);if(!/^rgba?\(/.test(value)||!channels||channels.length<3)throw new Error(`Cannot measure CSS color ${value}`);
 return [channels[0],channels[1],channels[2],channels[3]??1];
}
function composite(front:number[],back:number[]){
 const alpha=front[3]+back[3]*(1-front[3]);return [0,1,2].map(i=>alpha?(front[i]*front[3]+back[i]*back[3]*(1-front[3]))/alpha:0).concat(alpha);
}
function hex(channels:number[]){return '#'+channels.slice(0,3).map(channel=>Math.round(channel).toString(16).padStart(2,'0')).join('');}
export function layeredContrast(color:string,layers:PaintLayer[]){
 let ink=rgba(color),background=[0,0,0,0];
 for(const layer of layers){if(layer.backgroundImage&&layer.backgroundImage!=='none')throw new Error(`Text contrast needs image-backed background measurement: ${layer.backgroundImage}`);ink=composite(ink,rgba(layer.background));background=composite(background,rgba(layer.background));ink[3]*=layer.opacity;background[3]*=layer.opacity;}
 return contrastRatio(hex(composite(ink,[255,255,255,1])),hex(composite(background,[255,255,255,1])));
}
export async function inspectTextContrast(page:Page,selector:string){
 const readPaint=()=>page.locator(selector).evaluateAll(elements=>{
  const seen=new Set<Node>();const colors:{text:string;color:string;state:string;layers:PaintLayer[];rectangles:{x:number;y:number;width:number;height:number}[]}[]=[];
  for(const element of elements){
   if((element as HTMLButtonElement).disabled)continue;
   const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);
   while(walker.nextNode()){
    const node=walker.currentNode;const parent=node.parentElement;const text=node.textContent?.trim();
    if(!parent||!text||seen.has(node)||(parent.closest('.sr-only,.visually-hidden')||(parent.closest('[aria-hidden="true"]')&&!parent.closest('[data-word]')))||!parent.checkVisibility({checkOpacity:true,checkVisibilityCSS:true}))continue;
    seen.add(node);const range=document.createRange();range.selectNodeContents(node);if(![...range.getClientRects()].some(rect=>rect.width>0&&rect.height>0))continue;
    let ancestor:Element|null=parent;const layers:PaintLayer[]=[];const state=[];
    while(ancestor){const paint=getComputedStyle(ancestor);layers.push({background:paint.backgroundColor,opacity:Number(paint.opacity),backgroundImage:paint.backgroundImage});state.push({color:paint.color,transform:paint.transform,hover:ancestor.matches(':hover'),active:ancestor.matches(':active'),focus:ancestor.matches(':focus'),pressed:ancestor.getAttribute('aria-pressed'),expanded:ancestor.getAttribute('aria-expanded'),revealed:ancestor.getAttribute('data-revealed')});ancestor=ancestor.parentElement;}
    const rectangles=[];
    for(const rect of range.getClientRects()){
     let left=rect.left,top=rect.top,right=rect.right,bottom=rect.bottom;let clip:Element|null=parent;
     while(clip){const style=getComputedStyle(clip);const box=clip.getBoundingClientRect();
      if(/hidden|clip|scroll|auto/.test(style.overflowX)){left=Math.max(left,box.left+parseFloat(style.borderLeftWidth));right=Math.min(right,box.right-parseFloat(style.borderRightWidth));}
      if(/hidden|clip|scroll|auto/.test(style.overflowY)){top=Math.max(top,box.top+parseFloat(style.borderTopWidth));bottom=Math.min(bottom,box.bottom-parseFloat(style.borderBottomWidth));}
      clip=clip.parentElement;
     }
     if(right>left&&bottom>top)rectangles.push({x:left+window.scrollX,y:top+window.scrollY,width:right-left,height:bottom-top});
    }
    colors.push({text:text.slice(0,80),color:getComputedStyle(parent).webkitTextFillColor||getComputedStyle(parent).color,state:JSON.stringify(state),layers,rectangles});
   }
  }
  return {colors,page:{x:scrollX,y:scrollY,width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,documentHeight:document.documentElement.scrollHeight,mode:document.documentElement.dataset.mode}};
 });
 await waitForPaint(page);
 // Settle actual finite CSS transitions before taking the one measurement baseline.
 // This is preparation, not a retry of a failed contrast result.
 await waitForTextTransitions(page,selector);
 await waitForPaint(page);
 const before=await readPaint();const {colors}=before;
 if(!colors.length)return [];
 // Only text fill is deliberately hidden; geometry, paint and interaction state must stay identical.
 const signature=(snapshot:typeof before)=>JSON.stringify({...snapshot,colors:snapshot.colors.map(({color,...paint})=>{void color;return paint;})});
 const assertUnchanged=async(stage:string)=>{
  const after=await readPaint();if(signature(after)===signature(before))return;
  const expected=JSON.parse(signature(before));const actual=JSON.parse(signature(after));
  const difference=(left:unknown,right:unknown,path:string):string=>{
   if(JSON.stringify(left)===JSON.stringify(right))return '';
   if(left&&right&&typeof left==='object'&&typeof right==='object')for(const key of new Set([...Object.keys(left),...Object.keys(right)])){const changed=difference((left as Record<string,unknown>)[key],(right as Record<string,unknown>)[key],`${path}.${key}`);if(changed)return changed;}
   return `${path}: ${JSON.stringify(left)} -> ${JSON.stringify(right)}`;
  };
  throw new Error(`Contrast capture changed ${stage}: ${selector}; ${difference(expected,actual,'capture')}`);
 };
 // Hide ink only for measurement. Layout, backgrounds, currentColor and animations stay intact.
 const hideInk=await page.addStyleTag({content:'* { -webkit-text-fill-color: transparent !important; text-shadow: none !important; }'});
 let width:number,height:number,channels:number,pixels:Buffer;
 try{
  await waitForTextTransitions(page,selector);await waitForPaint(page);await assertUnchanged('before screenshot');
  const screenshot=await page.screenshot({fullPage:true,scale:'css'});await assertUnchanged('during screenshot');
  const decoded=await sharp(screenshot).removeAlpha().raw().toBuffer({resolveWithObject:true});pixels=decoded.data;width=decoded.info.width;height=decoded.info.height;channels=decoded.info.channels;
 }
 finally{await hideInk.evaluate(element=>element.parentNode?.removeChild(element));}
 return colors.map(color=>{
  if(color.layers.some(layer=>layer.opacity<.999))throw new Error(`Text contrast requires opaque settled text groups: ${color.text}`);
  const ink=rgba(color.color);let ratio=Infinity;let samples=0;let lowestBackground='';let lowestPoint={x:0,y:0};const ratios=new Map<number,number>();
  for(const rectangle of color.rectangles){
   const left=Math.max(0,Math.ceil(rectangle.x)),right=Math.min(width,Math.floor(rectangle.x+rectangle.width));
   const top=Math.max(0,Math.ceil(rectangle.y)),bottom=Math.min(height,Math.floor(rectangle.y+rectangle.height));
   for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){const offset=(y*width+x)*channels;const background=[pixels[offset],pixels[offset+1],pixels[offset+2],1];const key=(pixels[offset]<<16)|(pixels[offset+1]<<8)|pixels[offset+2];let measuredRatio=ratios.get(key);if(measuredRatio===undefined){measuredRatio=contrastRatio(hex(composite(ink,background)),hex(background));ratios.set(key,measuredRatio);}if(measuredRatio<ratio){ratio=measuredRatio;lowestBackground=hex(background);lowestPoint={x,y};}samples++;}
  }
  if(!samples)throw new Error(`Text has no measurable background pixels: ${color.text}`);
  return {...color,ratio,samples,lowestBackground,lowestPoint,method:'rendered-background-bounds'};
 });
}

async function waitForTextTransitions(page:Page,selector:string){
 await page.waitForFunction(selector=>{
  for(const element of document.querySelectorAll(selector)){
   const animations=new Set(element.getAnimations({subtree:true}));let ancestor=element.parentElement;
   while(ancestor){ancestor.getAnimations().forEach(animation=>animations.add(animation));ancestor=ancestor.parentElement;}
   if([...animations].some(animation=>(animation.playState==='running'||animation.pending)&&Number.isFinite(animation.effect?.getComputedTiming().endTime)))return false;
  }
  return true;
 },selector,{timeout:5000});
}
async function waitForPaint(page:Page){
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
export async function revealPage(page:Page){
 // A timer-only sweep can leave the viewport before an observer receives a rendering frame.
 for(const floor of await page.locator('[data-template] [data-motion-reveal]').all()){
  await floor.scrollIntoViewIfNeeded();await waitForPaint(page);
  try{await floor.and(page.locator('[data-revealed="true"]')).waitFor({state:'attached',timeout:5000});}
  catch(error){throw new Error(`Reveal did not appear: ${await floor.getAttribute('data-floor')??'unnamed floor'}`,{cause:error});}
 }
 await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await waitForPaint(page);
 const settle=await page.evaluate(()=>{
  const hero=document.querySelector('[data-motion-hero]');if(!hero)return 1000;
  const style=getComputedStyle(hero);const durations=['--d-ambient','--d-hero','--d-ui','--stagger-line'].map(name=>{const value=style.getPropertyValue(name).trim();return parseFloat(value)*(value.endsWith('ms')?1:1000);});
  return durations[0]+durations[1]+durations[2]+durations[3]*hero.querySelectorAll('[data-hero-step]').length+800;
 });
 if(!Number.isFinite(settle)||settle>15000)throw new Error(`Invalid hero settling duration: ${settle}`);
 await page.waitForTimeout(Math.max(1000,settle));
}
