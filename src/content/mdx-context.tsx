import {AdContentSlot} from '@/components/ads/AdContentSlot';
import type {MDXComponents} from 'mdx/types';
import type {ContentIndex} from './types';
import {ContentLink} from '@/components/content/ContentLink';
import {Media} from '@/components/content/Media';
import {DataTable} from '@/components/content/DataTable';
import {Notice} from '@/components/content/Notice';
import {Steps} from '@/components/content/Steps';
import {VideoCard} from '@/components/content/VideoCard';
import {baseMDXComponents} from '@/mdx-components';
import type {ReactNode} from 'react';
import {lookup} from './lookup';
export function mdxComponents(index:ContentIndex,locale:string,bodyAds=false):MDXComponents{
 const policies=index.site.policies;
 return {...baseMDXComponents,
  BodyAdSlot:({slot}:{slot:'native'|'inline'})=>bodyAds?<AdContentSlot slot={slot}/>:null,
  ContentLink:({id,type='content',children}:{id:string;type?:'content'|'category'|'official';children:ReactNode})=><ContentLink index={index} locale={locale} target={{type,id}}>{children}</ContentLink>,
  Media:({id}:{id:string})=>{const asset=lookup(index.assets,id);if(!asset)throw new Error(`Unknown MDX asset: ${id}`);return <Media asset={asset} locale={locale}/>;},
  DataTable:({recordId}:{recordId:string})=>{const record=lookup(index.records,`${locale}:${recordId}`);if(!record||record.type!=='table')throw new Error(`Unknown MDX table: ${recordId}`);return <DataTable record={record} unknown={index.dictionaries[locale].ui.unknown}/>;},
  PolicyValue:({field}:{field:'siteName'|'gameName'|'effectiveDate'})=>{if(!policies)throw new Error('PolicyValue requires config/site.json policies');return field==='siteName'?index.dictionaries[locale].siteName:field==='gameName'?index.dictionaries[locale].game.name:policies.effectiveDate;},
  PolicyContact:()=>{if(!policies)throw new Error('PolicyContact requires config/site.json policies');return policies.contactEmail?<a href={`mailto:${policies.contactEmail}`}>{policies.contactEmail}</a>:<span>{index.dictionaries[locale].ui.notConfigured}</span>;},
  YouTube:({url,title}:{url:string;title:string})=><VideoCard url={url} title={title}/>,
  Notice,Steps,
  img:({src})=>{const asset=Object.values(index.assets).find(asset=>asset.src===src);if(!asset)throw new Error(`Unregistered MDX image: ${String(src)}`);return <Media asset={asset} locale={locale}/>;},
 };
}
