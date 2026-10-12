import type {ReactNode} from 'react';
import type {ContentIndex,IndexedPage} from '@/content/types';
import {Media} from '@/components/content/Media';
import {characterDetailModel} from '../character-detail/model';
import {ArticleFacts,ArticleStatus,ArticleSteps} from './ArticleBlocks';
import type {ArticleModules} from './ArticlePage';

export function characterArticle(index:ContentIndex,page:IndexedPage,body:ReactNode):ArticleModules{
 const {record,character,portrait,skills}=characterDetailModel(index,page);
 const ui=index.dictionaries[page.locale].ui;
 return {
  summary:<div className="article-identity">{portrait.src&&<Media asset={portrait} locale={page.locale} ratio="3/4" className="article-portrait"/>}<div><p className="article-note">{character.role}</p><p>{character.summary}</p><ArticleStatus value={character.verification} ui={ui}/></div></div>,
  sections:{
   'article-body':<div data-template-body data-article-body>{body}</div>,
   attributes:<><ArticleFacts facts={character.attributes} ui={ui}/>{record.attributeNote&&<p className="article-note">{record.attributeNote}</p>}</>,
   skills:<div className="article-entries">{skills.map(skill=><div className="article-skill" key={skill.id} data-skill-id={skill.id}>
    {skill.icon.src&&<Media asset={skill.icon} locale={page.locale} ratio="1/1" className="article-icon"/>}<div><p className="article-note">{skill.kind}</p><h3>{skill.name}</h3><p>{skill.description}</p>
    <ArticleFacts facts={[...(skill.cost!==null?[{label:record.labels.cost,value:skill.cost}]:[]),...(skill.cooldown!==null?[{label:record.labels.cooldown,value:skill.cooldown}]:[])]} ui={ui}/><ArticleStatus value={skill.verification} ui={ui}/></div>
   </div>)}</div>,
   acquisition:<><ArticleFacts facts={[{label:record.labels.prerequisites,value:record.acquisition.prerequisites},{label:record.labels.location,value:record.acquisition.location}]} ui={ui}/><ArticleSteps steps={record.acquisition.steps} ui={ui}/></>,
  },
 };
}
