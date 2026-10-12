import type {ReactNode} from 'react';
import {getSiteIndex} from '@/content/site-index';
import {getLocaleFromSegments,resolveRoute} from '@/content/resolve-route';
import {SiteShell} from '@/components/chrome/SiteShell';
import {SiteAnalytics} from '@/components/chrome/SiteAnalytics';
import '@/styles/globals.css';
import '../../../.generated/theme.css';
export default async function RootLayout({children,params}:{children:ReactNode;params:Promise<{segments?:string[]}>}){
  const {segments=[]}=await params;const index=getSiteIndex();const locale=getLocaleFromSegments(segments,index.site);const path=segments.length?`/${segments.join('/')}`:'/';
  return <html data-scroll-behavior="smooth" lang={locale} data-mode="night"><head><link rel="icon" href="/favicon.ico"/></head><body><SiteShell index={index} route={resolveRoute(path,index)} locale={locale} pathname={path} defaultMode="night">{children}</SiteShell><SiteAnalytics/></body></html>;
}
