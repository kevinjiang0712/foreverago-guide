import type {ContentIndex,IndexedPage} from './types';
export type ArticleSection = {id:string;title?:string;description?:string};

// Rendering, the directory and validated anchor links use the same visible sections.
export function articleOutline(index:ContentIndex,page:Pick<IndexedPage,'template'|'records'|'locale'|'articleRecord'>):ArticleSection[] {
 const ui=index.dictionaries[page.locale].ui;
 const sections:ArticleSection[]=[];
 const add=(id:string,copy:{title:string;description?:string},visible:unknown=true)=>{if(visible)sections.push({id,title:copy.title,description:copy.description});};
 const record=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record?.type===page.template);
 if(page.template==='wiki-page'){
  sections.push({id:'article-body'});
  const reference=page.articleRecord?index.records[`${page.locale}:${page.articleRecord}`]:undefined;
  if(reference?.type==='boss-index'&&reference.detail){add('boss-facts',{title:reference.detail.eyebrow});add('attacks',{title:reference.detail.attacksTitle},reference.detail.attacks.length);}
  if(reference?.type==='character-database'){add('lead',{title:reference.leadLabel});add('relations',reference.connections,reference.relations.length||reference.relationNote);}
  if(reference?.type==='build-library'){
   add('evidence',reference.sections.evidence,reference.evidenceLegend.length);
   add('presets',reference.sections.presets,reference.presets.length);
   add('rescue',reference.sections.rescue,reference.rescueRows.length);
   add('faq',reference.sections.faq,reference.faq.length);
  }
  if(reference?.type==='build'){
   sections.length=0;
   add('variants',{title:ui.variants},reference.variants.length);
   add('equipment',{title:ui.equipment});
   add('fit',{title:ui.bestFor});add('how-it-works',{title:ui.howItWorks});
   add('priority',{title:ui.artifactPriority},reference.artifactPriority.length||reference.variants.some(variant=>variant.artifactPriority.length));
   add('build-order',{title:ui.buildOrder},reference.buildOrder.length||reference.variants.some(variant=>variant.buildOrder.length));
   add('how-to-play',{title:ui.howToPlay});add('risks',{title:ui.buildRisks});
   add('evidence',{title:ui.evidenceLimit});
   sections.push({id:'article-body'});
   const library=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record?.type==='build-library');
   if(library?.type==='build-library'){add('presets',library.sections.presets,library.presets.some(preset=>preset.buildId===reference.id));add('rescue',library.sections.rescue,library.rescueRows.some(row=>row.buildId===reference.id));}
  }
  if(reference?.type==='mod-index'){
   add('install',reference.sections.install,reference.installSteps.length);
   add('compat',reference.sections.compat,reference.compatibility.length);
   add('safety',reference.sections.safety,reference.safetyNotes.length||reference.safetyCaption||reference.safetyAssetId);
   add('faq',reference.sections.faq,reference.faq.length);
   add('legal',reference.sections.legal,reference.legalNotes.length);
  }
 }
 else if(record?.type==='character-detail'){
  const character=index.records[`${page.locale}:${record.characterId}`];
  if(character?.type!=='character')throw new Error(`${record.id}: missing character ${record.characterId}`);
  sections.push({id:'article-body'});
  add('attributes',record.sections.attributes,character.attributes.length||record.attributeNote);
  add('skills',record.sections.skills,record.skills.length);
  add('acquisition',record.sections.acquisition,record.acquisition.steps.length||record.acquisition.prerequisites||record.acquisition.location);
 }else if(record?.type==='weapon-detail'){
  add('overview',record.overview);
  add('unlock',record.unlock,record.unlockSteps.length);
  add('tabs',record.detail,record.moveset.length||record.upgradeNodes.length||record.patchHistory.length||record.buildRefs.length);
  add('matchups',record.matchupSection,record.matchups.length);
  add('pairs',record.pairingSection,record.pairings.length);
  add('faq',record.faqSection,record.faq.length);
 }else if(record?.type==='systems-reference'){
  add('mechanisms',record.mechanics);
  add('combos',record.combos,record.comboRoutes.length);
  add('items',record.items,record.itemIds.length||record.stats.length);
 }else if(record?.type==='mod-detail'){
  add('overview',record.sections.overview);
  add('requirements',record.sections.requirements,record.requirements.length);
  add('install',record.sections.install,record.installSteps.length);
  add('tabs',record.sections.tabs,record.files.length||record.changelog.length||record.posts.length||record.permissions.length);
  add('conflicts',record.sections.conflicts,record.conflicts.length);
  add('faq',record.sections.faq,record.faq.length);
  add('report',record.sections.report,record.feedbackOptions.length||record.feedbackTarget);
 }else throw new Error(`Missing article record for ${page.locale}:${page.template}`);
 return sections;
}
