import type {ContentIndex,IndexedPage} from '@/content/types';
export function databaseDetailModel(index:ContentIndex,page:IndexedPage){
 const entry=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='database-entry');
 if(entry?.type!=='database-entry')throw new Error(`${page.id}: missing database-entry`);
 const database=index.records[`${page.locale}:${entry.databaseId}`];
 if(database?.type!=='database-index')throw new Error(`${entry.id}: missing database-index ${entry.databaseId}`);
 const catalogue=Object.values(index.pagesByKey).find(candidate=>candidate.locale===page.locale&&candidate.template==='database-index'&&candidate.records.includes(database.id));
 if(!catalogue)throw new Error(`${page.id}: missing database catalogue`);
 return {entry,database,catalogue};
}
