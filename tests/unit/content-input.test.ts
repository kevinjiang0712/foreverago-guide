import { mkdtemp, cp, readFile, writeFile, rm, rename, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { readSite } from '../../src/content/read-site';
import { formatContentIssue } from '../../src/content/issues';
const roots: string[] = [];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'wiki-input-')); roots.push(root);
  for (const dir of ['config', 'content', 'public']) await cp(join('tests/fixtures/input/site',dir), join(root, dir), { recursive: true });
  return root;
}
async function change(root: string, name: string, mutate: (value: Record<string, unknown>) => void) {
  const path = join(root, name); const value = JSON.parse(await readFile(path, 'utf8')); mutate(value);
  await writeFile(path, JSON.stringify(value));
}
const article = (extra = '') => `---\nid: first-steps\nlocale: en\nslug: first-steps\ncategory: guides\ntemplate: wiki-page\nguide: {eyebrow: Chapter, title: Start, stats: [{label: Time, value: null}], table: null, route: null}\ntitle: Getting started\ndescription: Demonstration guide.\nstatus: published\ndemo: true\n${extra}---\n## Before you start\nThis is fictional demonstration content.\n`;
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
describe('site input boundary', () => {
  it('reads both enabled languages and detects a newly added MDX file', async () => {
    const root = await fixture();
    expect((await readSite(root)).homes).toHaveLength(2);
    await writeFile(join(root, 'content/en/pages/first-steps.mdx'), article());
    expect((await readSite(root)).pages.map(page => page.id)).toContain('first-steps');
  });
  it('includes author-editable location and rejected value', () => {
    expect(formatContentIssue({ file:'content/ja/pages/first-steps.mdx', field:'locale', value:'en', message:'expected ja' }))
      .toBe('content/ja/pages/first-steps.mdx :: locale = "en" :: expected ja');
  });
  it.each([
    ['slug', 'bad/path', 'slug: first-steps'],
    ['template', 'magic', 'template: wiki-page'],
    ['description', '', 'description: Demonstration guide.'],
    ['publishedAt', '2026-02-30', null],
  ])('rejects invalid %s with file field and value', async (field, value, replace) => {
    const root = await fixture(); const path = 'content/en/pages/first-steps.mdx';
    const source = replace ? article().replace(replace, `${field}: "${value}"`) : article(`${field}: "${value}"\n`);
    await writeFile(join(root, path), source);
    await expect(readSite(root)).rejects.toThrow(new RegExp(`${path}.*${field}.*${value}`));
  });
  it('rejects mismatched locale and duplicate IDs in different files', async () => {
    const root = await fixture();
    await writeFile(join(root, 'content/ja/pages/wrong.mdx'), article());
    await expect(readSite(root)).rejects.toThrow(/content\/ja\/pages\/wrong.mdx.*locale.*en.*ja/);
    await rm(join(root, 'content/ja/pages/wrong.mdx'));
    await writeFile(join(root, 'content/en/pages/one.mdx'), article());
    await writeFile(join(root, 'content/en/pages/two.mdx'), article());
    await expect(readSite(root)).rejects.toThrow(/two.mdx.*id.*first-steps.*duplicate/);
  });
  it('accepts a real unquoted YAML date without normalizing invalid dates', async () => {
    const root=await fixture(); await writeFile(join(root,'content/en/pages/one.mdx'),article('publishedAt: 2026-09-16\n'));
    expect((await readSite(root)).pages[0].publishedAt).toBe('2026-09-16');
  });
  it('rejects undeclared language folders rather than silently skipping new articles', async () => {
    const root=await fixture(); await cp(join(root,'content/en'),join(root,'content/fr'),{recursive:true});
    await expect(readSite(root)).rejects.toThrow('content/fr :: locale = "fr" :: locale is not enabled in config/site.json');
  });
  it('rejects unknown category', async () => {
    const root = await fixture(); await writeFile(join(root, 'content/en/pages/one.mdx'), article().replace('category: guides','category: missing'));
    await expect(readSite(root)).rejects.toThrow(/one.mdx.*category.*missing/);
  });
  it.each(['content/ja/home.json','content/locales/ja.json'])('requires %s', async path => {
    const root = await fixture(); await rm(join(root,path));
    await expect(readSite(root)).rejects.toThrow(`${path} :: file = null :: required file is missing`);
  });
  it('requires translated UI keys without language fallback', async () => {
    const root = await fixture(); await change(root,'content/locales/ja.json', dictionary => { delete (dictionary.ui as Record<string,unknown>).close; });
    await expect(readSite(root)).rejects.toThrow(/content\/locales\/ja.json.*ui.close/);
  });
  it('rejects unknown config fields', async () => {
    const root = await fixture(); await change(root,'config/site.json', site => { site.randomSetting = 8; });
    await expect(readSite(root)).rejects.toThrow('config/site.json :: randomSetting = 8 :: unrecognized key');
  });
  it('rejects missing image dimensions', async () => {
    const root = await fixture(); const file=join(root,'content/assets.json');
    const assets=JSON.parse(await readFile(file,'utf8')); delete assets[0].width; await writeFile(file,JSON.stringify(assets));
    await expect(readSite(root)).rejects.toThrow(/content\/assets.json.*width/);
  });
});

it('rejects misspelled language subdirectories',async()=>{
 const root=await fixture();await rename(join(root,'content/en/pages'),join(root,'content/en/page'));
 await expect(readSite(root)).rejects.toThrow('content/en/page :: entry = "page" :: expected home.json, pages, or records');
});
it('rejects symlinks at content scanning roots',async()=>{
 const root=await fixture();await rm(join(root,'content/en/pages'),{recursive:true});await symlink(join(root,'content/ja/pages'),join(root,'content/en/pages'));
 await expect(readSite(root)).rejects.toThrow(/content\/en\/pages.*symlink/);
});
it('locates a missing media asset in its authoring file',async()=>{
 const root=await fixture();const path=join(root,'content/assets.json');const assets=JSON.parse(await readFile(path,'utf8'));
 assets[0].src='/media/nonexistent.png';await writeFile(path,JSON.stringify(assets));
 await expect(readSite(root)).rejects.toThrow('content/assets.json :: hero.src = "/media/nonexistent.png" :: media file does not exist');
});
it('rejects script URLs in author metadata',async()=>{
 const root=await fixture();await writeFile(join(root,'content/en/pages/one.mdx'),article('author:\n  name: Author\n  url: javascript:alert(1)\n'));
 await expect(readSite(root)).rejects.toThrow(/one.mdx.*author.url.*javascript/);
});
