import type {ContentIndex,IndexedPage} from '@/content/types';
export function buildLibraryModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library');if(!record||record.type!=='build-library')throw new Error(`${page.sourcePath}: missing build-library record`);
 const builds=record.buildIds.map(id=>{const build=index.records[`${page.locale}:${id}`];if(!build||build.type!=='build')throw new Error(`${record.id}: missing build ${id}`);return build;});
 const headings=[['find-build','find'],['setups','setups'],['presets','presets'],['rescue','rescue'],['faq','faq']].map(([id,key])=>({id,text:record.sections[key as keyof typeof record.sections].eyebrow,depth:2 as const}));
 const rescueRows=record.rescueRows.map(row=>{const build=builds.find(build=>build.id===row.buildId);if(!build)throw new Error(`${record.id}: rescue row ${row.id} references an unlisted build ${row.buildId}`);return {...row,buildName:build.name};});
 return {record,builds,headings,rescueRows};
}
