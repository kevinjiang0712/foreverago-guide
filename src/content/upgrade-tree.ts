export type UpgradeNode={id:string;parentId:string|null;tier:1|2|3};
export type UpgradeSelection={tier1:string|null;tier2:string|null;tier3:string|null};
export function validateUpgradeTree(nodes:UpgradeNode[]){
 const byId=new Map<string,UpgradeNode>();
 for(const node of nodes){if(byId.has(node.id))throw new Error(`Upgrade tree duplicate ID: ${node.id}`);byId.set(node.id,node);if(![1,2,3].includes(node.tier))throw new Error(`Upgrade ${node.id} has unsupported tier ${node.tier}; maximum is 3`);}
 for(const node of nodes){if(node.parentId!==null&&!byId.has(node.parentId))throw new Error(`Upgrade ${node.id} has missing parent ${node.parentId}`);}
 for(const node of nodes){const chain=new Set<string>();let ancestor:UpgradeNode|undefined=node;while(ancestor){if(chain.has(ancestor.id))throw new Error(`Upgrade tree cycle at ${ancestor.id}`);chain.add(ancestor.id);ancestor=ancestor.parentId===null?undefined:byId.get(ancestor.parentId);}}
 for(const node of nodes){const expected=node.parentId===null?1:byId.get(node.parentId)!.tier+1;if(node.tier!==expected)throw new Error(`Upgrade ${node.id} has tier ${node.tier}; expected tier ${expected} after parent ${node.parentId}`);}
}
export function upgradeChildren<T extends UpgradeNode>(nodes:T[],parentId:string|null):T[]{return nodes.filter(node=>node.parentId===parentId);}
export function selectUpgradeNode(nodes:UpgradeNode[],selected:UpgradeSelection,id:string):UpgradeSelection{
 const node=nodes.find(node=>node.id===id);if(!node)throw new Error(`Unknown upgrade node: ${id}`);
 if(node.tier===1)return {tier1:id,tier2:null,tier3:null};
 if(node.tier===3){const branch=nodes.find(entry=>entry.id===selected.tier2);if(!branch||branch.tier!==2||branch.parentId!==selected.tier1)throw new Error(`Upgrade ${id}: stale branch ${selected.tier2} does not belong to root ${selected.tier1}`);}
 const expectedParent=node.tier===2?selected.tier1:selected.tier2;
 if(node.parentId!==expectedParent)throw new Error(`Upgrade ${id} belongs to parent ${node.parentId}, not selected parent ${expectedParent}`);
 return node.tier===2?{tier1:selected.tier1,tier2:id,tier3:null}:{...selected,tier3:id};
}
