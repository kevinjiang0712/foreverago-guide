export function modTrackingKey(siteId:string,modId:string,dataVersion:string){return `${siteId}:mod:${modId}:${encodeURIComponent(dataVersion)}`;}
export function readModTracking(storage:Pick<Storage,'getItem'>,key:string):boolean{
 const raw=storage.getItem(key);if(raw===null)return false;
 let value:unknown;try{value=JSON.parse(raw);}catch{throw new Error(`Invalid mod tracking JSON at ${key}`);}
 if(typeof value!=='boolean')throw new Error(`Invalid mod tracking value at ${key}: expected boolean`);return value;
}
export function writeModTracking(storage:Pick<Storage,'setItem'>,key:string,tracked:boolean){storage.setItem(key,JSON.stringify(tracked));}
