import type {Metadata} from 'next';
import type {ContentIndex,ContentRoute} from '@/content/types';
import {absoluteUrl,languageAlternates} from './alternates';
export function routePublication(index:ContentIndex,route:ContentRoute){return route.kind==='home'?index.homes[route.locale]:route.kind==='page'?index.pagesByKey[route.bodyKey]:index.categories[`${route.locale}:${route.categoryId}`];}
export function shareImage(index:ContentIndex,route:ContentRoute){
 const publication=routePublication(index,route);
 if(publication?.seo?.image===null)return undefined;
 const hero=route.kind==='home'?index.homes[route.locale].hero.asset:route.kind==='page'?index.pagesByKey[route.bodyKey].assets.hero:undefined;
 for(const id of [publication?.seo?.image,hero,index.site.seo.image]){
  const asset=id?index.assets[id]:undefined;
  if(asset?.src)return {url:absoluteUrl(index,asset.src),width:asset.width,height:asset.height,alt:asset.alt[route.locale]};
 }
 return undefined;
}
export function createMetadata(index:ContentIndex,route:ContentRoute):Metadata{
 const dictionary=index.dictionaries[route.locale];const publication=routePublication(index,route);
 const title=publication?.seo?.final?publication.seo.title!:index.site.seo.titleTemplate.replace('{title}',publication?.seo?.title??route.title).replace('{siteName}',dictionary.siteName);
 const description=publication?.seo?.description??route.description;const url=absoluteUrl(index,route.path);const image=shareImage(index,route);
 return {title,description,alternates:{canonical:url,languages:languageAlternates(index,route)},robots:{index:route.indexable,follow:true},
  openGraph:{type:route.kind==='page'?'article':'website',title,description,url,siteName:dictionary.siteName,locale:route.locale,...(image?{images:[image]}:{})},
  twitter:{card:image?'summary_large_image':'summary',title,description,...(image?{images:[image.url]}:{})},
 };
}
