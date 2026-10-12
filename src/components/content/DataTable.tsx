import type {z} from 'zod';
import type {tableRecord} from '@/content/schemas/record';
export function DataTable({record,unknown}:{record:z.infer<typeof tableRecord>;unknown:string}){
 return <div className="wiki-table-scroll" tabIndex={0} role="region" aria-label={record.title}><table className="data-table"><caption className="visually-hidden">{record.title}</caption><thead><tr>{record.columns.map(column=><th key={column.id} scope="col">{column.label}</th>)}</tr></thead><tbody>{record.rows.map((row,i)=><tr key={i}>{record.columns.map(column=><td key={column.id}>{row[column.id]??unknown}</td>)}</tr>)}</tbody></table></div>;
}
