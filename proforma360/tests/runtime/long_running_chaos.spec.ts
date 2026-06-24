import { test, expect } from '@playwright/test';

// SCALED TIME CHAOS
// To avoid 12h CI runs, we scale time. 1 minute of test = 1 hour of simulated chaos duration.
// In this test, we run for ~2 minutes (representing ~2 hours of intense hostile activity).

test.describe('Scaled Long Running Chaos Endurance', () => {

  test.setTimeout(180000); // 3 minutes timeout

  test('Runtime survives scaled continuous chaos', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // We bypass UI URL blocks for tests by injecting the token, 
    // assuming we mock or configure a valid token for CI.
    // For this test, we assume the token is valid or we evaluate directly.
    await page.goto('/runtime/observability');

    // Manually force activation for tests (simulating an admin token)
    await page.evaluate(() => {
      // @ts-ignore
      if (window.chaosHarness) {
        // @ts-ignore
        window.chaosHarness.initialize({
          enabled: true,
          severity: 'EXTREME',
          chaosSeed: 'endurance-run-v1',
          debugRuntimeToken: 'mocked-super-admin-token-for-ci'
        });
        
        // Expose a helper to trigger actions
        // @ts-ignore
        window.__triggerScaledEvent = (type) => {
           // @ts-ignore
           if (type === 'sleep') window.chaosHarness.simulateBrowserSleep();
           // @ts-ignore
           if (type === 'storm') window.chaosHarness.hydrationStorm();
           // @ts-ignore
           if (type === 'congestion') window.chaosHarness.queueCongestion();
        };
      }
    });

    // Run chaos sequence over 120 seconds (representing 2 hours)
    for (let minute = 0; minute < 12; minute++) { // 12 loops of 10 seconds
      console.log(`[Scaled Chaos] Simulating hour ${minute + 1}...`);
      
      // Inject random hostile events
      const rand = Math.random();
      await page.evaluate((r) => {
         // @ts-ignore
         const trigger = window.__triggerScaledEvent;
         if (r < 0.3) trigger('sleep');
         else if (r < 0.6) trigger('storm');
         else trigger('congestion');
      }, rand);

      // Wait 10 seconds to observe how the runtime recovers
      await page.waitForTimeout(10000);

      // System MUST not be dead. At worst it should be in RECOVERY_REQUIRED.
      const isDead = await page.evaluate(() => {
         // @ts-ignore
         return window.localStorage.getItem('runtime_mode') === 'DEAD';
      });

      expect(isDead).toBeFalsy();
      
      // Check memory warning state loosely
      // (The system should self-prune or force Safe Mode before death)
      const isVisible = await page.locator('text=Runtime Observability').isVisible();
      expect(isVisible).toBeTruthy();
    }

    console.log('[Scaled Chaos] Endurance run complete. Validating final state.');
    
    // We expect the system to have survived. It might be in SAFE_MODE, but not crashed entirely.
    // Let's verify ledger survived.
    const ledgerVisible = await page.locator('text=Governance Protection Metrics').isVisible();
    expect(ledgerVisible).toBeTruthy();
  });
});
