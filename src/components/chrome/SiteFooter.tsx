/* The square local mark is already sized and optimized; static exports use its original URL. */
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type {BrandModel,FooterModel} from '@/content/navigation';
import {ArrowRightIcon} from '@/components/content/ArrowRightIcon';
export function Brand({brand}:{brand:BrandModel}){
 return <Link href={brand.href} className="site-brand" title={brand.name}>{brand.logoSrc?<img className="site-brand-mark" src={brand.logoSrc} alt="" width={22} height={22}/>:<span className="site-brand-mark site-brand-placeholder" aria-hidden="true">{Array.from(brand.name)[0]}</span>}<span className="site-wordmark">{brand.name}</span></Link>;
}
export function SiteFooter({model}:{model:FooterModel}){
 return <footer className="site-footer"><div className="site-footer-grid"><div className="site-footer-brand"><div><Brand brand={model.brand}/><p className="site-footer-description">{model.description}</p></div><p className="site-footer-disclaimer"><span>{model.disclaimer}</span><span>{model.copyright}</span></p></div>{model.columns.map(column=>{const headingId=`footer-${column.id}`;return <nav className="site-footer-column" data-footer-column={column.id} aria-labelledby={headingId} key={column.id}><h2 className="site-footer-heading" id={headingId}>{column.title}</h2><div className="site-footer-links">{column.links.map(link=>{const external=link.href?.startsWith('http')??false;return link.href?<Link className="site-footer-entry" key={link.id} href={link.href} target={external?'_blank':undefined} rel={external?'noopener noreferrer':undefined}>{link.label}{external&&<><ArrowRightIcon/><span className="visually-hidden"> {model.externalLabel}</span></>}</Link>:<span key={link.id} className="site-footer-entry site-footer-placeholder" aria-disabled="true">{link.label}<span className="visually-hidden"> — {model.unavailableLabel}</span></span>;})}</div></nav>;})}</div></footer>;
}
