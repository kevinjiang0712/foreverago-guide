import type {Plugin} from 'unified';
import type {Root} from 'mdast';
export type MdxReference={kind:'content'|'category'|'official'|'asset'|'record'|'link'|'image';id:string;line:number};
export type MdxAnalysis={headingIds:string[];headings:{id:string;text:string;depth:2|3}[];references:MdxReference[]};
export function analyzeMdx(source:string,file:string,lineOffset?:number):MdxAnalysis;
declare const remarkContent:Plugin<[],Root>;
export default remarkContent;
