import { expect, test } from '@playwright/test';

import { jsonBody, requestAs } from './support/api-helpers';

test.describe('Member 1 - Facilities catalogue + resource management endpoints', () => {
  test('admin can list facility buildings', async ({ request }) => {
    const response = await requestAs(request, 'admin', 'GET', '/api/admin/facilities/buildings');
    expect(response.status()).toBe(200);

    const body = await jsonBody(response);
    expect(Array.isArray(body)).toBeTruthy();

    if (body.length > 0) {
      expect(body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        code: expect.any(String),
      });
    }
  });

  test('student can list resources catalog', async ({ request }) => {
    const response = await requestAs(request, 'student', 'GET', '/api/student/resources');
    expect(response.status()).toBe(200);

    const body = await jsonBody(response);
    expect(Array.isArray(body)).toBeTruthy();

    if (body.length > 0) {
      expect(body[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
      });
    }
  });

  test('admin can list all resource booking requests', async ({ request }) => {
    const response = await requestAs(request, 'admin', 'GET', '/api/admin/resources/bookings');
    expect(response.status()).toBe(200);

    const body = await jsonBody(response);
    expect(Array.isArray(body)).toBeTruthy();

    if (body.length > 0) {
      expect(body[0]).toMatchObject({
        id: expect.any(String),
        resourceId: expect.any(String),
        status: expect.any(String),
      });
    }
  });

  test('admin can view facilities reports', async ({ request }) => {
    const response = await requestAs(request, 'admin', 'GET', '/api/admin/facilities/reports');
    expect(response.status()).toBe(200);

    const body = await jsonBody(response);
    expect(body).toMatchObject({
      totalBuildings: expect.any(Number),
      totalClassrooms: expect.any(Number),
      totalBookings: expect.any(Number),
      pendingBookings: expect.any(Number),
      unavailableClassrooms: expect.any(Number),
    });
  });
});
