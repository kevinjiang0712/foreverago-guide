import {describe,it,expect} from 'vitest';
import {hashFiles} from '../../scripts/framework-hash';
const bytes=(value:string)=>new TextEncoder().encode(value);
describe('framework file digest',()=>{
 it('is independent of enumeration order and does not mutate input',()=>{const files=[{path:'b',bytes:bytes('two')},{path:'a',bytes:bytes('one')}];expect(hashFiles(files)).toBe(hashFiles([...files].reverse()));expect(files[0].path).toBe('b');});
 it('detects changed bytes, renamed paths, additions and deletions',()=>{const source=[{path:'src/a',bytes:bytes('one')}];for(const changed of [[{path:'src/a',bytes:bytes('two')}],[{path:'src/b',bytes:bytes('one')}],[...source,{path:'src/b',bytes:bytes('two')}],[]])expect(hashFiles(changed)).not.toBe(hashFiles(source));});
 it('orders Unicode paths deterministically without locale collation ties',()=>{const files=[{path:'caf\u00e9',bytes:bytes('one')},{path:'cafe\u0301',bytes:bytes('two')}];expect(hashFiles(files)).toBe(hashFiles([...files].reverse()));});
 it('keeps file boundaries unambiguous',()=>{expect(hashFiles([{path:'a',bytes:bytes('bc')},{path:'d',bytes:bytes('e')}])).not.toBe(hashFiles([{path:'a',bytes:bytes('b')},{path:'cd',bytes:bytes('e')}]));});
});
