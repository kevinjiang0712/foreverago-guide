import {prepareContent} from './prepare-content';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const index=await prepareContent(process.cwd(),{preview:process.env.SITE_ENV==='preview'});
console.log(`Content valid: ${Object.keys(index.routes).length} routes, ${Object.keys(index.pagesByKey).length} articles, ${Object.keys(index.records).length} records, ${index.site.locales.length} locales.`);
if(index.site.mode==='demo')console.log('Demo mode: all routes are noindex.');
