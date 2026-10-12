import {createRoot} from 'react-dom/client';
import {useSyncExternalStore} from 'react';
import {SiteNavigation} from '../../../src/components/chrome/SiteNavigation';

function subscribe(change:()=>void){const query=matchMedia('(max-width:767px)');query.addEventListener('change',change);return()=>query.removeEventListener('change',change);}
const items=Array.from({length:8},(_,i)=>({id:`menu-${i}`,label:'W'.repeat(14),href:`/nav-fixture-${i}`,current:false,children:Array.from({length:10},(_,j)=>({id:`child-${i}-${j}`,label:'W'.repeat(28),href:`/nav-fixture-${i}-${j}`}))}));
function NavigationBoundary(){
 const mobile=useSyncExternalStore(subscribe,()=>matchMedia('(max-width:767px)').matches,()=>false);
 return <header className="site-header" data-nav-form={mobile?'burger':'inline'} data-hidden="false" onClick={event=>event.preventDefault()}>
  <div className="site-header-bar"><div className="site-nav-body" data-open="true"><SiteNavigation items={items} mobile={mobile} label="Boundary menu" currentLabel="Current" unavailableLabel="Unavailable" previousLabel="Previous" nextLabel="Next" onNavigate={()=>document.documentElement.setAttribute('data-boundary-navigated','true')}/></div></div>
 </header>;
}
createRoot(document.getElementById('navigation-boundary')!).render(<NavigationBoundary/>);
