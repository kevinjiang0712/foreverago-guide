import {z} from 'zod';
import {locale,target} from './common';

const navigationLink=z.strictObject({label:z.string().regex(/^[^\r\n]*$/,'navigation labels cannot contain line breaks').trim().min(1),target});
export const navigationSchema=z.record(locale,z.array(navigationLink.extend({children:z.array(navigationLink).max(10,'expected at most 10 submenu entries')})).min(4,'expected at least 4 primary entries').max(8,'expected at most 8 primary entries'));

export function validateNavigationLabels(navigation:z.infer<typeof navigationSchema>,locales:string[],ctx:z.RefinementCtx){
 const validateGroup=(entries:z.infer<typeof navigationLink>[],language:string,path:(string|number)[],maximum:number)=>{
  const seen=new Set<string>();
  entries.forEach((entry,i)=>{
   const key=JSON.stringify(entry.target);
   if(seen.has(key))ctx.addIssue({code:'custom',path:[...path,i,'target'],message:'duplicate navigation target within this menu'});
   seen.add(key);
   const length=Array.from(entry.label).length;
   if(/^en(?:-|$)/.test(language)&&(length<2||length>maximum))ctx.addIssue({code:'custom',path:[...path,i,'label'],message:`expected 2–${maximum} English characters including spaces and punctuation; received ${length}`});
  });
 };
 for(const language of locales){
  const entries=navigation[language];
  if(!entries){ctx.addIssue({code:'custom',path:['navigation',language],message:'missing navigation for enabled locale'});continue;}
  validateGroup(entries,language,['navigation',language],14);
  entries.forEach((entry,i)=>validateGroup(entry.children,language,['navigation',language,i,'children'],28));
 }
 for(const language of Object.keys(navigation))if(!locales.includes(language))ctx.addIssue({code:'custom',path:['navigation',language],message:'navigation locale is not enabled'});
}
