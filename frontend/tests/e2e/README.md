Playwright API E2E suites for team-member-wise testing.

HTML report behavior
- The Playwright HTML report auto-opens in a separate browser page after test runs.
- Report output folder: playwright-report/

Environment variables
- E2E_BASE_URL: Backend URL (default http://localhost:8080)
- E2E_ALLOW_MUTATIONS: true/1 to enable create/update conflict flow tests
- E2E_ADMIN_TOKEN or E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD
- E2E_STUDENT_TOKEN or E2E_STUDENT_EMAIL + E2E_STUDENT_PASSWORD
- E2E_TECHNICIAN_TOKEN or E2E_TECHNICIAN_EMAIL + E2E_TECHNICIAN_PASSWORD

Install
1. npm install
2. npx playwright install chromium

Run all
- npm run test:e2e
- npm run test:e2e:report

Run one-by-one
- npm run test:e2e:member1
- npm run test:e2e:member2
- npm run test:e2e:member3
- npm run test:e2e:member4

Run one-by-one with auto-open report
- npm run test:e2e:member1:report
- npm run test:e2e:member2:report
- npm run test:e2e:member3:report
- npm run test:e2e:member4:report

One-command run: start backend + run tests + open report
- npm run test:e2e:boot
- npm run test:e2e:member1:boot
- npm run test:e2e:member2:boot
- npm run test:e2e:member3:boot
- npm run test:e2e:member4:boot

Notes
- These commands start Spring Boot automatically and wait for /api/health.
- Backend logs are written to .e2e-backend.log in frontend/.
- Report stays open until you press Ctrl+C, then backend is stopped automatically.
