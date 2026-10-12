import { readFile,stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseContent,contentError } from './issues';
import { themeSchema } from './schemas/theme';
import { readJson } from './read-site';
import { writeGenerated } from './write-generated';
import {lookup} from './lookup';
type PresetManifest=Record<string,{day:string;night:string;fontImports:string[]}>;
export function contrastRatio(first:string,second:string):number{
  const luminance=(hex:string)=>{
    if(!/^#[0-9a-f]{6}$/i.test(hex))throw new Error(`Invalid RGB color: ${hex}`);
    const channels=[1,3,5].map(offset=>{const value=parseInt(hex.slice(offset,offset+2),16)/255;return value<=0.04045?value/12.92:((value+0.055)/1.055)**2.4;});
    return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
  };
  const values=[luminance(first),luminance(second)].sort((a,b)=>a-b);return (values[1]+0.05)/(values[0]+0.05);
}
async function presetManifest(root:string){return JSON.parse(await readFile(join(root,'src/styles/presets/manifest.json'),'utf8')) as PresetManifest;}
export async function readPreset(root:string,preset:string,mode:'day'|'night'):Promise<Record<string,string>>{
  const entry=lookup(await presetManifest(root),preset);if(!entry)contentError('config/theme.json','preset',preset,'unknown theme preset');
  const source=(await readFile(join(root,'src/styles/presets',entry[mode]),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'');
  return Object.fromEntries([...source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(match=>[match[1],match[2].trim()]));
}
const inkTokens=['--text-primary','--text-secondary','--text-caption','--marker','--marker-soft','--ok','--warn','--accent-text','--danger'];
const surfaceTokens=['--surface-page','--surface-alt','--surface-card','--surface-well'];
export async function validateTheme(root:string,input:unknown){
  const config=parseContent(themeSchema,input,'config/theme.json');
  const day=await readPreset(root,config.preset,'day');const night=await readPreset(root,config.preset,'night');
  const keys=Object.keys(day);
  for(const mode of ['common','day','night'] as const)for(const [key,value] of Object.entries(config[mode]))
    if(!keys.includes(key))contentError('config/theme.json',`${mode}.${key}`,value,'unknown theme token; core tokens cannot be overridden');
  for(const key of new Set([...Object.keys(config.day),...Object.keys(config.night)]))
    if(!(key in config.day)||!(key in config.night))contentError('config/theme.json',key,key,'provide matching day and night overrides');
  const merged={day:{...day,...config.common,...config.day},night:{...night,...config.common,...config.night}};
  const identityKeys=keys.filter(key=>/^(--font-|--display-|--ls-|--radius|--border-width|--card-border-style|--e-|--motion-)/.test(key));
  for(const key of identityKeys)if(merged.day[key]!==merged.night[key])contentError('config/theme.json',key,[merged.day[key],merged.night[key]],'day/night identity tokens must match');
  for(const [mode,tokens] of Object.entries(merged)){
    const overshoot=Number(tokens['--motion-overshoot']);const scale=Number(tokens['--motion-scale']);
    if(!Number.isFinite(overshoot)||overshoot<0||overshoot>0.04)contentError('config/theme.json',`${mode}.--motion-overshoot`,tokens['--motion-overshoot'],'must be between 0 and .04');
    if(!Number.isFinite(scale)||scale<.4||scale>1.4)contentError('config/theme.json',`${mode}.--motion-scale`,tokens['--motion-scale'],'must be between .4 and 1.4');
    const pairs=inkTokens.flatMap(ink=>surfaceTokens.map(surface=>[ink,surface])).concat(['--accent','--accent-hover','--accent-press'].map(fill=>['--text-on-accent',fill]));
    for(const [ink,surface] of pairs){
      const ratio=contrastRatio(tokens[ink],tokens[surface]);
      if(ratio<4.5)contentError('config/theme.json',`${mode}.${ink}`,tokens[ink],`${ratio.toFixed(5)}:1 against ${surface}=${tokens[surface]}; requires >=4.5:1`);
    }
  }
  const entry=(await presetManifest(root))[config.preset];
  const families=new Map<string,Set<number>>();
  for(const fontImport of entry.fontImports){
    for(const value of new URL(fontImport).searchParams.getAll('family')){
      const [family,axis]=value.split(':');
      const weights=axis?.startsWith('wght@')?axis.slice(5).split(';').map(Number):[400];families.set(family,new Set(weights));
    }
  }
  for(const font of config.fonts){
    const path=join(root,'public',font.src.slice(1));if(!(await stat(path)).isFile())contentError('config/theme.json','fonts.src',font.src,'font must be an existing file');
    if(font.style==='normal'){const weights=families.get(font.family)??new Set<number>();weights.add(font.weight);families.set(font.family,weights);}
  }
  const firstFamily=(value:string)=>value.split(',')[0].trim().replace(/^["']|["']$/g,'');
  for(const token of ['--font-display','--font-ui','--font-num']){
    const family=firstFamily(merged.day[token]);if(!families.has(family))contentError('config/theme.json',token,family,'font family has no registered normal source');
    const weights=token==='--font-display'?[Number(merged.day['--display-weight'])]:[400];
    for(const weight of weights)if(!families.get(family)?.has(weight))contentError('config/theme.json',token,`${family} ${weight}`,'requested font weight is not registered');
  }
  const localFamilies=new Set(config.fonts.filter(font=>font.style==='normal').map(font=>font.family));
  const allRolesLocal=['--font-display','--font-ui','--font-num'].every(token=>localFamilies.has(firstFamily(merged.day[token])));
  return {config,modes:merged,fontImports:allRolesLocal?[]:entry.fontImports};
}
export async function prepareTheme(root:string):Promise<void>{
  const {config,modes,fontImports}=await validateTheme(root,await readJson(join(root,'config/theme.json')));
  const imports=fontImports.map(url=>`@import url(${JSON.stringify(url)});`).join('\n');
  const fonts=config.fonts.map(font=>`@font-face{font-family:${JSON.stringify(font.family)};src:url(${JSON.stringify(font.src)});font-weight:${font.weight};font-style:${font.style};font-display:swap}`).join('\n');
  const rules=Object.entries(modes).map(([mode,tokens])=>`${mode===config.defaultMode?':root,':''}:root[data-mode="${mode}"]${mode==='night'?',[data-theme-mode="night"],[data-motion-hero]':''}{color-scheme:${mode==='day'?'light':'dark'};${Object.entries(tokens).map(([key,value])=>`${key}:${value};`).join('')}}`).join('\n');
  await writeGenerated(join(root,'.generated/theme.css'),`${imports}\n${fonts}\n${rules}\n`);
}
