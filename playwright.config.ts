import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
 testDir: './tests/browser',
 workers: 2,
 webServer: process.env.TEST_BASE_URL ? undefined : {
  command: 'npx tsx scripts/serve-test-site.ts --port 3199',
  url: 'http://127.0.0.1:3199',
  timeout: 180000,
  reuseExistingServer: false,
  gracefulShutdown: {signal:'SIGTERM',timeout:15000},
 },
 use: { baseURL: process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3199', trace: 'retain-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } },
 projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
