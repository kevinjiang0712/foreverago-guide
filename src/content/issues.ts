import type { z } from 'zod';
export type ContentIssue={file:string;field:string;value:unknown;message:string};
export function formatContentIssue(issue:ContentIssue):string {
  return `${issue.file} :: ${issue.field} = ${JSON.stringify(issue.value)} :: ${issue.message}`;
}
export function contentError(file:string,field:string,value:unknown,message:string):never {
  throw new Error(formatContentIssue({file,field,value,message}));
}
export function parseContent<T>(schema:z.ZodType<T>,value:unknown,file:string):T {
  const parsed=schema.safeParse(value);
  if(parsed.success)return parsed.data;
  const messages=parsed.error.issues.flatMap(issue=>{
    let rejected:unknown=value;
    for(const key of issue.path) rejected=typeof rejected==='object'&&rejected!==null ? (rejected as Record<PropertyKey,unknown>)[key] : undefined;
    if(issue.code==='unrecognized_keys')return issue.keys.map(key=>formatContentIssue({file,field:[...issue.path,key].join('.'),value:(rejected as Record<string,unknown>)[key],message:'unrecognized key'}));
    return [formatContentIssue({file,field:issue.path.join('.')||'$root',value:rejected,message:issue.message})];
  });
  throw new Error(messages.join('\n'));
}
