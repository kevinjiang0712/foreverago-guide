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

it('keeps application spacing on the core spacing scale',async()=>{
 const violations:string[]=[];
 const declaration=/(?:margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|(?:row-|column-)?gap)\s*:\s*([^;}]+)/g;
 const rawSpacingValue=/(?<![\d.-])(?:[4-9]|\d{2,})px\b/;
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(declaration)){
   if(rawSpacingValue.test(match[1]))violations.push(`${path}: ${match[0].trim()}`);
  }
 }
 expect(violations).toEqual([]);
});

it('keeps application radii on the core radius scale',async()=>{
 const violations:string[]=[];
 const declaration=/border-radius\s*:\s*([^;}]+)/g;
 const radiusValue=/(?:var\(--radius(?:-lg|-chip)?\)|50%|0)/;
 const radiusList=new RegExp(`^${radiusValue.source}(?:\\s+${radiusValue.source}){0,3}$`);
 for(const path of await cssFiles('src')){
  const css=await readFile(path,'utf8');
  for(const match of css.matchAll(declaration)){
   const value=match[1].trim();
   if(!radiusList.test(value))violations.push(`${path}: ${match[0].trim()}`);
  }
 }
 expect(violations).toEqual([]);
});
