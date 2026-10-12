import {it,expect} from 'vitest';
import {parseMapProgress,mapProgressKey} from '../../src/content/map-progress';
it('isolates progress by site, map and data version',()=>{expect(mapProgressKey('site-a','world','v1')).toBe('site-a:map:world:v1');expect(new Set([mapProgressKey('a','world','v1'),mapProgressKey('b','world','v1'),mapProgressKey('a','world','v2'),mapProgressKey('a','cave','v1')]).size).toBe(4);});
it('starts empty without existing storage and restores known collectible pins',()=>{expect([...parseMapProgress(null,['one'])]).toEqual([]);expect([...parseMapProgress('["two","one"]',['one','two'])]).toEqual(['two','one']);});
it.each(['not json','{"one":true}','[1]','["missing"]','["one","one"]'])('reports damaged stored progress %s without silently dropping it',raw=>{expect(()=>parseMapProgress(raw,['one','two'])).toThrow(/Stored map progress/);});
