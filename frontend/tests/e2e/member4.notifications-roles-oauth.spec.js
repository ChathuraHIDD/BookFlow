import { expect, test } from '@playwright/test';

import { jsonBody, mutationsEnabled, requestAs } from './support/api-helpers';

test.describe('Member 4 - Notifications + role management + OAuth integration', () => {
  test('notifications endpoints respond for authenticated user', async ({ request }) => {
    const listResponse = await requestAs(request, 'student', 'GET', '/api/notifications/me');
    expect(listResponse.status()).toBe(200);

    const unreadResponse = await requestAs(request, 'student', 'GET', '/api/notifications/me/unread-count');
    expect(unreadResponse.status()).toBe(200);

    const unreadBody = await jsonBody(unreadResponse);
    expect(typeof unreadBody?.count).toBe('number');
  });

  test('admin role management list endpoint works and rejects invalid role update', async ({ request }) => {
    const usersResponse = await requestAs(request, 'admin', 'GET', '/api/admin/users');
    expect(usersResponse.status()).toBe(200);

    const users = await jsonBody(usersResponse);
    expect(Array.isArray(users)).toBeTruthy();

    const targetUser = users.find((u) => String(u?.role || '').toUpperCase() !== 'ADMIN') || users[0];
    test.skip(!targetUser?.id, 'No users found for role management validation test');

    const invalidUpdateResponse = await requestAs(request, 'admin', 'PUT', `/api/admin/users/${targetUser.id}`, {
      data: {
        role: 'not-a-real-role',
      },
    });

    expect(invalidUpdateResponse.status()).toBe(400);
    const body = await jsonBody(invalidUpdateResponse);
    expect((body?.message || '').toLowerCase()).toContain('invalid role');
  });

  test('oauth endpoints validate missing Google token', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/google/login', {
      data: { idToken: '' },
    });
    expect(loginResponse.status()).toBe(400);

    const registerResponse = await request.post('/api/auth/google/register', {
      data: { idToken: '', role: 'student' },
    });
    expect(registerResponse.status()).toBe(400);
  });

  test('student can view profile and submit update requests', async ({ request }) => {
    test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run profile update tests');

    const profileResponse = await requestAs(request, 'student', 'GET', '/api/student/profile');
    expect(profileResponse.status()).toBe(200);

    const updateResponse = await requestAs(request, 'student', 'POST', '/api/student/profile/requests', {
      data: {
        fullName: 'Playwright Updated Name',
        email: `student_${Date.now()}@test.com`,
        telephone: '0711111111',
        campusYear: '3rd',
        semester: 2,
        center: 'Colombo Center',
        degreeProgram: 'IT',
      },
    });
    expect(updateResponse.status()).toBe(200);

    const listResponse = await requestAs(request, 'student', 'GET', '/api/student/profile/requests');
    expect(listResponse.status()).toBe(200);
    const requests = await jsonBody(listResponse);
    expect(Array.isArray(requests)).toBeTruthy();
    expect(requests.some((r) => r.fullName === 'Playwright Updated Name')).toBeTruthy();
  });
});
