import type {TemplateName} from './template-names';

export const runtimeLayouts=['site-home','list-page','article-page','weapon-explorer','interactive-map','catalog-page','database-detail','mod-detail','build-detail'] as const;
export type RuntimeLayout=typeof runtimeLayouts[number];

export const listTypes=['boss-index','character-database','build-library','mod-index','database-index'] as const;
export const articleTypes=['wiki-page','character-detail','weapon-detail','systems-reference','mod-detail'] as const;

export const templateLayouts={
 'site-home':'site-home',
 'wiki-page':'article-page',
 'boss-index':'list-page',
 'character-database':'list-page',
 'character-detail':'article-page',
 'systems-reference':'article-page',
 'build-library':'catalog-page',
 'weapon-explorer':'weapon-explorer',
 'weapon-detail':'article-page',
 'interactive-map':'interactive-map',
 'mod-index':'catalog-page',
 'mod-detail':'mod-detail',
 'database-index':'catalog-page',
 'database-detail':'database-detail',
} as const satisfies Record<TemplateName,RuntimeLayout>;

export function renderedTemplate(type:TemplateName):RuntimeLayout{return templateLayouts[type];}
export function isListType(type:TemplateName):type is typeof listTypes[number]{return (listTypes as readonly string[]).includes(type);}
export function isArticleType(type:TemplateName):type is typeof articleTypes[number]{return (articleTypes as readonly string[]).includes(type);}
