import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Tabs} from '../../src/components/interactive/Tabs';
const items=[{id:'one',label:'First',content:createElement('button',null,'First action')},{id:'two',label:'Second',content:createElement('button',null,'Second action')}];
describe('accessible template tabs',()=>{
 it('rejects invalid initial IDs, empty lists and duplicate stable IDs',()=>{expect(()=>renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items,initialId:'missing'}))).toThrow(/missing/);expect(()=>renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items:[]}))).toThrow(/at least one/);expect(()=>renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items:[items[0],items[0]]}))).toThrow(/duplicate.*one/);});
 it('rejects empty item IDs instead of creating an unselectable tab',()=>{expect(()=>renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items:[items[0],{...items[1],id:''}]}))).toThrow(/empty item ID/);});
 it('rejects an empty initial ID and keeps arbitrary item IDs out of DOM bindings',()=>{expect(()=>renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items,initialId:''}))).toThrow(/initialId/);const html=renderToStaticMarkup(createElement(Tabs,{label:'Tabs',items:[{...items[0],id:'first tab'}]}));expect([...html.matchAll(/aria-controls="([^"]+)"/g)].every(match=>!(/\s/.test(match[1])))).toBe(true);});
 it('keeps server panel IDs unique across instances and hides inactive controls',()=>{const html=renderToStaticMarkup(createElement('div',null,createElement(Tabs,{label:'Primary',items}),createElement(Tabs,{label:'Secondary',items,initialId:'two'})));const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(match=>match[1]);expect(new Set(ids).size).toBe(ids.length);expect((html.match(/role="tabpanel"/g)??[])).toHaveLength(4);expect((html.match(/hidden=""/g)??[])).toHaveLength(2);expect((html.match(/aria-selected="true"/g)??[])).toHaveLength(2);});
});
