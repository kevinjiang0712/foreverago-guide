import {z} from 'zod';
import {safeId,text,httpUrl} from '../common';
import {recordBase} from '../record-base';

export const databaseIndexRecord=z.strictObject({...recordBase,type:z.literal('database-index'),
 entryIds:z.array(safeId).refine(ids=>new Set(ids).size===ids.length,'duplicate entry IDs'),
 fields:z.array(z.strictObject({id:safeId,label:text,kind:z.enum(['text','number']),unit:text.nullable(),compare:z.boolean()})).min(1),
 categories:z.array(z.strictObject({id:safeId,label:text})).min(1),
 evidenceNote:text,
}).superRefine((record,ctx)=>{
 for(const field of ['fields','categories'] as const)if(new Set(record[field].map(row=>row.id)).size!==record[field].length)ctx.addIssue({code:'custom',path:[field],message:'duplicate IDs'});
});
export const databaseEntryRecord=z.strictObject({...recordBase,type:z.literal('database-entry'),
 databaseId:safeId,name:text,summary:text,categoryId:safeId,contentId:safeId.nullable(),
 values:z.record(safeId,z.union([text,z.number().finite(),z.null()])),
 evidenceNote:text,sources:z.array(z.strictObject({label:text,url:httpUrl})),
});
export type DatabaseIndexRecord=z.infer<typeof databaseIndexRecord>;
export type DatabaseEntryRecord=z.infer<typeof databaseEntryRecord>;
