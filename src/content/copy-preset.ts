export async function copyPreset(code:string):Promise<void>{if(!navigator.clipboard?.writeText)throw new Error('Clipboard writeText is unavailable');await navigator.clipboard.writeText(code);}
