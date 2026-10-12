import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {AdSlot,assertAdAnchor} from '../../src/components/ads/AdSlot';
import {adsSchema} from '../../src/content/schemas/ads';
import {siteFixture} from './site-fixture';

it('defaults missing ad configuration to disabled',async()=>{
 const input=await siteFixture();
 expect(input.ads).toEqual(adsSchema.parse({mode:'disabled'}));
});

it('defaults every placement to a semantic anchor and accepts a project override',()=>{
 const defaults=adsSchema.parse({mode:'placeholder'});
 expect(defaults.placements).toMatchObject({
  a1:{anchor:'site-header',position:'after'},
  a2:{'site-home':{anchor:'featured',position:'after'}},
  a3:{anchor:'site-footer',position:'before'},
 });
 const configured=adsSchema.parse({mode:'placeholder',placements:{a2:{'site-home':{anchor:'about',position:'after'}}}});
 expect(configured.placements.a2['site-home']).toEqual({anchor:'about',position:'after'});
 expect(()=>assertAdAnchor(configured,'a2',['featured'],'site-home')).toThrow('configured A2 anchor "about" is unavailable');
});

it('renders no placement markup when ads are disabled',()=>{
 expect(renderToStaticMarkup(createElement(AdSlot,{mode:'disabled',placement:'a2'}))).toBe('');
});

it('renders placeholder markup only in placeholder mode',()=>{
 expect(renderToStaticMarkup(createElement(AdSlot,{mode:'placeholder',placement:'a2'}))).toContain('data-ad-placement="a2"');
});

it('requires approved units and rejects duplicate keys and non-HTTPS scripts',()=>{
 expect(()=>adsSchema.parse({mode:'adsterra'})).toThrow('requires');
 const adsterra={allowedHosts:['example.org'],units:{left:{key:'one',scriptUrl:'https://ads.example.org/one.js'},right:{key:'one',scriptUrl:'https://ads.example.org/two.js'}}};
 expect(()=>adsSchema.parse({mode:'adsterra',adsterra})).toThrow('Duplicate Banner key');
 expect(()=>adsSchema.parse({mode:'adsterra',adsterra:{...adsterra,units:{left:{key:'one',scriptUrl:'http://ads.example.org/one.js'}}}})).toThrow('HTTPS');
});
