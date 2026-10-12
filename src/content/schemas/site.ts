import { z } from 'zod';
import { safeId, locale, text, httpUrl, target, date } from './common';
import {navigationSchema,validateNavigationLabels} from './navigation';
export const siteSchema = z.strictObject({
  siteId: safeId, siteUrl: httpUrl.refine(value => {const url=new URL(value);return url.pathname==='/' && !url.search && !url.hash;},'expected an origin without path/query/hash'),
  defaultLocale: locale, locales: z.array(locale).min(1), mode: z.enum(['demo','production']),
  brand: z.strictObject({ logo: safeId.nullable() }),
  officialLinks: z.record(safeId, httpUrl.nullable()),
  seo: z.strictObject({ titleTemplate: text.refine(value=>value.includes('{title}') && value.includes('{siteName}'),'requires {title} and {siteName}'), image: safeId.nullable(), noindex: z.boolean() }),
  navigation: navigationSchema,
  homepage:z.strictObject({featuredLimit:z.number().int().min(1).max(12),categoryFloorMinItems:z.number().int().min(1).max(12),categoryFloorLimit:z.number().int().min(1).max(12),layoutOverrides:z.record(safeId,z.enum(['editorial','media','data']))}).default({featuredLimit:6,categoryFloorMinItems:4,categoryFloorLimit:8,layoutOverrides:{}}),
  policies:z.strictObject({contactEmail:z.email().nullable(),effectiveDate:date}).nullable().default(null),
  footer: z.strictObject({ columns: z.array(z.strictObject({id:safeId,links:z.array(target)})) }),
  redirects: z.array(z.strictObject({ from: z.string().regex(/^\/(?!\/)[^?#]*$/), to: safeId, locale, permanent: z.boolean().default(true) })),
}).superRefine((site,ctx) => {
  validateNavigationLabels(site.navigation,site.locales,ctx);
  if (!site.locales.includes(site.defaultLocale)) ctx.addIssue({code:'custom',path:['defaultLocale'],message:'must be in locales'});
  if (new Set(site.locales).size!==site.locales.length) ctx.addIssue({code:'custom',path:['locales'],message:'duplicate locales'});
  if(site.homepage.categoryFloorMinItems>site.homepage.categoryFloorLimit)ctx.addIssue({code:'custom',path:['homepage','categoryFloorMinItems'],message:'cannot exceed categoryFloorLimit'});
});
export type SiteConfig = z.infer<typeof siteSchema>;
