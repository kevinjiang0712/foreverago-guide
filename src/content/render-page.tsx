import {CatalogPage} from '@/templates/catalog-page/CatalogPage';
import {BuildDetail} from '@/templates/build-detail/BuildDetail';
import {ModDetail} from '@/templates/mod-detail/ModDetail';
import {DatabaseDetail} from '@/templates/database-detail/DatabaseDetail';
import {ArticlePage} from '@/templates/article-page/ArticlePage';
import {renderedTemplate} from './template-layouts';
import type {ContentIndex,ContentRoute} from './types';
import {mdxImports} from '../../.generated/mdx-imports';
import {mdxComponents} from './mdx-context';
import {SiteHome} from '@/templates/site-home/SiteHome';
import {ListPage} from '@/templates/list-page/ListPage';
import {WeaponExplorer} from '@/templates/weapon-explorer/WeaponExplorer';
import {InteractiveMap} from '@/templates/interactive-map/InteractiveMap';
import {RelatedContent} from '@/components/content/RelatedContent';
export async function renderPage(index:ContentIndex,route:ContentRoute){
 if(route.kind==='home')return <SiteHome index={index} locale={route.locale}/>;
 if(route.kind==='category')return <ListPage index={index} category={index.categories[`${route.locale}:${route.categoryId}`]}/>;
 const page=index.pagesByKey[route.bodyKey];
 const layout=renderedTemplate(page.template);
 if(layout==='catalog-page')return <CatalogPage index={index} page={page}/>;
 if(layout==='list-page')return <ListPage index={index} page={page}/>;
 const importer=mdxImports[route.bodyKey as keyof typeof mdxImports];
 if(!importer)throw new Error(`Missing compiled MDX module: ${route.bodyKey}`);
 const {default:Body}=await importer();const body=<Body components={mdxComponents(index,route.locale,layout==='article-page'&&!page.articleRecord&&page.template==='wiki-page'&&page.category!=='_pages')}/>;
 const template=(()=>{switch(layout){case 'database-detail':return <DatabaseDetail index={index} page={page} body={body}/>;case 'mod-detail':return <ModDetail index={index} page={page} body={body}/>;case 'article-page':if(page.articleRecord&&index.records[`${page.locale}:${page.articleRecord}`]?.type==='build')return <BuildDetail index={index} page={page} body={body}/>;return <ArticlePage index={index} page={page} body={body}/>;case 'interactive-map':return <InteractiveMap index={index} page={page} body={body}/>;case 'weapon-explorer':return <WeaponExplorer index={index} page={page} body={body}/>;default:throw new Error(`Unimplemented page layout: ${layout} for ${page.template}`);}})();
 return <>{template}<RelatedContent index={index} page={page}/></>;
}
