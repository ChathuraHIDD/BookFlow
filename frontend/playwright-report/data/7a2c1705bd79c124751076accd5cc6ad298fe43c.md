# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: saumya.spec.js >> Saumya Flow (E2E) >> Full Student Academic Hub Journey
- Location: tests/e2e/saumya.spec.js:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder*="Topic"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "NNIC logo" [ref=e5] [cursor=pointer]:
        - /url: /
        - img "NNIC logo" [ref=e6]
      - generic [ref=e7]:
        - link "Student Dashboard" [ref=e8] [cursor=pointer]:
          - /url: /student/dashboard
        - link "Student Profile" [ref=e9] [cursor=pointer]:
          - /url: /student/profile
        - link "Notifications" [ref=e10] [cursor=pointer]:
          - /url: /notifications
        - link "Support" [ref=e11] [cursor=pointer]:
          - /url: /student/support
        - link "Kuppi" [ref=e12] [cursor=pointer]:
          - /url: /kuppi-sessions
        - link "Software" [ref=e13] [cursor=pointer]:
          - /url: /software-hub
        - link "Chat" [ref=e14] [cursor=pointer]:
          - /url: /group-chat
        - link "AI Notes" [ref=e15] [cursor=pointer]:
          - /url: /ai-notes
        - button "Logout" [ref=e16] [cursor=pointer]
    - main [ref=e17]:
      - generic [ref=e18]:
        - heading "Kuppi Sessions" [level=1] [ref=e19]
        - paragraph [ref=e20]: Peer-to-peer teaching and academic support community.
      - generic [ref=e22]:
        - generic [ref=e23]:
          - heading "Peer Learning Hub" [level=2] [ref=e24]
          - paragraph [ref=e25]: Join student-led "Kuppi" sessions to master complex topics or apply to become a conductor and share your expertise.
          - button "Join as a Kuppi Conductor" [active] [ref=e26] [cursor=pointer]
        - generic [ref=e27]:
          - generic [ref=e29]:
            - heading "Active Sessions" [level=3] [ref=e30]
            - paragraph [ref=e31]: Upcoming peer-teaching sessions across all departments.
          - generic [ref=e32]:
            - article [ref=e33]:
              - generic [ref=e35]: ITDatabase
              - heading "DBMS Discussion" [level=4] [ref=e36]
              - generic [ref=e37]:
                - generic [ref=e38]:
                  - text: 👨‍🏫
                  - strong [ref=e39]: Saumya Perera
                - generic [ref=e40]: ⏰ Tomorrow, 10:00 AM
                - generic [ref=e41]: 📍 Online
              - button "Remind Me" [ref=e42] [cursor=pointer]
            - article [ref=e43]:
              - generic [ref=e45]: ITAlgorithms
              - heading "Algorithms Deep Dive" [level=4] [ref=e46]
              - generic [ref=e47]:
                - generic [ref=e48]:
                  - text: 👨‍🏫
                  - strong [ref=e49]: Imesh Harshana
                - generic [ref=e50]: ⏰ Friday, 2:00 PM
                - generic [ref=e51]: 📍 Library Lab 01
              - button "Remind Me" [ref=e52] [cursor=pointer]
            - article [ref=e53]:
              - generic [ref=e55]: LawGeneral
              - heading "Business Law Basics" [level=4] [ref=e56]
              - generic [ref=e57]:
                - generic [ref=e58]:
                  - text: 👨‍🏫
                  - strong [ref=e59]: Nethmi Silva
                - generic [ref=e60]: ⏰ Monday, 9:00 AM
                - generic [ref=e61]: 📍 Lecture Hall A
              - button "Remind Me" [ref=e62] [cursor=pointer]
  - complementary [ref=e64]:
    - generic [ref=e65]:
      - generic [ref=e66]:
        - paragraph [ref=e67]: Academic Contribution
        - heading "Conductor Application" [level=3] [ref=e68]
      - button "Close" [ref=e69] [cursor=pointer]
    - generic [ref=e70]:
      - generic [ref=e71]:
        - text: Full Name
        - textbox "Full Name" [ref=e72]:
          - /placeholder: Your full name
      - generic [ref=e73]:
        - text: Subject Area
        - combobox "Subject Area" [ref=e74]:
          - option "Information Technology" [selected]
          - option "Business Studies"
          - option "Law"
      - generic [ref=e75]:
        - text: Why do you want to conduct?
        - textbox "Why do you want to conduct?" [ref=e76]:
          - /placeholder: Describe your experience or motivation...
      - generic [ref=e77]:
        - button "Submit Application" [ref=e78] [cursor=pointer]
        - button "Cancel" [ref=e79] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Saumya Flow (E2E)', () => {
  4  |   test('Full Student Academic Hub Journey', async ({ page }) => {
  5  |     // 1. Login
  6  |     await page.goto('/login');
  7  |     await page.fill('input[type="email"]', 'student@test.com');
  8  |     await page.fill('input[type="password"]', '123456');
  9  |     await page.click('button[type="submit"]');
  10 |     await page.waitForURL(/.*dashboard/);
  11 | 
  12 |     // 2. Kuppi Sessions
  13 |     await page.goto('/kuppi-sessions');
  14 |     await page.waitForTimeout(1000); // Wait for animations
  15 |     await expect(page.getByText('Kuppi Sessions')).toBeVisible();
  16 | 
  17 |     // Conductor Form
  18 |     await page.click('button:has-text("Join as a Kuppi Conductor")');
  19 |     await page.waitForTimeout(500);
  20 |     page.once('dialog', dialog => dialog.accept());
> 21 |     await page.fill('input[placeholder*="Topic"]', 'Advanced React');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  22 |     await page.click('button:has-text("Submit Application")');
  23 |     await page.waitForTimeout(1000);
  24 | 
  25 |     // 3. Software Hub
  26 |     await page.goto('/software-hub');
  27 |     await page.waitForTimeout(1000);
  28 |     await expect(page.getByText('Software Hub', { exact: true })).toBeVisible();
  29 |     await expect(page.getByText('VS Code')).toBeVisible();
  30 |     await page.click('text=VS Code');
  31 |     await expect(page.getByText('Get Software')).toBeVisible();
  32 |     await page.click('button:has-text("Close")');
  33 | 
  34 |     // 4. Group Chat
  35 |     await page.goto('/group-chat');
  36 |     await page.waitForTimeout(1000);
  37 |     await expect(page.getByText('Academic Group Chat')).toBeVisible();
  38 |     const msg = 'E2E ' + Date.now();
  39 |     await page.fill('input', msg);
  40 |     await page.keyboard.press('Enter');
  41 |     await expect(page.getByText(msg)).toBeVisible();
  42 | 
  43 |     // 5. AI Notes
  44 |     await page.goto('/ai-notes');
  45 |     await page.waitForTimeout(1000);
  46 |     await expect(page.getByText('AI Academic Notes')).toBeVisible();
  47 |     await page.click('button:has-text("Generate")');
  48 |     await page.waitForTimeout(1500);
  49 |     await expect(page.getByText('Summary')).toBeVisible();
  50 |   });
  51 | });
  52 | 
```