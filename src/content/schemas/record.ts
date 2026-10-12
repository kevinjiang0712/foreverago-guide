import { z } from 'zod';
import {safeId,text} from './common';
import {characterDetailRecord} from './templates/character-detail';
import {recordBase} from './record-base';
import {bossIndexRecord} from './templates/boss-index';
import {characterRecord,characterDatabaseRecord} from './templates/character-database';
import {systemsReferenceRecord} from './templates/systems-reference';
import {weaponRecord,itemRecord,weaponDetailRecord} from './templates/weapon-detail';
import {buildRecord,buildLibraryRecord} from './templates/build-library';
import {weaponExplorerRecord} from './templates/weapon-explorer';
import {modEntry,modIndexRecord} from './templates/mod-index';
import {interactiveMapRecord} from './templates/interactive-map';
import {modDetailRecord} from './templates/mod-detail';
import {databaseIndexRecord,databaseEntryRecord} from './templates/database';
export const tableRecord=z.strictObject({...recordBase,type:z.literal('table'),title:text,columns:z.array(z.strictObject({id:safeId,label:text})).min(1),rows:z.array(z.record(safeId,z.union([text,z.number().finite(),z.null()]))) });
export const recordSchema=z.discriminatedUnion('type',[tableRecord,characterDetailRecord,bossIndexRecord,characterRecord,characterDatabaseRecord,systemsReferenceRecord,weaponRecord,itemRecord,weaponDetailRecord,buildRecord,buildLibraryRecord,weaponExplorerRecord,modEntry,modIndexRecord,modDetailRecord,interactiveMapRecord,databaseIndexRecord,databaseEntryRecord]).superRefine((record,ctx)=>{
 if(record.type==='table'){
  const keys=record.columns.map(column=>column.id);
  if(new Set(keys).size!==keys.length) ctx.addIssue({code:'custom',path:['columns'],message:'duplicate column IDs'});
  record.rows.forEach((row,index)=>{
    if(Object.keys(row).some(key=>!keys.includes(key)) || keys.some(key=>!(key in row))) ctx.addIssue({code:'custom',path:['rows',index],message:'row must have exactly the registered columns; unknown values use null'});
  });
 }
});
export type ContentRecord=z.infer<typeof recordSchema>;
