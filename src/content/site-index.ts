import generatedIndex from '../../.generated/content-index.json';
import {preparationError} from '../../.generated/preparation-error';
import type {ContentIndex} from './types';
export function getSiteIndex():ContentIndex{
  if(preparationError)throw new Error(`Content preparation failed:\n${preparationError}`);
  return generatedIndex as unknown as ContentIndex;
}
