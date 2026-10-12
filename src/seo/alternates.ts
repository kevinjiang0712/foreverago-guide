import type {ContentIndex,ContentRoute} from '@/content/types';
export function absoluteUrl(index:ContentIndex,path:string):string{return new URL(path,index.site.siteUrl).href;}
export function languageAlternates(index:ContentIndex,route:ContentRoute):Record<string,string>{
 if(!route.indexable)return {};
 const translations=index.translationGroups[route.contentId]??{};
 const languages:Record<string,string>={};
 for(const [locale,path] of Object.entries(translations))if(index.routes[path]?.indexable)languages[locale]=absoluteUrl(index,path);
 if(languages[index.site.defaultLocale])languages['x-default']=languages[index.site.defaultLocale];
 return languages;
}
