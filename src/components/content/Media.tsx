import Image from 'next/image';
import type {Asset} from '@/content/schemas/asset';
export function Media({asset,locale,variant='figure',ratio,className='',eager=false}:{asset:Asset;locale:string;variant?:'hero'|'inner-hero'|'figure'|'card'|'video';ratio?:string;className?:string;eager?:boolean}){
 const alt=asset.alt[locale];
 const aboveFold=eager||variant==='hero'||variant==='inner-hero';
 if(!alt)throw new Error(`content/assets.json :: ${asset.id}.alt.${locale} :: missing translation`);
 return <div data-media-id={asset.id} className={`media-slot media-slot--${variant} ${className}`} style={ratio?{aspectRatio:ratio}:undefined}>
  {asset.src?<Image src={asset.src} width={asset.width} height={asset.height} alt={alt} loading={aboveFold?'eager':'lazy'} fetchPriority={aboveFold?'high':undefined} sizes="(max-width: 767px) 100vw, 1240px" style={{objectPosition:asset.position}}/>:<><div className="media-slot-outline" aria-hidden="true"/><div className="media-slot-label"><span>{alt}</span><span className="media-slot-dimensions">{asset.width} × {asset.height}</span></div><span className="media-slot-corner" aria-hidden="true"/></>}
 </div>;
}
