import { test, expect } from '@playwright/test';

test.describe('Saumya Flow (E2E)', () => {
  test('Full Student Academic Hub Journey', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/);

    // 2. Kuppi Sessions
    await page.goto('/kuppi-sessions');
    await page.waitForTimeout(1000); // Wait for animations
    await expect(page.getByText('Kuppi Sessions')).toBeVisible();

    // Conductor Form
    await page.click('button:has-text("Join as a Kuppi Conductor")');
    await page.waitForTimeout(500);
    page.once('dialog', dialog => dialog.accept());
    await page.fill('input[placeholder*="Topic"]', 'Advanced React');
    await page.click('button:has-text("Submit Application")');
    await page.waitForTimeout(1000);

    // 3. Software Hub
    await page.goto('/software-hub');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Software Hub', { exact: true })).toBeVisible();
    await expect(page.getByText('VS Code')).toBeVisible();
    await page.click('text=VS Code');
    await expect(page.getByText('Get Software')).toBeVisible();
    await page.click('button:has-text("Close")');

    // 4. Group Chat
    await page.goto('/group-chat');
    await page.waitForTimeout(1000);
    await expect(page.getByText('Academic Group Chat')).toBeVisible();
    const msg = 'E2E ' + Date.now();
    await page.fill('input', msg);
    await page.keyboard.press('Enter');
    await expect(page.getByText(msg)).toBeVisible();

    // 5. AI Notes
    await page.goto('/ai-notes');
    await page.waitForTimeout(1000);
    await expect(page.getByText('AI Academic Notes')).toBeVisible();
    await page.click('button:has-text("Generate")');
    await page.waitForTimeout(1500);
    await expect(page.getByText('Summary')).toBeVisible();
  });
});
