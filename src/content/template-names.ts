export const templateNames=['site-home','wiki-page','boss-index','character-database','character-detail','systems-reference','build-library','weapon-explorer','weapon-detail','interactive-map','mod-index','mod-detail','database-index','database-detail'] as const;
export type TemplateName=typeof templateNames[number];
