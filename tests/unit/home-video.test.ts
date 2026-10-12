import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {VideoCard} from '../../src/components/content/VideoCard';
import {homeSchema} from '../../src/content/schemas/home';
import {youtubeVideoId} from '../../src/content/youtube';

const home=JSON.parse(readFileSync('content/en/home.json','utf8'));
const videoId='M7lc1UVf-VE';

function withVideo(video:unknown){
 return {...home,hero:{...home.hero,video}};
}

it('hides the video with an explicit null and rejects an omitted field',()=>{
 expect(homeSchema.parse(withVideo(null)).hero.video).toBeNull();
 const hero={...home.hero};
 delete hero.video;
 expect(homeSchema.safeParse({...home,hero}).success).toBe(false);
});

it.each([
 `https://www.youtube.com/watch?v=${videoId}`,
 `https://youtube.com/shorts/${videoId}`,
 `https://youtu.be/${videoId}`,
 `https://www.youtube.com/embed/${videoId}`,
])('accepts a YouTube video URL: %s',url=>{
 expect(youtubeVideoId(url)).toBe(videoId);
 expect(homeSchema.parse(withVideo({url,title:'Official trailer'})).hero.video).toEqual({url,title:'Official trailer'});
});

it.each([
 'https://youtube.com.evil.test/watch?v=M7lc1UVf-VE',
 'http://www.youtube.com/watch?v=M7lc1UVf-VE',
 'https://www.youtube.com/playlist?list=PL123',
 'https://youtu.be/not-a-video-id',
 `https://youtu.be/${videoId}?t=90`,
 `https://www.youtube.com/watch?v=${videoId}&list=PL123`,
])('rejects a non-video or unsafe URL: %s',url=>{
 expect(youtubeVideoId(url)).toBeNull();
 expect(homeSchema.safeParse(withVideo({url,title:'Official trailer'})).success).toBe(false);
});

it('requires only URL and a single-line title of at most 120 characters',()=>{
 const url=`https://youtu.be/${videoId}`;
 expect(homeSchema.safeParse(withVideo({url,title:'Trailer',asset:'trailer'})).success).toBe(false);
 expect(homeSchema.safeParse(withVideo({url,title:'Line one\nLine two'})).success).toBe(false);
 expect(homeSchema.safeParse(withVideo({url,title:'\nTrailer'})).success).toBe(false);
 expect(homeSchema.safeParse(withVideo({url,title:'x'.repeat(121)})).success).toBe(false);
 expect(homeSchema.safeParse(withVideo({url,title:' '})).success).toBe(false);
});

it('renders a YouTube preview without a local cover or autoplay',()=>{
 const html=renderToStaticMarkup(createElement(VideoCard,{url:`https://youtu.be/${videoId}`,title:'Official trailer'}));
 expect(html).toContain(`<iframe src="https://www.youtube-nocookie.com/embed/${videoId}"`);
 expect(html).toContain('title="Official trailer"');
 expect(html).not.toContain('<img');
 expect(html).not.toContain('autoplay');
});
