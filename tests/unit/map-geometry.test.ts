import {describe,it,expect} from 'vitest';
import {zoomAtPoint,clampToViewport} from '../../src/content/map-geometry';
describe('map geometry',()=>{
 it('keeps the map coordinate beneath the chosen zoom point fixed',()=>{const current={scale:2,x:-80,y:-30};const point={x:120,y:90};const next=zoomAtPoint(current,3,point);expect((point.x-next.x)/next.scale).toBeCloseTo((point.x-current.x)/current.scale);expect((point.y-next.y)/next.scale).toBeCloseTo((point.y-current.y)/current.scale);});
 it('clamps zoom to the supported one-to-four range',()=>{expect(zoomAtPoint({scale:1,x:0,y:0},8,{x:100,y:50}).scale).toBe(4);expect(zoomAtPoint({scale:2,x:-100,y:-50},0,{x:100,y:50})).toEqual({scale:1,x:0,y:0});});
 it('clamps drag offsets to visible map boundaries and resets at 1x',()=>{expect(clampToViewport({scale:2,x:120,y:-1000},{width:400,height:250})).toEqual({scale:2,x:0,y:-250});expect(clampToViewport({scale:1,x:-120,y:100},{width:400,height:250})).toEqual({scale:1,x:0,y:0});});
 it('preserves an in-bounds transform without mutating its input',()=>{const current={scale:3,x:-120,y:-100};expect(clampToViewport(current,{width:400,height:250})).toEqual(current);expect(current).toEqual({scale:3,x:-120,y:-100});});
 it('rejects arithmetic overflow instead of returning invalid coordinates',()=>{expect(()=>zoomAtPoint({scale:Number.MIN_VALUE,x:0,y:0},1,{x:0,y:1})).toThrow(/Map/);});
 it('rejects invalid geometry at the call boundary',()=>{expect(()=>zoomAtPoint({scale:0,x:0,y:0},2,{x:0,y:0})).toThrow(/scale.*0/);expect(()=>zoomAtPoint({scale:1,x:0,y:0},NaN,{x:0,y:0})).toThrow(/requestedScale.*NaN/);expect(()=>clampToViewport({scale:2,x:Infinity,y:0},{width:400,height:250})).toThrow(/x.*Infinity/);expect(()=>clampToViewport({scale:2,x:0,y:0},{width:0,height:250})).toThrow(/width.*0/);});
});
