import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {MapViewport} from '../../../src/components/interactive/MapViewport';
import {interactiveMapRecord} from '../../../src/content/schemas/templates/interactive-map';
import {dictionarySchema} from '../../../src/content/schemas/dictionary';
import {disabledAds} from '../../../src/content/schemas/ads';
import record from '../template-records/maps/interactive-map.json';
import dictionary from '../input/site/content/locales/en.json';
import '../../../src/styles/core/base.css';
import '../../../src/templates/interactive-map/interactive-map.css';
const labels=dictionarySchema.parse(dictionary).ui;
const longDescription=Array.from({length:45},(_,i)=>`Demonstration detail paragraph ${i+1}. This is supplied test content, not game evidence.`).join(' ')+' END OF COMPLETE PIN DESCRIPTION.';
const known=interactiveMapRecord.parse({...record,pins:record.pins.map((pin,i)=>i===0&&new URL(location.href).searchParams.has('long')?{...pin,description:longDescription}:pin),knownTotal:3,regions:[...record.regions.map((region,i)=>({...region,knownTotal:i===0?2:1})),{...record.regions[0],id:'held-region',label:'Held region',disabled:true,knownTotal:null}]});
function Fixture(){const [siteId,setSiteId]=useState('isolated-a');return <><button onClick={()=>setSiteId(siteId==='isolated-a'?'isolated-b':'isolated-a')} data-switch-site>{siteId}</button><main className="map-main" style={{maxWidth:1000,margin:'0 auto'}}><MapViewport key={siteId} record={known} labels={labels} siteId={siteId} regionImages={{}} progressImage={null} pinLinks={{}} ads={disabledAds}/></main></>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
