export function youtubeVideoId(value:string):string|null{
 let url:URL;
 try{url=new URL(value);}catch{return null;}
 if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
 if(['t','start','time_continue','end','list','index'].some(key=>url.searchParams.has(key)))return null;
 const host=url.hostname.toLowerCase();
 const segments=url.pathname.split('/').filter(Boolean);
 let id:string|null=null;
 if(host==='youtu.be'&&segments.length===1)id=segments[0];
 else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){
  if(url.pathname==='/watch')id=url.searchParams.get('v');
  else if(segments.length===2&&['embed','shorts','live'].includes(segments[0]))id=segments[1];
 }
 else if((host==='youtube-nocookie.com'||host==='www.youtube-nocookie.com')&&segments.length===2&&segments[0]==='embed')id=segments[1];
 return id&&/^[A-Za-z0-9_-]{11}$/.test(id)?id:null;
}
