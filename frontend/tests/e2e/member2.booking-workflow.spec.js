import { expect, test } from '@playwright/test';

import { isoDateOffset, jsonBody, mutationsEnabled, requestAs } from './support/api-helpers';

async function pickFirstClassroom(request) {
  const overviewResponse = await requestAs(request, 'student', 'GET', '/api/student/facilities');
  expect(overviewResponse.status()).toBe(200);

  const overview = await jsonBody(overviewResponse);
  const building = overview?.buildings?.[0];
  if (!building?.id) {
    return null;
  }

  const floorsResponse = await requestAs(
    request,
    'student',
    'GET',
    `/api/student/facilities/buildings/${building.id}/floors`,
  );
  expect(floorsResponse.status()).toBe(200);

  const floors = await jsonBody(floorsResponse);
  const floor = floors?.[0];
  if (!floor) {
    return null;
  }

  const classroomsResponse = await requestAs(
    request,
    'student',
    'GET',
    `/api/student/facilities/buildings/${building.id}/floors/${floor.floorNumber}/classrooms`,
  );
  expect(classroomsResponse.status()).toBe(200);

  const classrooms = await jsonBody(classroomsResponse);
  const availableClassrooms = (classrooms || []).filter(c => c.operationalStatus === 'AVAILABLE');
  return availableClassrooms?.[0] || null;
}

async function pickFirstResource(request) {
  const resourcesResponse = await requestAs(request, 'student', 'GET', '/api/student/resources');
  expect(resourcesResponse.status()).toBe(200);

  const resources = await jsonBody(resourcesResponse);
  return resources?.[0] || null;
}

test.describe('Member 2 - Booking workflow + conflict checking', () => {
  test('student can view own booking workflows', async ({ request }) => {
    const facilityBookings = await requestAs(request, 'student', 'GET', '/api/student/facilities/bookings');
    expect(facilityBookings.status()).toBe(200);

    const resourceBookings = await requestAs(request, 'student', 'GET', '/api/student/resources/bookings');
    expect(resourceBookings.status()).toBe(200);
  });

  test('facility booking conflict returns validation error on overlapping booking', async ({ request }) => {
    test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run conflict creation tests');

    const classroom = await pickFirstClassroom(request);
    test.skip(!classroom?.id, 'No classroom data available to run facility conflict test');

    const bookingDate = isoDateOffset(Math.floor(Math.random() * 20) + 5);
    const startTime = '20:00';
    const endTime = '21:00';

    const seat = Math.floor(Math.random() * 20) + 1;
    const firstResponse = await requestAs(request, 'student', 'POST', '/api/student/facilities/bookings', {
      data: {
        classroomId: classroom.id,
        bookingDate,
        startTime,
        endTime,
        selectedSeats: classroom.seatSelectionEnabled ? [seat] : [],
        purpose: 'Playwright conflict baseline',
        priority: 'medium',
      },
    });
    expect(firstResponse.status()).toBe(200);

    const secondResponse = await requestAs(request, 'student', 'POST', '/api/student/facilities/bookings', {
      data: {
        classroomId: classroom.id,
        bookingDate,
        startTime: '20:15',
        endTime: '20:45',
        selectedSeats: classroom.seatSelectionEnabled ? [seat] : [],
        purpose: 'Playwright overlap check',
        priority: 'medium',
      },
    });

    expect(secondResponse.status()).toBe(400);
    const secondBody = await jsonBody(secondResponse);
    expect(secondBody?.message || '').not.toEqual('');
  });

  test('resource booking conflict returns validation error on overlapping booking', async ({ request }) => {
    test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run conflict creation tests');

    const resource = await pickFirstResource(request);
    test.skip(!resource?.id, 'No resource data available to run resource conflict test');

    const bookingDate = isoDateOffset(Math.floor(Math.random() * 20) + 5);
    const startTime = '18:00';
    const endTime = '19:00';

    const firstResponse = await requestAs(request, 'student', 'POST', '/api/student/resources/bookings', {
      data: {
        resourceId: resource.id,
        bookingDate,
        startTime,
        endTime,
      },
    });
    expect(firstResponse.status()).toBe(200);

    // Wait for DB consistency (MongoDB Atlas)
    await new Promise(resolve => setTimeout(resolve, 1500));

    const secondResponse = await requestAs(request, 'student', 'POST', '/api/student/resources/bookings', {
      data: {
        resourceId: resource.id,
        bookingDate,
        startTime: '18:15',
        endTime: '18:45',
      },
    });

    expect(secondResponse.status()).toBe(400);
    const secondBody = await jsonBody(secondResponse);
    expect((secondBody?.message || '').toLowerCase()).toContain('booked');
  });

  test('admin can list all bookings and update status', async ({ request }) => {
    test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run admin update tests');

    const response = await requestAs(request, 'admin', 'GET', '/api/admin/facilities/bookings');
    expect(response.status()).toBe(200);

    const bookings = await jsonBody(response);
    expect(Array.isArray(bookings)).toBeTruthy();

    if (bookings.length > 0) {
      const target = bookings[0];
      const updateResponse = await requestAs(request, 'admin', 'PATCH', `/api/admin/facilities/bookings/${target.id}`, {
        data: {
          status: 'APPROVED',
          reason: 'Playwright admin approval',
        },
      });
      expect(updateResponse.status()).toBe(200);
      const updated = await jsonBody(updateResponse);
      expect(updated.status).toBe('APPROVED');
    }
  });
});
