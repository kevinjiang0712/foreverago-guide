import {afterEach,describe,expect,it,vi} from 'vitest';
import {observeAdVisibility,recordAdStage} from '../../src/components/ads/ad-measurement';

afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});

describe('ad diagnostics',()=>{
 it('queues slot-specific diagnostics before analytics loads and never sends revenue or ad_impression',()=>{
  const tracker={dataLayer:[] as unknown[][],location:{origin:'https://www.foreverago-guide.wiki'}};vi.stubGlobal('window',tracker);
  recordAdStage('native','viewable','/guide/example');
  expect(tracker.dataLayer).toEqual([['event','ad_native_viewable',{ad_slot:'native',page_path:'/guide/example',page_location:'https://www.foreverago-guide.wiki/guide/example',ad_attempt:0,measurement_basis:'container_50pct_1s'}]]);
  const gtag=vi.fn();vi.stubGlobal('window',{gtag,location:tracker.location});recordAdStage('inline','script_error','/guide/example',2);
  expect(gtag).toHaveBeenCalledWith('event','ad_inline_script_error',expect.objectContaining({ad_attempt:2}));
 });
 it('requires one uninterrupted visible second, cancels on hidden tab, and reports once',()=>{
  vi.useFakeTimers();let intersection:(entries:{intersectionRatio:number}[])=>void=()=>{};
  const listeners=new Map<string,()=>void>();
  const document={visibilityState:'visible',addEventListener:(name:string,callback:()=>void)=>listeners.set(name,callback),removeEventListener:(name:string)=>listeners.delete(name)};
  const disconnect=vi.fn();vi.stubGlobal('document',document);
  vi.stubGlobal('IntersectionObserver',class{constructor(callback:typeof intersection){intersection=callback;}observe(){}disconnect=disconnect;});
  const report=vi.fn();const stop=observeAdVisibility({} as HTMLElement,report);
  intersection([{intersectionRatio:.6}]);vi.advanceTimersByTime(700);
  intersection([{intersectionRatio:.4}]);vi.advanceTimersByTime(1000);expect(report).not.toHaveBeenCalled();
  intersection([{intersectionRatio:1}]);vi.advanceTimersByTime(700);
  document.visibilityState='hidden';listeners.get('visibilitychange')!();vi.advanceTimersByTime(1000);expect(report).not.toHaveBeenCalled();
  document.visibilityState='visible';listeners.get('visibilitychange')!();vi.advanceTimersByTime(1000);expect(report).toHaveBeenCalledTimes(1);
  intersection([{intersectionRatio:1}]);vi.advanceTimersByTime(2000);expect(report).toHaveBeenCalledTimes(1);
  stop();expect(disconnect).toHaveBeenCalledOnce();expect(listeners.size).toBe(0);
 });
});
