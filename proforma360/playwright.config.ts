import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/runtime',
  fullyParallel: false, // For causal tests we sometimes need deterministic execution order
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker prevents DB lock conflicts during strict multi-tab testing
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    baseURL: 'http://localhost:3000', // Assuming standard Next.js local port
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Focus only on Chromium for now since Web Locks are critical to test,
    // though Web Locks are supported in modern Safari/Firefox as well.
  ],
});
