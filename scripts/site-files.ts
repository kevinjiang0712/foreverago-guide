import {lstat,readdir} from 'node:fs/promises';
import {join,relative,isAbsolute,sep} from 'node:path';
export const requiredSitePaths=['src','config','content','public','scripts','tests','examples','package.json','package-lock.json','tsconfig.json','next.config.mjs','eslint.config.mjs','vitest.config.ts','playwright.config.ts','.gitignore','.nvmrc'] as const;
export const optionalSitePaths=['docs/usage','docs/prompts','AGENTS.md','README.md','.env.example'] as const;
const excludedNames=new Set(['.git','node_modules','.generated','.next','.artifacts','test-results','playwright-report','.DS_Store']);
export type SiteFile={source:string;path:string};
export function isPrivateOrGenerated(name:string){return excludedNames.has(name)||(name.startsWith('.env')&&name!=='.env.example');}
export async function listSiteFiles(root:string,path:string):Promise<SiteFile[]>{
 const absolute=join(root,path);
 let ancestor=root;
 for(const part of path.split(sep)){ancestor=join(ancestor,part);if((await lstat(ancestor)).isSymbolicLink())throw new Error(`Cannot copy symbolic link: ${ancestor}`);}
 const status=await lstat(absolute);
 if(status.isSymbolicLink())throw new Error(`Cannot copy symbolic link: ${absolute}; use a regular file inside the allowed directory`);
 if(status.isFile())return [{source:absolute,path}];
 if(!status.isDirectory())throw new Error(`Unsupported file type: ${absolute}`);
 const files:SiteFile[]=[];
 for(const name of (await readdir(absolute)).sort())if(!isPrivateOrGenerated(name))files.push(...await listSiteFiles(root,join(path,name)));
 return files;
}
export function isWithin(parent:string,candidate:string){const path=relative(parent,candidate);return path===''||(path!=='..'&&!path.startsWith(`..${sep}`)&&!isAbsolute(path));}
export function isMissing(error:unknown):error is NodeJS.ErrnoException{return error instanceof Error&&'code' in error&&error.code==='ENOENT';}
