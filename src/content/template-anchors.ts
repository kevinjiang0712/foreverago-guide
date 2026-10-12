import {articleOutline} from './article-outline';
import {isArticleType,isListType} from './template-layouts';
import type {PageMetadata} from './schemas/page';
// Every page owns its main landmark. Register additional fixed IDs when a template adds them.
export function fixedPageAnchors(template:PageMetadata['template']):readonly string[]{
 if(template==='database-detail')return ['main','overview','parameters'];
 if(template==='character-detail')return ['main','article-body','attributes','skills','acquisition','sources'];
 if(template==='interactive-map')return ['main','map','legend','locations','progress','how-to','faq','sources'];
 if(template==='mod-index')return ['main','browse','install','compat','safety','faq','legal'];
 if(template==='mod-detail')return ['main','overview','requirements','install','tabs','conflicts','faq','report','sources'];
 if(template==='build-library')return ['main','find-build','setups','presets','rescue','faq','sources'];
 if(template==='weapon-explorer')return ['main','comparison','explorer','playstyles','details','tier-list','unlocks','upgrades','changes','faq','sources'];
 if(template==='wiki-page')return ['main','article-body','sources'];
 if(template==='systems-reference')return ['main','mechanisms','combos','items','sources'];
 return template==='weapon-detail'?['main','overview','unlock','tabs','matchups','pairs','faq','sources']:['main'];
}

import type {ContentIndex,IndexedPage} from './types';
export function pageTemplateAnchors(index:ContentIndex,page:Pick<IndexedPage,'template'|'records'|'locale'|'articleRecord'|'listGuide'>):readonly string[]{
 if(page.template==='database-detail')return fixedPageAnchors(page.template);
 if(isArticleType(page.template))return ['main',...articleOutline(index,page).map(section=>section.id)];
 if(isListType(page.template)&&page.listGuide===null)return ['main','browse'];
 const fixed=fixedPageAnchors(page.template).filter(id=>id!=='sources');if(page.template!=='build-library')return fixed;
 const library=page.records.map(id=>index.records[`${page.locale}:${id}`]).find(record=>record.type==='build-library');
 if(!library||library.type!=='build-library')throw new Error(`Missing build-library record for template anchors in ${page.locale}`);
 return [...fixed,...library.buildIds.map(id=>`setup-${id}`)];
}
