import Link from 'next/link';
import type {ContentIndex,IndexedPage} from '@/content/types';
export function CatalogHeader({index,page,compact=false}:{index:ContentIndex;page:IndexedPage;compact?:boolean}){
 const ui=index.dictionaries[page.locale].ui,category=index.categories[`${page.locale}:${page.category}`];
 return <header className="catalog-hero inner-hero" data-theme-mode="night" data-hero-size={compact?'catalog':undefined} data-floor="hero"><div className="container inner-hero-content">
  <nav className="breadcrumb" aria-label={ui.breadcrumb}><Link href={index.translationGroups.home[page.locale]}>{ui.home}</Link><span aria-hidden="true">/</span>{category&&category.path!==page.path&&<><Link href={category.path}>{category.title}</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{page.title}</span></nav>
  <div className="catalog-kicker">{(!compact||!page.demo)&&<span>{ui[page.verification]}</span>}{page.demo&&<span>{ui.demo}</span>}{page.gameVersion&&<span>{ui.version}: {page.gameVersion}</span>}{page.updatedAt&&<time dateTime={page.updatedAt}>{ui.updated}: {page.updatedAt}</time>}</div>
  <h1>{page.title}</h1><p>{page.description}</p>
 </div></header>;
}
