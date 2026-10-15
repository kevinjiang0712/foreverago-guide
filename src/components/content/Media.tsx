import Image from 'next/image';
import {preload} from 'react-dom';
import type {Asset} from '@/content/schemas/asset';
export function Media({asset,locale,variant='figure',ratio,className='',eager=false}:{asset:Asset;locale:string;variant?:'hero'|'inner-hero'|'figure'|'card'|'video';ratio?:string;className?:string;eager?:boolean}){
 const alt=asset.alt[locale];
 const aboveFold=eager||variant==='hero'||variant==='inner-hero';
 if(!alt)throw new Error(`content/assets.json :: ${asset.id}.alt.${locale} :: missing translation`);
 const sizes=asset.avifSources&&variant==='hero'?'1600px':variant==='card'?'(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 400px':'(max-width: 767px) 100vw, 1240px';
 const avifSrcSet=asset.avifSources?.map(source=>`${source.src} ${source.width}w`).join(', ');
 const heroAvif=variant==='hero'?asset.avifSources?.at(-1):undefined;
 if(heroAvif)preload(heroAvif.src,{as:'image',type:'image/avif',imageSrcSet:avifSrcSet,imageSizes:sizes,fetchPriority:'high'});
 const image=asset.src?<Image src={asset.src} width={asset.width} height={asset.height} alt={alt} loading={aboveFold?'eager':'lazy'} fetchPriority={aboveFold?'high':undefined} sizes={sizes} style={{objectPosition:asset.position}}/>:null;
 return <div data-media-id={asset.id} className={`media-slot media-slot--${variant} ${className}`} style={ratio?{aspectRatio:ratio}:undefined}>
  {image?asset.avifSources?<picture><source type="image/avif" srcSet={avifSrcSet} sizes={sizes}/>{image}</picture>:image:<><div className="media-slot-outline" aria-hidden="true"/><div className="media-slot-label"><span>{alt}</span><span className="media-slot-dimensions">{asset.width} × {asset.height}</span></div><span className="media-slot-corner" aria-hidden="true"/></>}
 </div>;
}
