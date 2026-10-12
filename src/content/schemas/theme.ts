import { z } from 'zod';
import { safeId, text } from './common';
function balancedCss(value:string):boolean {
  let quote='';const brackets:string[]=[];
  for(const character of value){
    if(character.charCodeAt(0)<32||character.charCodeAt(0)===127)return false;
    if(quote){if(character===quote)quote='';continue;}
    if(character==='"'||character==="'"){quote=character;continue;}
    if(character==='('||character==='[')brackets.push(character);
    if(character===')'&&brackets.pop()!=='(')return false;
    if(character===']'&&brackets.pop()!=='[')return false;
  }
  return !quote&&brackets.length===0;
}
const overrides=z.record(z.string().regex(/^--[a-z][a-z0-9-]+$/),z.string().min(1).refine(value=>!/[{};<>@\\]|\/\*/.test(value),'unsafe CSS value').refine(balancedCss,'unbalanced CSS value'));
export const themeSchema=z.strictObject({
  preset:safeId,defaultMode:z.enum(['day','night']),common:overrides,day:overrides,night:overrides,
  fonts:z.array(z.strictObject({family:text,src:z.string().regex(/^\/media\/(?!.*(?:\.\.|[?#])).+\.(woff2?|ttf|otf)$/),weight:z.number().int().min(100).max(900),style:z.enum(['normal','italic']).default('normal')})),
});
export type ThemeConfig=z.infer<typeof themeSchema>;
