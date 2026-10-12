import {createRoot} from 'react-dom/client';
import {Tabs} from '../../../src/components/interactive/Tabs';
import {Gallery} from '../../../src/components/interactive/Gallery';
const items=[{id:'same first',label:'First',content:<button>First panel control</button>},{id:'same second',label:'Second',content:<button>Second panel control</button>}];
const images=[{id:'first-image',src:null,width:1280,height:720,purpose:'First',alt:{en:'First artwork'},position:'50% 50%',demo:true},{id:'second-image',src:null,width:640,height:360,purpose:'Second',alt:{en:'Second artwork'},position:'50% 50%',demo:true}];
const gallery={locale:'en',label:'Artwork',emptyLabel:'No artwork supplied',selectLabel:'Select'};
createRoot(document.getElementById('root')!).render(<><section data-harness="first"><Tabs label="First instance" items={items}/></section><section data-harness="second"><Tabs label="Second instance" items={items} initialId="same second"/></section><section data-harness="empty"><Gallery {...gallery} images={[]}/></section><section data-harness="single"><Gallery {...gallery} images={[images[0]]}/></section><section data-harness="multiple"><Gallery {...gallery} images={images}/></section></>);
