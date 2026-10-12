import {Fragment,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {AdProvider} from '../../src/components/ads/AdProvider';
import {AdRails} from '../../src/components/ads/AdRails';
import {AdContentSlot} from '../../src/components/ads/AdContentSlot';
import {adsSchema} from '../../src/content/schemas/ads';
const ads=adsSchema.parse({mode:'adsterra',adsterra:{allowedHosts:['127.0.0.1'],units:{
 native:{containerId:'container-mock-native',scriptUrl:'https://ad-fixture.invalid/native.js'},
 left:{key:'mock-left',scriptUrl:'https://ad-fixture.invalid/left.js'},right:{key:'mock-right',scriptUrl:'https://ad-fixture.invalid/right.js'},
 inline:{key:'mock-inline',scriptUrl:'https://ad-fixture.invalid/inline.js'},anchor:{key:'mock-anchor',scriptUrl:'https://ad-fixture.invalid/anchor.js'},
}}});
const query=new URLSearchParams(location.search);
if(query.has('no-native'))delete ads.adsterra!.units.native;
if(query.has('wrong-host'))ads.adsterra!.allowedHosts=['other.example.org'];
const grid=query.get('grid');
const paths={'/__ad_runtime_fixture':{tool:false},'/second-fixture':{tool:false}};
function Fixture(){const [count,setCount]=useState(0);return <div data-site-shell><AdProvider ads={ads} paths={paths} production={!query.has('preview')}><header className="site-header" style={{height:60}}>Fixture navigation</header><button onClick={()=>setCount(count+1)}>Rerender {count}</button><button onClick={()=>{history.pushState({},'','/second-fixture');dispatchEvent(new PopStateEvent('popstate'));}}>Next page</button><AdRails/><main className={`container ${grid??''}`} style={{maxWidth:1240,margin:'0 auto',...(grid?{display:'grid',gridTemplateColumns:'1fr',gap:24}:{})}}>{grid?<>{Array.from({length:15},(_,i)=><Fragment key={i}><section style={{height:300}}>Card {i+1}</section>{i===5&&<AdContentSlot/>}{i===11&&<AdContentSlot slot="inline"/>}</Fragment>)}</>:<><section style={{height:100}}>First complete answer</section><AdContentSlot/><section style={{height:1800}}>Long independent content</section><AdContentSlot slot="inline"/></>}</main><footer className="site-footer" style={{height:200}}>Footer</footer></AdProvider></div>;}
createRoot(document.getElementById('root')!).render(<Fixture/>);
