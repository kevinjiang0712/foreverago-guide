import type {ContentIndex,IndexedCategory,IndexedPage} from './types';

export type HomeFloorLayout='editorial'|'media'|'data';
export type HomeDiscoveryLink={id:string;path:string;title:string;description:string;categoryId:string;categoryTitle:string;verification:string;template:string;thumbnailId?:string;heroId?:string;updatedAt?:string};
export type HomeCategoryFloor={id:string;path:string;eyebrow:string;title:string;description:string;layout:HomeFloorLayout;items:HomeDiscoveryLink[];hoverReveal?:boolean};

function pageLink(index:ContentIndex,category:IndexedCategory,page:IndexedPage):HomeDiscoveryLink{
 return {id:page.id,path:page.path,title:page.card?.title??page.title,description:page.card?.description??page.description,categoryId:category.id,categoryTitle:category.title,verification:index.dictionaries[page.locale].ui[page.verification],template:page.template,thumbnailId:page.card?.image??page.assets.thumbnail,heroId:page.assets.hero,updatedAt:page.updatedAt};
}
function automaticLayout(index:ContentIndex,category:IndexedCategory):HomeFloorLayout{
 const override=index.site.homepage.layoutOverrides[category.id];if(override)return override;
 const templates=new Set(category.pages.map(key=>index.pagesByKey[key].template));
 if([...templates].some(template=>['build-library','mod-index'].includes(template)))return 'data';
 if([...templates].some(template=>['boss-index','character-database','character-detail','weapon-detail','weapon-explorer'].includes(template)))return 'media';
 return 'editorial';
}
export function buildHomeDiscovery(index:ContentIndex,locale:string){
 const home=index.homes[locale];if(!home)throw new Error(`Missing homepage: ${locale}`);
 const categories=Object.values(index.categories).filter(category=>category.locale===locale&&category.visible).sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
 const pools=categories.map(category=>({category,items:category.pages.map(key=>index.pagesByKey[key]).filter(page=>page.id!==category.landing).map(page=>pageLink(index,category,page))}));
 if(home.articleFloors!==undefined){
  const article=(id:string)=>{
   const page=index.pagesByKey[`${locale}:${id}`];if(!page)throw new Error(`Missing homepage article ${locale}:${id}`);
   const category=index.categories[`${locale}:${page.category}`];if(!category)throw new Error(`Missing homepage article category ${locale}:${page.category}`);
   return pageLink(index,category,page);
  };
  return {categories,featured:home.featured.pinnedIds.map(article),floors:home.articleFloors.map(floor=>({id:floor.id,path:'',eyebrow:floor.eyebrow,title:floor.title,description:floor.description,layout:'editorial' as const,items:floor.articleIds.map(article),hoverReveal:true}))};
 }
 const byId=new Map(pools.flatMap(pool=>pool.items).map(item=>[item.id,item]));const featured:HomeDiscoveryLink[]=[];const seen=new Set<string>();
 const add=(item:HomeDiscoveryLink|undefined)=>{if(item&&!seen.has(item.id)){seen.add(item.id);featured.push(item);}};
 home.featured.pinnedIds.forEach(id=>add(byId.get(id)));
 pools.forEach(pool=>add(pool.items[0]));
 pools.flatMap(pool=>pool.items).forEach(item=>add(item));
 const floors:HomeCategoryFloor[]=pools.filter(pool=>pool.items.length>=index.site.homepage.categoryFloorMinItems).map(({category,items})=>({id:category.id,path:category.path,eyebrow:category.title,title:category.homepageTitle??category.title,description:category.homepageDescription??category.description,layout:automaticLayout(index,category),items:items.slice(0,index.site.homepage.categoryFloorLimit)}));
 return {categories,featured:featured.slice(0,index.site.homepage.featuredLimit),floors};
}
