import type {ReactNode} from 'react';
import {getSiteIndex} from '@/content/site-index';
import {getLocaleFromSegments,resolveRoute} from '@/content/resolve-route';
import {SiteShell} from '@/components/chrome/SiteShell';
import {SiteAnalytics} from '@/components/chrome/SiteAnalytics';
import '@/styles/globals.css';
import '../../../.generated/theme.css';
export default async function RootLayout({children,params}:{children:ReactNode;params:Promise<{segments?:string[]}>}){
  const {segments=[]}=await params;const index=getSiteIndex();const locale=getLocaleFromSegments(segments,index.site);const path=segments.length?`/${segments.join('/')}`:'/';
  const route=resolveRoute(path,index);
  const article=route?.kind==='page'&&route.categoryId!=='_pages';
  const preloadFonts=['figtree-400','figtree-600','outfit-500',...(article?['figtree-700','outfit-600']:[])];
  return <html data-scroll-behavior="smooth" lang={locale} data-mode="night"><head><link rel="icon" href="/favicon.ico"/>{index.site.siteId==='forever-ago'&&preloadFonts.map(font=><link key={font} rel="preload" href={`/media/fonts/${font}.woff2`} as="font" type="font/woff2" crossOrigin="anonymous"/>)}</head><body><SiteShell index={index} route={route} locale={locale} pathname={path} defaultMode="night">{children}</SiteShell><SiteAnalytics/></body></html>;
}
