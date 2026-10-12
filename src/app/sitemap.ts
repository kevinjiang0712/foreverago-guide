import {getSiteIndex} from '@/content/site-index';
import {createSitemap} from '@/seo/sitemap';
export const dynamic='force-static';
export default function sitemap(){return createSitemap(getSiteIndex());}
