import {z} from 'zod';

export const gameSchema=z.strictObject({
 name:z.string().refine(value=>!/[\r\n\u2028\u2029]/u.test(value),'game name must not contain line breaks').trim().superRefine((value,ctx)=>{
  const length=Array.from(value).length;
  if(length<1||length>40)ctx.addIssue({code:'custom',message:`game name must contain 1–40 characters including spaces and punctuation; received ${length}`});
 }),
});
