'use client';
import {useId,useRef,useState} from 'react';
import type {Asset as ImageAsset} from '../../content/schemas/asset';
import {Media} from '../content/Media';
import './gallery.css';
export type GalleryProps={images:ImageAsset[];locale:string;label:string;emptyLabel:string;selectLabel:string;initialIndex?:number};
export function Gallery({images,locale,label,emptyLabel,selectLabel,initialIndex=0}:GalleryProps){
 const instance=useId();const [selectedIndex,setSelectedIndex]=useState(initialIndex);const buttons=useRef<(HTMLButtonElement|null)[]>([]);
 if(!Number.isInteger(initialIndex)||initialIndex<0||(images.length?initialIndex>=images.length:initialIndex!==0))throw new Error(`Gallery ${label}: invalid initialIndex ${initialIndex}`);
 const ids=new Set<string>();for(const asset of images){if(ids.has(asset.id))throw new Error(`Gallery ${label}: duplicate asset ID ${asset.id}`);ids.add(asset.id);if(!asset.alt[locale])throw new Error(`Gallery ${asset.id}.alt.${locale}: missing translation`);}
 const activeIndex=selectedIndex<images.length?selectedIndex:0;
 const selected=images[activeIndex]??{id:'gallery-empty',src:null,width:1280,height:720,purpose:emptyLabel,alt:{[locale]:emptyLabel},position:'50% 50%',demo:false};
 function choose(index:number){setSelectedIndex(index);buttons.current[index]?.focus();}
 return <div className="gallery" role="group" aria-label={label} data-gallery data-selected-asset={images.length?selected.id:undefined}><div id={`${instance}-image`} className="gallery-main"><Media asset={selected} locale={locale} ratio="16/9"/></div>{images.length>1&&<div className="gallery-thumbnails">{images.map((asset,index)=><button type="button" key={asset.id} ref={button=>{buttons.current[index]=button;}} aria-label={`${selectLabel}: ${asset.alt[locale]}`} aria-pressed={index===activeIndex} aria-controls={`${instance}-image`} onClick={()=>setSelectedIndex(index)} onKeyDown={event=>{const destination=event.key==='ArrowRight'?(index+1)%images.length:event.key==='ArrowLeft'?(index-1+images.length)%images.length:event.key==='Home'?0:event.key==='End'?images.length-1:null;if(destination!==null){event.preventDefault();choose(destination);}}}><Media asset={asset} locale={locale} ratio="16/9"/></button>)}</div>}</div>;
}
