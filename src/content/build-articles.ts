import type {ContentIndex} from './types';
export function buildArticle(index:ContentIndex,locale:string,libraryId:string,buildId:string){
 const matches=Object.values(index.pagesByKey).filter(page=>page.locale===locale&&page.status==='published'&&page.template==='wiki-page'&&page.articleRecord===buildId&&page.records.includes(libraryId));
 if(matches.length!==1)throw new Error(`${locale}:${libraryId} build ${buildId}: requires exactly one published wiki-page referencing this build and library; found ${matches.length}`);
 return matches[0];
}
