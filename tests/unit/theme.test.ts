import { describe,it,expect } from 'vitest';
import { readFile,mkdtemp,cp,writeFile,rm,stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { contrastRatio,readPreset,validateTheme,prepareTheme } from '../../src/content/theme';
import presetManifest from '../../src/styles/presets/manifest.json';
const presets=Object.keys(presetManifest);
it('maintains only the Onimusha base',()=>{expect(presets).toEqual(['onimusha']);});
it('computes real unrounded contrast and rejects unsupported RGB input',()=>{
 expect(contrastRatio('#000000','#ffffff')).toBe(21);
 expect(contrastRatio('#777777','#ffffff')).toBeLessThan(4.5);
 expect(()=>contrastRatio('red','#000000')).toThrow('red');
});
it('retains all core files byte for byte',async()=>{
 for(const name of ['core-space.css','core-typescale.css','core-motion.css','core-texture.css','base.css']){
  const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');
  expect(hash(await readFile(`src/styles/core/${name}`))).toBe(hash(await readFile(`tests/fixtures/design-system/tokens/${name}`)));
 }
});
describe.each(presets)('%s day and night',preset=>{
 it.each(['day','night'] as const)('has61 theme tokens and passing text/states in %s',async mode=>{
  const tokens=await readPreset(process.cwd(),preset,mode);
  expect(Object.keys(tokens)).toHaveLength(61);
  const grounds=['--surface-page','--surface-alt','--surface-card','--surface-well'];
  for(const ink of ['--text-primary','--text-secondary','--text-caption','--marker','--marker-soft','--ok','--warn','--accent-text','--danger'])
   for(const ground of grounds)expect(contrastRatio(tokens[ink],tokens[ground]),`${preset}/${mode}: ${ink} on ${ground}`).toBeGreaterThanOrEqual(4.5);
  for(const fill of ['--accent','--accent-hover','--accent-press'])expect(contrastRatio(tokens['--text-on-accent'],tokens[fill]),`${preset}/${mode}: on-accent on ${fill}`).toBeGreaterThanOrEqual(4.5);
 });
});
it.each([
 ['core field',{common:{'--s-1':'12px'}},'--s-1'],
 ['one-sided color',{day:{'--accent':'#000000'}},'night'],
 ['unsafe CSS',{common:{'--font-ui':'x; color:red'}},'unsafe CSS'],
 ['overshoot',{common:{'--motion-overshoot':'.05'}},'--motion-overshoot'],
 ['unknown preset',{preset:'missing'},'missing'],
 ['archived preset',{preset:'bright-sim'},'bright-sim'],
 ['missing font',{fonts:[{family:'Missing',src:'/media/missing.woff2',weight:400}]},'missing.woff2'],
])('rejects %s',async(_label,override,expected)=>{
 const base=JSON.parse(await readFile('config/theme.json','utf8'));
 await expect(validateTheme(process.cwd(),{...base,...override})).rejects.toThrow(expected);
});
it('writes deterministic generated CSS only when changed',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-theme-'));
 try{
  for(const dir of ['src/styles','config','public'])await cp(dir,join(root,dir),{recursive:true});
  await prepareTheme(root);const file=join(root,'.generated/theme.css');const first=await stat(file);
  await prepareTheme(root);expect((await stat(file)).mtimeMs).toBe(first.mtimeMs);
  const config=JSON.parse(await readFile(join(root,'config/theme.json'),'utf8'));config.defaultMode='day';config.common={'--radius':'3px'};config.day={'--grain-opacity':'.06'};config.night={'--grain-opacity':'.02'};
  await writeFile(join(root,'config/theme.json'),JSON.stringify(config));await prepareTheme(root);
  const css=await readFile(file,'utf8');const heroRule=css.match(/\[data-motion-hero\]\{([^}]+)\}/)?.[1];
  expect(heroRule).toContain('--radius:3px');expect(heroRule).toContain('--grain-opacity:.02;');expect(heroRule).toContain('color-scheme:dark');expect(css).toContain('[data-theme-mode="night"],[data-motion-hero]');
  expect(css).toContain(':root,:root[data-mode="day"]');
 }finally{await rm(root,{recursive:true,force:true});}
});
it.each(presets)('can prepare both modes of the actual %s preset',async preset=>{
 const config=JSON.parse(await readFile('config/theme.json','utf8'));
 await expect(validateTheme(process.cwd(),{...config,preset})).resolves.toHaveProperty('modes');
});
it('rejects an unavailable display weight rather than synthesizing it',async()=>{
 const config=JSON.parse(await readFile('config/theme.json','utf8'));
 await expect(validateTheme(process.cwd(),{...config,common:{'--display-weight':'700'}})).rejects.toThrow('Marcellus 700');
});
it.each(['calc(', '"unclosed', 'var(--radius))', '[', '([)]', '"x\n"', '"x\r"', '"x\f"'])('rejects unbalanced CSS value %s',async value=>{
 const config=JSON.parse(await readFile('config/theme.json','utf8'));
 await expect(validateTheme(process.cwd(),{...config,common:{'--radius':value}})).rejects.toThrow('unbalanced CSS');
});
it('does not count an italic-only source as a normal display face',async()=>{
 const root=await mkdtemp(join(tmpdir(),'wiki-font-style-'));
 try{
  for(const dir of ['src/styles','config','public'])await cp(dir,join(root,dir),{recursive:true});
  await writeFile(join(root,'public/media/italic.woff2'),'font fixture');
  const config=JSON.parse(await readFile('config/theme.json','utf8'));
  await expect(validateTheme(root,{...config,common:{'--font-display':'"Local Italic", serif'},fonts:[{family:'Local Italic',src:'/media/italic.woff2',weight:400,style:'italic'}]})).rejects.toThrow('normal');
 }finally{await rm(root,{recursive:true,force:true});}
});

it.each(['a','b'])('validates both modes of sample %s using the same base',async sample=>{
 const config=JSON.parse(await readFile(`examples/site-${sample}/config/theme.json`,'utf8'));
 expect(config.preset).toBe('onimusha');
 await expect(validateTheme(process.cwd(),config)).resolves.toHaveProperty('modes');
});
