import type {MetadataRoute} from 'next';
import {getSiteIndex} from '@/content/site-index';
import {absoluteUrl} from '@/seo/alternates';
export const dynamic='force-static';
export default function robots():MetadataRoute.Robots{
 const index=getSiteIndex();
 return index.site.mode==='demo'||index.preview||index.site.seo.noindex?{rules:{userAgent:'*',disallow:'/'}}:{rules:{userAgent:'*',allow:'/'},sitemap:absoluteUrl(index,'/sitemap.xml')};
}
