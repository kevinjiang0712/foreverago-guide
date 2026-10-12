export function ArrowRightIcon({back=false,className=''}:{back?:boolean;className?:string}){
 return <span className={`ui-arrow-right${back?' ui-arrow-right--back':''}${className?` ${className}`:''}`} aria-hidden="true"/>;
}
