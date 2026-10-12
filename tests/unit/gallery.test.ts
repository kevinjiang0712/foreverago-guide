import {expect,it} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Gallery} from '../../src/components/interactive/Gallery';
const asset={id:'first',src:null,width:1280,height:720,purpose:'Demo art',alt:{en:'First artwork'},position:'50% 50%',demo:true};
const props={locale:'en',label:'Gallery',emptyLabel:'Artwork unavailable',selectLabel:'Select'};
it('renders an explicit dimensioned empty gallery and no invented selectors for empty or single images',()=>{const empty=renderToStaticMarkup(createElement(Gallery,{...props,images:[]}));expect(empty).toContain('Artwork unavailable');expect(empty).toContain('aspect-ratio:16/9');expect(empty).not.toContain('<button');const single=renderToStaticMarkup(createElement(Gallery,{...props,images:[asset]}));expect(single).toContain('First artwork');expect(single).not.toContain('<button');});
it('rejects invalid indices, missing translations and duplicate stable asset IDs',()=>{expect(()=>renderToStaticMarkup(createElement(Gallery,{...props,images:[asset],initialIndex:2}))).toThrow(/initialIndex/);expect(()=>renderToStaticMarkup(createElement(Gallery,{...props,images:[asset,asset]}))).toThrow(/duplicate.*first/);expect(()=>renderToStaticMarkup(createElement(Gallery,{...props,locale:'ja',images:[asset]}))).toThrow(/alt.ja/);});
it('uses asset IDs for selected media and announces translated thumbnail choices',()=>{const html=renderToStaticMarkup(createElement(Gallery,{...props,images:[asset,{...asset,id:'second',alt:{en:'Second artwork'}}],initialIndex:1}));expect(html).toContain('data-selected-asset="second"');expect(html).toContain('aria-label="Select: Second artwork"');expect((html.match(/aria-pressed="true"/g)??[])).toHaveLength(1);});
