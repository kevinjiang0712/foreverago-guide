import type {Metadata} from 'next';
import Link from 'next/link';
import {getSiteIndex} from '@/content/site-index';
import {SiteShell} from '@/components/chrome/SiteShell';
import {SiteAnalytics} from '@/components/chrome/SiteAnalytics';
import '@/styles/globals.css';
import '../../.generated/theme.css';

export const metadata:Metadata={
  title:'Page Not Found | Forever Ago Wiki',
  description:'Find Forever Ago walkthroughs, achievements and story guides from the homepage.',
  robots:{index:false,follow:true},
};

export default function GlobalNotFound(){
  const index=getSiteIndex();
  return <html lang="en" data-mode="night"><head><link rel="icon" href="/favicon.ico"/></head><body><SiteShell index={index} locale="en" pathname="/404" defaultMode="night"><main id="main" className="container not-found"><h1>Page not found</h1><Link href="/">Return home</Link></main></SiteShell><SiteAnalytics/></body></html>;
}
