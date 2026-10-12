export type AdPlacement='a1-left'|'a1'|'a2'|'a3';

const formats:Record<AdPlacement,{format:'display'|'native';label:string}>={
 'a1-left':{format:'display',label:'A1-L · Display'},
 a1:{format:'display',label:'A1-R · Display'},
 a2:{format:'display',label:'A2 · Display'},
 a3:{format:'native',label:'A3 · Native'},
};

export function AdPlaceholder({placement,className=''}:{placement:AdPlacement;className?:string}){
 const {format,label}=formats[placement];
 const positionClass=placement.startsWith('a1')?'ad-placeholder--a1':`ad-placeholder--${placement}`;
 return <aside className={`ad-placeholder ${positionClass} ad-placeholder--${format}${className?` ${className}`:''}`} data-ad-placement={placement} data-ad-format={format} aria-label={`Advertisement · ${label}`}>
  <div className="ad-placeholder-canvas" aria-hidden="true">
   <span className="ad-placeholder-label">Advertisement</span>
   <span className="ad-placeholder-format">{label}</span>
   {format==='display'&&<span className="ad-placeholder-size"><span className="ad-placeholder-size-wide">728 × 90</span><span className="ad-placeholder-size-medium">468 × 60</span><span className="ad-placeholder-size-mobile">320 × 50</span><span className="ad-placeholder-size-rail">160 × 600</span></span>}
  </div>
 </aside>;
}
