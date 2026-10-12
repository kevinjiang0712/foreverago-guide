import type {ContentIndex,IndexedPage,Heading} from '@/content/types';
import type {Asset} from '@/content/schemas/asset';

export function characterDetailModel(index:ContentIndex,page:IndexedPage){
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record?.type==='character-detail');
 if(!record||record.type!=='character-detail')throw new Error(`${page.sourcePath}: missing character-detail record`);
 const character=index.records[`${page.locale}:${record.characterId}`];
 if(!character||character.type!=='character')throw new Error(`${record.sourcePath}: missing character ${record.characterId}`);
 const ui=index.dictionaries[page.locale].ui;
 const portrait:Asset=character.assetId?index.assets[character.assetId]:{id:'character-portrait-placeholder',src:null,width:1200,height:1600,purpose:ui.characterArtwork,alt:{[page.locale]:ui.characterArtwork},position:'50% 50%',demo:false};
 const skills=record.skills.map(skill=>({...skill,icon:skill.iconAssetId?index.assets[skill.iconAssetId]:{id:`skill-${skill.id}`,src:null,width:64,height:64,purpose:record.labels.skillArtwork,alt:{[page.locale]:record.labels.skillArtwork},position:'50% 50%',demo:false} satisfies Asset}));
 const headings:Heading[]=(['attributes','skills','acquisition'] as const).map(id=>({id,text:record.sections[id].title,depth:2}));
 return {record,character,portrait,skills,headings};
}
