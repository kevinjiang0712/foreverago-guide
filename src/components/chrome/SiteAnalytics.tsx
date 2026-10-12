import Script from 'next/script';

const trackingCode=`
if (['www.foreverago-guide.wiki', 'foreverago-guide.wiki'].includes(window.location.hostname)) {
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-1L7F54XGRR');
  var googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = 'https://www.googletagmanager.com/gtag/js?id=G-1L7F54XGRR';
  document.head.appendChild(googleTag);
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window, document, 'clarity', 'script', 'ywlgmczujj');
}`;

export function SiteAnalytics(){
  if(process.env.NODE_ENV!=='production')return null;
  return <Script id="forever-ago-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{__html:trackingCode}}/>;
}
