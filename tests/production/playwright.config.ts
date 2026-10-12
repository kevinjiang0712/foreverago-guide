import {defineConfig} from '@playwright/test';
if(!process.env.PRODUCTION_TEST_URL)throw new Error('Run npm run verify:production to start the isolated production fixture.');
export default defineConfig({testDir:'.',testMatch:'seo.spec.ts',outputDir:process.env.PRODUCTION_TEST_OUTPUT,use:{baseURL:process.env.PRODUCTION_TEST_URL,launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}},reporter:[['list'],['json',{outputFile:process.env.PRODUCTION_TEST_REPORT}]]});
