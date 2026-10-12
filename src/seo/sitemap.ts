import type {MetadataRoute} from 'next';
import type {ContentIndex} from '@/content/types';
import {absoluteUrl,languageAlternates} from './alternates';
export function createSitemap(index:ContentIndex):MetadataRoute.Sitemap{
 return Object.values(index.routes).filter(route=>route.indexable).map(route=>({url:absoluteUrl(index,route.path),...(route.updatedAt??route.publishedAt?{lastModified:route.updatedAt??route.publishedAt}:{}),alternates:{languages:languageAlternates(index,route)}}));
}
