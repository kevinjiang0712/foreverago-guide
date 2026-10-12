import type {SiteConfig} from './schemas/site';
import type {ContentIndex} from './types';
export function getLocaleFromSegments(segments:string[],site:SiteConfig):string {
  return site.locales.includes(segments[0])?segments[0]:site.defaultLocale;
}
export function resolveRoute(path:string,index:ContentIndex){return index.routes[path];}
