'use client';
import {useEffect} from 'react';
export function LegacyListAnchor({href,anchors,legacyAnchors,redirects={}}:{href:string;anchors:string[];legacyAnchors:readonly string[];redirects?:Record<string,string>}){
 useEffect(()=>{const redirect=()=>{const anchor=window.location.hash.slice(1);if(Object.hasOwn(redirects,anchor))window.location.replace(redirects[anchor]);else if(anchors.includes(anchor))window.location.replace(`${href}#${anchor}`);else if(legacyAnchors.includes(anchor)&&anchor!=='main'&&anchor!=='browse')window.location.replace(`${href}#article-body`);};redirect();window.addEventListener('hashchange',redirect);return()=>window.removeEventListener('hashchange',redirect);},[href,anchors,legacyAnchors,redirects]);
 return null;
}
