import type {ReactNode} from 'react';
export function Notice({tone='info',title,children}:{tone?:'info'|'warning'|'danger';title?:string;children:ReactNode}){
 return <aside className={`content-notice content-notice--${tone}`}>{title&&<strong>{title}</strong>}{children}</aside>;
}
