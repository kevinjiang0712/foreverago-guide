import {expect,it} from 'vitest';
import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';

async function cssFiles(directory:string):Promise<string[]>{
 const entries=await readdir(directory,{withFileTypes:true});
 const nested=await Promise.all(entries.map(entry=>{
  const path=join(directory,entry.name);
  if(entry.isDirectory())return cssFiles(path);
  return entry.isFile()&&entry.name.endsWith('.css')?[path]:[];
 }));
 return nested.flat();
}

it('keeps application font sizes on the core typography scale',async()=>{
 const violations:string[]=[];
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(/font-size\s*:\s*([^;}]+)/g)){
   const value=match[1].trim().replace(/!important$/,'');
   if(!/^var\(--(?:fs-|fluid-|hero-)/.test(value))violations.push(`${path}: ${match[1].trim()}`);
  }
 }
 expect(violations).toEqual([]);
});

it('prevents font shorthands from bypassing the core typography scale',async()=>{
 const violations:string[]=[];
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(/(?:^|[;}])\s*font\s*:\s*([^;}]+)/g))if(match[1].trim()!=='inherit')violations.push(`${path}: font:${match[1].trim()}`);
 }
 expect(violations).toEqual([]);
});

it('keeps application weights and line heights on the core typography scale',async()=>{
 const violations:string[]=[];
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(/font-weight\s*:\s*([^;}]+)/g)){
   if(!/^var\(--(?:fw-|display-weight)/.test(match[1].trim()))violations.push(`${path}: ${match[0].trim()}`);
  }
  for(const match of css.matchAll(/line-height\s*:\s*([^;}]+)/g)){
   if(!/^var\(--lh-/.test(match[1].trim().replace(/!important$/,'')))violations.push(`${path}: ${match[0].trim()}`);
  }
 }
 expect(violations).toEqual([]);
});

it('renders the typography reference cards from the same core tokens',async()=>{
 const body=await readFile('tests/fixtures/design-system/guidelines/type-body.card.html','utf8');
 const latin=await readFile('tests/fixtures/design-system/guidelines/type-latin.card.html','utf8');
 expect(body).toContain('font-size:var(--fs-h3)');
 expect(body).toContain('font-size:var(--fs-body)');
 expect(body).toContain('font-size:var(--fs-caption)');
 expect(latin).toContain('font-size:var(--fs-label)');
 expect(latin).toContain('font-size:var(--fs-button)');
 expect(latin).toContain('font-size:var(--fs-num)');
});

it('uses the canonical responsive H1 size and line height on inner pages',async()=>{
 const innerHero=await readFile('src/components/content/inner-hero.css','utf8');
 expect(innerHero).toContain('font-size:var(--fluid-h1)');
 expect(innerHero).toContain('line-height:var(--lh-h1)');
 expect(innerHero).not.toContain('--inner-hero-title-size');
});

it('keeps semantic headings on heading-size tokens',async()=>{
 const violations:string[]=[];
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
   const selector=match[1].trim();
   const declarations=match[2];
   const targetsHeading=/(?:^|[\s,.>+~:#])h[23](?:$|[\s,.>+~:#[])/.test(selector);
   const usesBodyOrLabelSize=/font-size\s*:\s*var\(--fs-(?:label|meta|body(?:-lg)?)\)/.test(declarations);
   if(targetsHeading&&usesBodyOrLabelSize)violations.push(`${path}: ${selector}`);
  }
 }
 expect(violations).toEqual([]);
});

it('uses accessible labels instead of headings for compact controls',async()=>{
 const map=await readFile('src/components/interactive/MapViewport.tsx','utf8');
 const upgrade=await readFile('src/components/interactive/UpgradeExplorer.tsx','utf8');
 const listPage=await readFile('src/templates/list-page/ListPage.tsx','utf8');
 const listBrowser=await readFile('src/templates/list-page/ListBrowser.tsx','utf8');
 expect(map).toContain('className="map-categories-title"');
 expect(map).not.toContain('<h2>{labels.pinCategories}</h2>');
 expect(upgrade).toContain('className="upgrade-column-title"');
 expect(upgrade).not.toContain('<h3>{labels.tier}');
 expect(listPage).toContain('className="list-guide-title"');
 expect(listBrowser).toContain('<h2 className="visually-hidden"');
 expect(listBrowser).toContain('<h3>{entry.title}</h3>');
 expect(listBrowser).not.toContain('<h2>{model.notice.label}</h2>');
});
