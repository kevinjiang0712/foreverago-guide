import {defineConfig} from '@playwright/test';

export default defineConfig({
 testDir:'.',
 testMatch:'*.spec.ts',
 timeout:90000,
 expect:{timeout:10000},
 workers:2,
 outputDir:'../../.artifacts/release/browser',
 reporter:[['list'],['json',{outputFile:'../../.artifacts/release/e2e-results.json'}]],
 use:{baseURL:process.env.RELEASE_TEST_URL??'http://127.0.0.1:3189',trace:'retain-on-failure',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}},
});
