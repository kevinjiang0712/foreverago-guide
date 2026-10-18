import Link from 'next/link';
import type {ReactNode} from 'react';
import type {ContentIndex} from '@/content/types';
import {resolveTarget,type LinkTarget} from '@/content/references';
export function ContentLink({index,locale,target,children,className,prefetch}:{index:ContentIndex;locale:string;target:LinkTarget;children:ReactNode;className?:string;prefetch?:boolean}){
 const href=resolveTarget(index,locale,target);
 if(!href)return <span className={className} aria-disabled="true">{children} · {index.dictionaries[locale].ui.unavailable}</span>;
 return <Link href={href} prefetch={prefetch} className={className} {...(/^https?:/i.test(href)?{rel:'noopener noreferrer'}:{})}>{children}</Link>;
}
