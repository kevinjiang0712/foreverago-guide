import {createRoot} from 'react-dom/client';
import {UpgradeExplorer} from '../../../src/components/interactive/UpgradeExplorer';
import type {WeaponExplorerRecord} from '../../../src/content/schemas/templates/weapon-explorer';
const nodes:WeaponExplorerRecord['treeNodes']=[];
for(let tier=1;tier<=3;tier++)for(let i=0;i<18;i++)nodes.push({id:`tier-${tier}-${i}`,parentId:tier===1?null:`tier-${tier-1}-0`,tier:tier as 1|2|3,label:`Demonstration node ${tier}.${i}`,details:'Layout fixture only.',verification:'unverified',iconAssetId:null});
createRoot(document.getElementById('catalogue-long-tree')!).render(<UpgradeExplorer nodes={nodes} notes={['Fixture one','Fixture two','Fixture three']} assets={{}} locale="en" labels={{tier:'Tier',empty:'Empty',select:'Select',weaponIcon:'Icon',unverified:'Unverified',partial:'Partial',confirmed:'Confirmed'}}/>);
