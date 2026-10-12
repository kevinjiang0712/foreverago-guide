import type {ContentIndex,IndexedPage} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';
export function characterDatabaseModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='character-database');
 if(!record||record.type!=='character-database')throw new Error(`${page.sourcePath}: missing character-database record`);
 const label=index.dictionaries[page.locale].ui.characterArtwork;
 const placeholder:Asset={id:'character-placeholder',src:null,width:1200,height:1600,purpose:label,alt:{[page.locale]:label},position:'50% 50%',demo:false};
 const characters=record.characterIds.map(id=>{const character=index.records[`${page.locale}:${id}`];if(character.type!=='character')throw new Error(`${record.id}: missing character ${id}`);return {...character,asset:character.assetId?index.assets[character.assetId]:placeholder,href:character.contentId?index.translationGroups[character.contentId]?.[page.locale]:undefined};});
 const lead=characters.find(character=>character.id===record.leadCharacterId);if(!lead)throw new Error(`${record.id}: missing lead`);
 return {record,characters,lead,placeholder};
}
