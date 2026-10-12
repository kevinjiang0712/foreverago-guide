import { mkdir,readFile,writeFile,rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
export async function writeGenerated(file:string,source:string):Promise<boolean>{
  const current=await readFile(file,'utf8').catch((error:NodeJS.ErrnoException)=>{if(error.code==='ENOENT')return null;throw error;});
  if(current===source)return false;
  await mkdir(dirname(file),{recursive:true});const temporary=`${file}.${randomUUID()}.tmp`;
  await writeFile(temporary,source);await rename(temporary,file);return true;
}
