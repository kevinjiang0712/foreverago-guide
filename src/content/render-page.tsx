import {loadSiteHome,loadListPage,loadArticlePage,loadCatalogPage,loadDatabaseDetail,loadModDetail,loadBuildDetail,loadInteractiveMap,loadWeaponExplorer} from '../../.generated/template-imports';
import {renderedTemplate} from './template-layouts';
import type {ContentIndex,ContentRoute} from './types';
import {mdxImports} from '../../.generated/mdx-imports';
import {mdxComponents} from './mdx-context';
import {RelatedContent} from '@/components/content/RelatedContent';
export async function renderPage(index:ContentIndex,route:ContentRoute){
 if(route.kind==='home'){const {SiteHome}=await loadSiteHome();return <SiteHome index={index} locale={route.locale}/>;}
 if(route.kind==='category'){const {ListPage}=await loadListPage();return <ListPage index={index} category={index.categories[`${route.locale}:${route.categoryId}`]}/>;}
 const page=index.pagesByKey[route.bodyKey];
 const layout=renderedTemplate(page.template);
 if(layout==='catalog-page'){const {CatalogPage}=await loadCatalogPage();return <CatalogPage index={index} page={page}/>;}
 if(layout==='list-page'){const {ListPage}=await loadListPage();return <ListPage index={index} page={page}/>;}
 const importer=mdxImports[route.bodyKey as keyof typeof mdxImports];
 if(!importer)throw new Error(`Missing compiled MDX module: ${route.bodyKey}`);
 const {default:Body}=await importer();const body=<Body components={mdxComponents(index,route.locale,layout==='article-page'&&!page.articleRecord&&page.template==='wiki-page'&&page.category!=='_pages')}/>;
 const template=await(async()=>{switch(layout){
  case 'database-detail':{const {DatabaseDetail}=await loadDatabaseDetail();return <DatabaseDetail index={index} page={page} body={body}/>;}
  case 'mod-detail':{const {ModDetail}=await loadModDetail();return <ModDetail index={index} page={page} body={body}/>;}
  case 'article-page':{
   if(page.articleRecord&&index.records[`${page.locale}:${page.articleRecord}`]?.type==='build'){const {BuildDetail}=await loadBuildDetail();return <BuildDetail index={index} page={page} body={body}/>;}
   const {ArticlePage}=await loadArticlePage();return <ArticlePage index={index} page={page} body={body}/>;
  }
  case 'interactive-map':{const {InteractiveMap}=await loadInteractiveMap();return <InteractiveMap index={index} page={page} body={body}/>;}
  case 'weapon-explorer':{const {WeaponExplorer}=await loadWeaponExplorer();return <WeaponExplorer index={index} page={page} body={body}/>;}
  default:throw new Error(`Unimplemented page layout: ${layout} for ${page.template}`);
 }})();
 return <>{template}<RelatedContent index={index} page={page}/></>;
}
