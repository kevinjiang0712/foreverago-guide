import type {ContentIndex} from './types';
import {contentError} from './issues';

/** A rendered detail page supplies the card destination in its own language. */
export function linkCharacterDetails(index:ContentIndex){
 const owners=new Map<string,string>();
 for(const page of Object.values(index.pagesByKey)){
  if(page.template!=='character-detail')continue;
  const details=page.records.map(id=>index.records[`${page.locale}:${id}`]).filter(record=>record?.type==='character-detail');
  if(details.length!==1)contentError(page.sourcePath,'records',page.records,'requires exactly one character-detail record');
  const detail=details[0];const key=`${page.locale}:${detail.characterId}`;const character=index.records[key];
  if(!character||character.type!=='character')contentError(detail.sourcePath,'characterId',detail.characterId,'requires an existing character record in the same language');
  const owner=owners.get(key);
  if(owner)contentError(page.sourcePath,'records',detail.id,`character ${detail.characterId} already has detail page ${owner}`);
  if(character.contentId&&character.contentId!==page.id)contentError(character.sourcePath,'contentId',character.contentId,`conflicts with character detail page ${page.id}`);
  owners.set(key,page.id);
  // Do not mutate input records: a later build may omit a draft or removed page.
  index.records[key]={...character,contentId:page.id};
 }
}
