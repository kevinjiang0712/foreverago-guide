export function mapProgressKey(siteId:string,mapId:string,dataVersion:string){return `${siteId}:map:${mapId}:${dataVersion}`;}
export function parseMapProgress(raw:string|null,collectibleIds:readonly string[]):Set<string>{
 if(raw===null)return new Set();
 let stored:unknown;
 try{stored=JSON.parse(raw);}catch(error){if(error instanceof SyntaxError)throw new Error(`Stored map progress is invalid JSON: ${raw}`);throw error;}
 if(!Array.isArray(stored))throw new Error(`Stored map progress must be an array of pin IDs: ${raw}`);
 const collected=new Set<string>();
 for(const id of stored){
  if(typeof id!=='string'||!collectibleIds.includes(id))throw new Error(`Stored map progress contains an unknown collectible pin ID: ${JSON.stringify(id)}`);
  if(collected.has(id))throw new Error(`Stored map progress contains a duplicate pin ID: ${id}`);
  collected.add(id);
 }
 return collected;
}
