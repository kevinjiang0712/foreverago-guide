'use client';
import {useState} from 'react';
import Image from 'next/image';
import {youtubeVideoId} from '../../content/youtube';
export function VideoCard({url,title}:{url:string;title:string}){
 const [playing,setPlaying]=useState(false);
 const id=youtubeVideoId(url);
 if(!id)throw new Error(`Invalid YouTube video URL: ${url}`);
 return <div className="video-embed">{playing?<iframe src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:<button type="button" className="video-preview" aria-label={`Play ${title}`} onClick={()=>setPlaying(true)}><Image unoptimized src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" width={480} height={360} loading="lazy"/><span className="video-preview-title">{title}</span><span className="video-preview-play" aria-hidden="true">▶</span></button>}<noscript><a href={url}>Watch {title} on YouTube</a></noscript></div>;
}
