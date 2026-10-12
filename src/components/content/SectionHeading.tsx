export function SectionHeading({eyebrow,title,description}:{eyebrow:string;title:string;description?:string}){
 return <div className="section-heading"><div className="section-label"><span aria-hidden="true"/>{eyebrow}</div><h2>{title}</h2>{description&&<p>{description}</p>}</div>;
}
