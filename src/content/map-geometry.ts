export type MapTransform={scale:number;x:number;y:number};
function finite(value:number,field:string){if(!Number.isFinite(value))throw new Error(`Map ${field} must be finite: ${value}`);}
function validTransform(current:MapTransform){for(const field of ['scale','x','y'] as const)finite(current[field],field);if(current.scale<=0)throw new Error(`Map scale must be positive: ${current.scale}`);}
export function zoomAtPoint(current:MapTransform,requestedScale:number,point:{x:number;y:number}):MapTransform{
 validTransform(current);finite(requestedScale,'requestedScale');finite(point.x,'point.x');finite(point.y,'point.y');
 const scale=Math.max(1,Math.min(4,requestedScale));const ratio=scale/current.scale;
 finite(ratio,`zoom ratio for scale ${current.scale}`);
 const result={scale,x:point.x-(point.x-current.x)*ratio,y:point.y-(point.y-current.y)*ratio};validTransform(result);return result;
}
export function clampToViewport(current:MapTransform,viewport:{width:number;height:number}):MapTransform{
 validTransform(current);for(const field of ['width','height'] as const){finite(viewport[field],field);if(viewport[field]<=0)throw new Error(`Map viewport ${field} must be positive: ${viewport[field]}`);}
 return {scale:current.scale,x:Math.min(0,Math.max(viewport.width*(1-current.scale),current.x)),y:Math.min(0,Math.max(viewport.height*(1-current.scale),current.y))};
}
