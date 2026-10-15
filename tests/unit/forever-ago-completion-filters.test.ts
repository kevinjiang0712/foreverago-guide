import {expect,it} from 'vitest';
import {completionEntries,restEntries} from '../../src/features/forever-ago/completion-data';
import {completionFilterSearch,defaultCompletionFilters,parseCompletionFilters} from '../../src/features/forever-ago/completion-filters';

it('restores a shared task search, road stop, type and progress from the URL',()=>{
  expect(parseCompletionFilters('?q=yellow+sofa&stop=gas-station&type=rest&progress=remaining',completionEntries)).toEqual({q:'yellow sofa',stop:'gas-station',type:'rest',progress:'remaining'});
  expect(parseCompletionFilters('?type=memory&progress=started',completionEntries).progress).toBe('started');
});

it('defaults unknown and unavailable choices and bounds search length',()=>{
  expect(parseCompletionFilters('?stop=unknown&type=unknown&progress=unknown',completionEntries)).toEqual(defaultCompletionFilters);
  expect(parseCompletionFilters('?stop=opening&type=memory&progress=started',restEntries)).toEqual(defaultCompletionFilters);
  expect(parseCompletionFilters(`?q=${'a'.repeat(300)}`,completionEntries).q).toHaveLength(120);
});

it('round trips filters without dropping unrelated query parameters and removes defaults',()=>{
  const filters={...defaultCompletionFilters,q:'Fun & Colors',stop:'gas-station' as const,type:'memory' as const,progress:'started' as const};
  const search=completionFilterSearch('?utm_source=guide',filters);
  expect(parseCompletionFilters(search,completionEntries)).toEqual(filters);
  expect(new URLSearchParams(search).get('utm_source')).toBe('guide');
  expect(completionFilterSearch(search,defaultCompletionFilters)).toBe('?utm_source=guide');
  expect(completionFilterSearch('?q=bench&type=rest',defaultCompletionFilters)).toBe('');
  expect(parseCompletionFilters(completionFilterSearch('',{...defaultCompletionFilters,q:'all'}),completionEntries).q).toBe('all');
});
