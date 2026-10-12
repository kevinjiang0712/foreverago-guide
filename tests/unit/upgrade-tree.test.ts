import {describe,it,expect} from 'vitest';
import {validateUpgradeTree,upgradeChildren,selectUpgradeNode,type UpgradeNode} from '../../src/content/upgrade-tree';
const nodes:UpgradeNode[]=[{id:'first',parentId:null,tier:1},{id:'second',parentId:null,tier:1},{id:'branch',parentId:'first',tier:2},{id:'leaf',parentId:'branch',tier:3}];
describe('three-level upgrade choices',()=>{
 it('accepts independent roots and empty child branches',()=>{expect(()=>validateUpgradeTree(nodes)).not.toThrow();expect(upgradeChildren(nodes,'second')).toEqual([]);expect(upgradeChildren(nodes,null).map(node=>node.id)).toEqual(['first','second']);});
 it('rejects duplicate IDs and missing parents',()=>{expect(()=>validateUpgradeTree([...nodes,nodes[0]])).toThrow(/duplicate.*first/);expect(()=>validateUpgradeTree([{id:'lost',parentId:'missing',tier:2}])).toThrow(/lost.*missing/);});
 it('rejects a cycle even when all referenced IDs exist',()=>{expect(()=>validateUpgradeTree([{id:'a',parentId:'b',tier:1},{id:'b',parentId:'a',tier:2}])).toThrow(/cycle/);});
 it('rejects a fourth level and skipped tiers',()=>{expect(()=>validateUpgradeTree([...nodes,{id:'fourth',parentId:'leaf',tier:4} as unknown as UpgradeNode])).toThrow(/fourth.*4/);expect(()=>validateUpgradeTree([{id:'a',parentId:null,tier:1},{id:'b',parentId:'a',tier:3}])).toThrow(/b.*tier/);});
 it('clears downstream choices on every parent selection',()=>{const selected={tier1:'first',tier2:'branch',tier3:'leaf'};expect(selectUpgradeNode(nodes,selected,'second')).toEqual({tier1:'second',tier2:null,tier3:null});expect(selectUpgradeNode(nodes,selected,'branch')).toEqual({tier1:'first',tier2:'branch',tier3:null});expect(selected.tier3).toBe('leaf');});
 it('rejects a stale secondary selection from another root',()=>{expect(()=>selectUpgradeNode(nodes,{tier1:'second',tier2:'branch',tier3:null},'leaf')).toThrow(/branch/);});
 it('rejects selection from a different branch and unknown IDs',()=>{const selected={tier1:'second',tier2:null,tier3:null};expect(()=>selectUpgradeNode(nodes,selected,'branch')).toThrow(/branch.*parent/);expect(()=>selectUpgradeNode(nodes,selected,'missing')).toThrow(/missing/);});
});
