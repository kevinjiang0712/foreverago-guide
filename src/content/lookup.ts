/** IDs are content-controlled strings; inherited Object properties are never entries. */
export function lookup<T>(entries:Record<string,T>,id:string):T|undefined {
  return Object.hasOwn(entries,id)?entries[id]:undefined;
}
export function indexBy<T>(entries:Iterable<readonly [string,T]>):Record<string,T> {
  return Object.assign(Object.create(null) as Record<string,T>,Object.fromEntries(entries));
}
