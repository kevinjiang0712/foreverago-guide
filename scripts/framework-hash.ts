import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {listSiteFiles} from './site-files';
export const frameworkPaths=['src','scripts','public/ui','package.json','package-lock.json','next.config.mjs','tsconfig.json','eslint.config.mjs','vitest.config.ts','playwright.config.ts','.nvmrc','AGENTS.md'] as const;
export function hashFiles(files:{path:string;bytes:Uint8Array}[]):string{
 const hash=createHash('sha256');
 for(const file of [...files].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)){hash.update(file.path);hash.update('\0');hash.update(String(file.bytes.byteLength));hash.update('\0');hash.update(file.bytes);}
 return hash.digest('hex');
}
export async function frameworkHash(root:string){
 const files=[];
 for(const path of frameworkPaths)for(const file of await listSiteFiles(root,path))files.push({path:file.path,bytes:await readFile(file.source)});
 return {hash:hashFiles(files),files:files.map(file=>({path:file.path,sha256:createHash('sha256').update(file.bytes).digest('hex'),bytes:file.bytes.byteLength})).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0)};
}
