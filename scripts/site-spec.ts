import {readFile,readdir,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {z} from 'zod';
import {safeId,slug,httpUrl,date,target} from '../src/content/schemas/common';
import {navigationSchema,validateNavigationLabels} from '../src/content/schemas/navigation';
import {parseContent} from '../src/content/issues';

const singleLine=(minimum:number,maximum:number)=>z.string().refine(value=>{
 const length=Array.from(value.trim()).length;
 return value===value.trim()&&!/[\r\n\u2028\u2029]/u.test(value)&&length>=minimum&&length<=maximum;
},`expected ${minimum}–${maximum} characters of single-line text without outer whitespace`);
const prose=z.string().trim().min(1);
const seo=z.strictObject({title:singleLine(50,60),description:singleLine(150,160),image:safeId.nullable(),noindex:z.boolean()});
const heading=z.strictObject({eyebrow:singleLine(3,18),title:singleLine(8,30),description:singleLine(50,70)});
const distinct=(values:string[])=>new Set(values).size===values.length;
const articleIds=(count:number)=>z.array(safeId).length(count).refine(distinct,'IDs must be distinct');

export const siteSpecSchema=z.strictObject({
 siteId:safeId,siteUrl:httpUrl.refine(value=>{const url=new URL(value);return url.protocol==='https:'&&url.pathname==='/'&&!url.search&&!url.hash;},'expected a production HTTPS origin'),
 defaultLocale:z.literal('en'),locales:z.tuple([z.literal('en')]),
 gameName:singleLine(1,40),logoAssetId:safeId,
 officialLinks:z.strictObject({official:httpUrl.nullable(),steam:httpUrl.nullable(),discord:httpUrl.nullable(),youtube:httpUrl.nullable()}),
 navigation:navigationSchema,
 contactEmail:z.email().nullable(),effectiveDate:date,
 footerDescription:singleLine(40,50),defaultDescription:prose,
}).superRefine((site,ctx)=>validateNavigationLabels(site.navigation,site.locales,ctx));
export const categorySpecSchema=z.array(z.strictObject({id:safeId,slug:slug.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),order:z.number().int().nonnegative(),landing:safeId.nullable().optional()})).min(1);
export const categoryCopySchema=z.record(safeId,z.strictObject({title:singleLine(1,40),description:singleLine(30,100),seo}));
export const assetSpecSchema=z.array(z.strictObject({id:safeId,file:z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(?:jpe?g|png|webp|svg)$/i).refine(value=>!value.split('/').includes('..'),'path must stay inside media'),alt:singleLine(1,120).nullable(),position:z.string().regex(/^(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%$/).optional()})).min(1);
export const homeSpecSchema=z.strictObject({
 description:singleLine(50,100),seo,
 hero:z.strictObject({eyebrow:singleLine(3,18),description:singleLine(50,60),assetId:safeId,video:z.strictObject({url:httpUrl,title:singleLine(1,120)}).nullable(),stats:z.array(z.strictObject({label:singleLine(3,26),value:singleLine(1,20).nullable()})).length(4).nullable(),cta:z.tuple([z.strictObject({label:singleLine(8,18),target}),z.strictObject({label:singleLine(8,18),target})])}),
 featured:z.strictObject({eyebrow:singleLine(3,18),title:singleLine(8,30),description:singleLine(50,60),articleIds:articleIds(6)}),
 about:z.strictObject({eyebrow:singleLine(3,18),title:singleLine(8,30),paragraph:singleLine(140,160),facts:z.array(z.strictObject({label:singleLine(1,12),value:singleLine(1,30).nullable()})).length(6)}),
 articleFloors:z.array(heading.extend({id:safeId,articleIds:articleIds(8)})),
 characterSpotlight:heading.omit({description:true}).extend({description:singleLine(50,70),characterIds:articleIds(3)}).nullable(),
 weaponShowcase:heading.omit({description:true}).extend({description:singleLine(50,70),imageIds:articleIds(16),categoryId:safeId,ariaLabel:singleLine(1,120)}).nullable(),
 faq:z.strictObject({eyebrow:singleLine(3,18),title:singleLine(8,30),description:singleLine(50,60),items:z.array(z.strictObject({question:singleLine(25,40),answer:singleLine(80,200)})).length(4)}),
});
export const articleSpecSchema=z.strictObject({
 id:safeId,slug:slug.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),category:safeId,
 h1:singleLine(1,40),description:singleLine(1,100),
 card:z.strictObject({title:singleLine(12,28),description:singleLine(50,60),image:safeId}),
 heroImage:safeId,quickAnswer:z.array(singleLine(1,250)).min(1).max(4).refine(values=>{const total=values.reduce((sum,value)=>sum+Array.from(value).length,0);return total>=120&&total<=250;},'combined Quick Answer must contain 120–250 characters'),
 seo,authorName:singleLine(1,80).nullable(),publishedAt:date.nullable(),updatedAt:date.nullable(),gameVersion:singleLine(1,40).nullable(),
});
export const policySpecSchema=z.strictObject({h1:singleLine(1,40),description:singleLine(1,100),heroImage:safeId.nullable(),seo});
export const characterSpecSchema=z.array(z.strictObject({id:safeId,categoryId:safeId,name:singleLine(1,24),role:singleLine(1,18),summary:singleLine(50,100),avatarId:safeId,articleId:safeId.nullable()}));
export type SiteSpec=z.infer<typeof siteSpecSchema>;
export type CategorySpec=z.infer<typeof categorySpecSchema>[number];
export type AssetSpec=z.infer<typeof assetSpecSchema>[number];
export type HomeSpec=z.infer<typeof homeSpecSchema>;
export type ArticleSpec=z.infer<typeof articleSpecSchema>;
export type PolicySpec=z.infer<typeof policySpecSchema>;
export type CharacterSpec=z.infer<typeof characterSpecSchema>[number];

export async function specJson<T>(root:string,file:string,schema:z.ZodType<T>):Promise<T>{
 const path=join(root,file);let value:unknown;
 try{value=JSON.parse(await readFile(path,'utf8'));}catch(error){throw new Error(`${file} :: ${error instanceof Error?error.message:String(error)}`,{cause:error});}
 return parseContent(schema,value,file);
}
export async function specFiles(root:string,folder:string,extension:string):Promise<string[]>{
 const base=join(root,folder);const status=await lstat(base).catch((error:NodeJS.ErrnoException)=>{if(error.code==='ENOENT')return null;throw error;});
 if(!status)return [];
 if(!status.isDirectory()||status.isSymbolicLink())throw new Error(`${folder}: expected a real directory`);
 const names=await readdir(base,{withFileTypes:true});
 for(const entry of names)if(!entry.isFile()||entry.isSymbolicLink()||!entry.name.endsWith(extension))throw new Error(`${folder}/${entry.name}: expected a regular ${extension} file`);
 return names.map(entry=>`${folder}/${entry.name}`).sort();
}
