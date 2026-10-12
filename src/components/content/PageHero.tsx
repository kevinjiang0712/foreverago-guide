import {HeroMotion} from '@/components/motion/HeroMotion';
import Link from 'next/link';
import type {ReactNode} from 'react';
import type {ContentIndex} from '@/content/types';
import {Media} from './Media';
export function PageHero({index,locale,title,description,label,assetId,categoryId,pathname,children}:{index:ContentIndex;locale:string;title:string;description:string;label:string;assetId?:string;categoryId?:string;pathname:string;children?:ReactNode}){
 const fallback={id:'page-placeholder',src:null,width:2560,height:1000,purpose:index.dictionaries[locale].ui.pageArtwork,alt:{[locale]:index.dictionaries[locale].ui.pageArtwork},position:'50% 50%',demo:false};
 const category=categoryId?index.categories[`${locale}:${categoryId}`]:undefined;
 return <HeroMotion className="page-hero inner-hero" data-floor="hero">{<Media asset={assetId?index.assets[assetId]:fallback} locale={locale} variant="inner-hero"/>}<div aria-hidden="true" className="hero-veil"/><div className="page-hero-content inner-hero-content"><nav data-hero-step className="breadcrumb" aria-label={index.dictionaries[locale].ui.breadcrumb}><Link href={index.translationGroups.home[locale]}>{index.dictionaries[locale].ui.home}</Link><span aria-hidden="true">/</span>{category&&category.path!==pathname?<><Link href={category.path}>{category.title}</Link><span aria-hidden="true">/</span><span aria-current="page">{title}</span></>:<span>{title}</span>}</nav><div data-hero-step className="page-hero-label">{label}</div><h1 data-hero-step>{title}</h1><p data-hero-step>{description}</p>{children}</div></HeroMotion>;
}
