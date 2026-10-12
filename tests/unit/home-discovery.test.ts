import {expect,it} from 'vitest';
import {siteFixture} from './site-fixture';
import {buildIndex} from '../../src/content/build-index';
import {buildHomeDiscovery} from '../../src/content/home-discovery';

it('pins featured links, applies layout overrides and hides short category floors',async()=>{
 const input=await siteFixture();const first=input.pages.find(page=>page.locale==='en');if(!first)throw new Error('English fixture page missing');
 for(let number=2;number<=4;number++)input.pages.push({...first,id:`guide-${number}`,slug:`guide-${number}`,title:`Guide ${number}`,sourcePath:`content/en/pages/guide-${number}.mdx`});
 input.homes.find(home=>home.locale==='en')!.featured.pinnedIds=['guide-4'];
 input.site.homepage.layoutOverrides.guides='data';
 let discovery=buildHomeDiscovery(buildIndex(input,{preview:false}),'en');
 expect(discovery.featured[0].id).toBe('guide-4');
 expect(discovery.floors).toHaveLength(1);
 expect(discovery.floors[0]).toMatchObject({id:'guides',layout:'data'});
 expect(discovery.floors[0].items).toHaveLength(4);
 input.site.homepage.categoryFloorMinItems=5;
 discovery=buildHomeDiscovery(buildIndex(input,{preview:false}),'en');
 expect(discovery.floors).toEqual([]);
});
