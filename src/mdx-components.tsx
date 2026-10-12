import type {MDXComponents} from 'mdx/types';
export const baseMDXComponents:MDXComponents = {
  h2:props=><h2 className="wiki-h2" {...props}/>,h3:props=><h3 className="wiki-h3" {...props}/>,
  p:props=><p className="wiki-paragraph" {...props}/>,ul:props=><ul className="wiki-list" {...props}/>,ol:props=><ol className="wiki-list wiki-list-numbered" {...props}/>,
  table:props=><div className="wiki-table-scroll"><table className="data-table" {...props}/></div>,
};
export function useMDXComponents():MDXComponents{return baseMDXComponents;}
