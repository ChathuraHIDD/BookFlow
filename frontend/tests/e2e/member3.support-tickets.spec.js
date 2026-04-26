import { expect, test } from '@playwright/test';

import { isoDateOffset, jsonBody, mutationsEnabled, requestAs } from './support/api-helpers';

function tinyPngBuffer() {
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/w8AAgMBAQEGv8YAAAAASUVORK5CYII=',
    'base64',
  );
}

async function pickTechnicianId(request) {
  const usersResponse = await requestAs(request, 'admin', 'GET', '/api/admin/users?role=technician');
  expect(usersResponse.status()).toBe(200);
  const users = await jsonBody(usersResponse);
  return users?.[0]?.id || null;
}

test.describe('Member 3 - Incident tickets + attachments + technician updates', () => {
  test('student can list own tickets', async ({ request }) => {
    const response = await requestAs(request, 'student', 'GET', '/api/support/me');
    expect(response.status()).toBe(200);

    const body = await jsonBody(response);
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('create ticket, attach image, assign technician, and update by technician', async ({ request }) => {
    test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run support mutation tests');

    const createResponse = await requestAs(request, 'student', 'POST', '/api/support/me', {
      data: {
        title: `Playwright incident ${Date.now()}`,
        category: 'network',
        locationResource: 'Lab A',
        description: `Connectivity issue observed on ${isoDateOffset(0)}`,
        priority: 'medium',
        contactDetails: '0770000000',
      },
    });
    expect(createResponse.status()).toBe(201);

    const createdTicket = await jsonBody(createResponse);
    expect(createdTicket?.id).toBeTruthy();

    const attachmentResponse = await requestAs(
      request,
      'student',
      'POST',
      `/api/support/me/${createdTicket.id}/attachments`,
      {
        multipart: {
          file: {
            name: 'issue.png',
            mimeType: 'image/png',
            buffer: tinyPngBuffer(),
          },
        },
      },
    );
    expect(attachmentResponse.status()).toBe(200);

    const technicianId = await pickTechnicianId(request);
    test.skip(!technicianId, 'No technician account available to complete assignment/update flow');

    const assignResponse = await requestAs(
      request,
      'admin',
      'PATCH',
      `/api/support/admin/${createdTicket.id}/assign`,
      {
        data: { technicianId },
      },
    );
    expect(assignResponse.status()).toBe(200);

    const technicianUpdateResponse = await requestAs(
      request,
      'technician',
      'PATCH',
      `/api/support/technician/me/${createdTicket.id}`,
      {
        data: {
          status: 'in_progress',
          resolutionNote: 'Technician started diagnosis',
        },
      },
    );
    expect(technicianUpdateResponse.status()).toBe(200);

    const updatedTicket = await jsonBody(technicianUpdateResponse);
    expect(String(updatedTicket?.status || '').toUpperCase()).toBe('IN PROGRESS');
  });
});
