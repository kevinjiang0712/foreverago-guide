'use client';
import {createContext,useContext,useMemo,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import type {AdsConfig} from '@/content/schemas/ads';

type AdContextValue={ads:AdsConfig;path:string;production:boolean;tool:boolean};
export const AdContext=createContext<AdContextValue|null>(null);
export function AdProvider({ads,paths,production,children}:{ads:AdsConfig;paths:Record<string,{tool:boolean}>;production:boolean;children:ReactNode}){
 const path=usePathname();
 const route=paths[path];
 const value=useMemo(()=>({ads:route?ads:{...ads,mode:'disabled' as const},path,production,tool:route?.tool??false}),[ads,path,production,route]);
 return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}
export function useAds(){return useContext(AdContext);}
