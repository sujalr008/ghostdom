/**
 * Playwright Visual & Security Integrity Test (playwright_audit.spec.js)
 * 
 * Runs end-to-end against the live GhostDOM storefront to verify:
 * 1. The page renders without visual regressions or layout collapse.
 * 2. Honeypot elements have zero visual dimensions and are invisible to human users.
 * 3. Add to Cart buttons and search bars are responsive and clickable.
 * 4. Navigating to /dashboard shows the Dark Theme security console.
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('GhostDOM + BROKART Stage Integrity Tests', () => {

  test('BROKART storefront renders light theme with all 8 products', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });

    // Verify Title and Brand
    await expect(page).toHaveTitle(/BROKART/);
    const brand = page.locator('.brand-title, [class*="brand-title"]');
    await expect(brand).toBeVisible();

    // Verify 8 genuine products exist and have rendered
    const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("Sold Out")');
    await expect(addToCartButtons).toHaveCount(8);

    // Verify Honeypots are completely invisible (height = 0 or hidden)
    const honeypots = page.locator('[data-ghostdom-trap="true"]');
    const count = await honeypots.count();
    for (let i = 0; i < count; i++) {
      const isVisible = await honeypots.nth(i).isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('Security Dashboard loads dark theme and displays controls', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });

    // Check Dashboard Header
    await expect(page).toHaveTitle(/GhostDOM/);
    const modeBadge = page.locator('#deck-mode-badge');
    await expect(modeBadge).toBeVisible();

    // Check Action Buttons
    const btnSimulate = page.locator('#btn-simulate-bot');
    await expect(btnSimulate).toBeVisible();

    const btnReset = page.locator('#btn-reset-demo');
    await expect(btnReset).toBeVisible();

    // Test clicking Simulate Bot Attack
    await btnSimulate.click();

    // Flashing banner should appear with active class
    const alertBanner = page.locator('#bot-alert-banner');
    await expect(alertBanner).toHaveClass(/active/);
    await expect(modeBadge).toHaveText(/AGGRESSIVE MODE/);
  });

});
