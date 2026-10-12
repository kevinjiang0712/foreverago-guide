export type IndexingInput={mode:'demo'|'production';preview:boolean;status:'draft'|'published'|'archived';demo:boolean;noindex?:boolean;empty?:boolean};
export function isIndexable(input:IndexingInput):boolean{
  return input.mode==='production'&&!input.preview&&input.status==='published'&&!input.demo&&!input.noindex&&!input.empty;
}
export function isProductionOrigin(origin:string):boolean {
  const url=new URL(origin);const hostname=url.hostname.toLowerCase().replace(/\.$/,'');
  return url.protocol==='https:'&&!/^localhost$|^127\.|^\[|^0\./.test(hostname)&&!/(^|\.)(example|test|invalid|localhost)$/.test(hostname)&&!/(^|\.)example\.(com|net|org)$/.test(hostname)&&hostname.includes('.');
}
