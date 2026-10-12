import type {Metadata} from 'next';
import {createMetadata} from '@/seo/metadata';
import {createStructuredData,serializeJsonLd} from '@/seo/structured-data';
import {getLocaleFromSegments} from '@/content/resolve-route';
import {notFound} from 'next/navigation';
import {getSiteIndex} from '@/content/site-index';
import {resolveRoute} from '@/content/resolve-route';
import {renderPage} from '@/content/render-page';
export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(getSiteIndex().routes).map(path=>({segments:path==='/'?[]:path.slice(1).split('/')}));}
export async function generateMetadata({params}:{params:Promise<{segments?:string[]}>}):Promise<Metadata>{
 const {segments=[]}=await params;const index=getSiteIndex();const route=resolveRoute(segments.length?`/${segments.join('/')}`:'/',index);
 return route?createMetadata(index,route):{title:index.dictionaries[getLocaleFromSegments(segments,index.site)].ui.pageNotFound,robots:{index:false,follow:true}};
}
export default async function Page({params}:{params:Promise<{segments?:string[]}>}){
  const {segments=[]}=await params;const index=getSiteIndex();const route=resolveRoute(segments.length?`/${segments.join('/')}`:'/',index);
  if(!route)notFound();return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:serializeJsonLd({'@context':'https://schema.org','@graph':createStructuredData(index,route)})}}/>{renderPage(index,route)}</>;
}
