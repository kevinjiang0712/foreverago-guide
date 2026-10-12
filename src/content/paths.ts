export function localePath(defaultLocale:string,locale:string,segments:string[]):string {
  const parts=locale===defaultLocale?segments:[locale,...segments];
  return parts.length?`/${parts.join('/')}`:'/';
}
export const reservedRoots=new Set(['api','_next','_not-found','robots.txt','sitemap.xml','favicon.ico','media','ui']);
