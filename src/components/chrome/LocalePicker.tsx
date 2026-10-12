'use client';
import {Picker,type PickerOption} from '@/components/interactive/Picker';
import type {LocaleChoice} from '@/content/navigation';
import type {Dictionary} from '@/content/schemas/dictionary';
export function LocalePicker({locale,choices,labels,onNavigate}:{locale:string;choices:LocaleChoice[];labels:Pick<Dictionary['ui'],'language'|'close'|'untranslated'|'languageHome'>;onNavigate?:()=>void}){
 const options:PickerOption[]=choices.flatMap(choice=>choice.href?[{value:choice.locale,label:choice.label,href:choice.href}]:[{value:choice.locale,label:choice.label,description:labels.untranslated,disabled:true},{value:`${choice.locale}:home`,label:`${choice.label} · ${labels.languageHome}`,href:choice.homeHref}]);
 return <Picker label={labels.language} closeLabel={labels.close} value={locale} displayValue={locale.toUpperCase()} options={options} naked onNavigate={onNavigate}/>;
}
