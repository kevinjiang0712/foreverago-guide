import {youtubeVideoId} from '../../content/youtube';
export function VideoCard({url,title}:{url:string;title:string}){
 const id=youtubeVideoId(url);
 if(!id)throw new Error(`Invalid YouTube video URL: ${url}`);
 return <div className="video-embed"><iframe src={`https://www.youtube-nocookie.com/embed/${id}`} title={title} loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div>;
}
