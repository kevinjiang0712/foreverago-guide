'use client';
import Link from 'next/link';
import {useLocale} from '@/components/chrome/LocaleContext';
export default function NotFound(){
  const {dictionary,homeHref}=useLocale();
  return <main id="main" className="container not-found"><h1>{dictionary.ui.pageNotFound}</h1><Link href={homeHref}>{dictionary.ui.returnHome}</Link></main>;
}
