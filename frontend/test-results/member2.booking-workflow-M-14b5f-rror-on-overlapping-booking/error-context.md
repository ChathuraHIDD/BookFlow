# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member2.booking-workflow.spec.js >> Member 2 - Booking workflow + conflict checking >> resource booking conflict returns validation error on overlapping booking
- Location: tests/e2e/member2.booking-workflow.spec.js:100:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 400
```

# Test source

```ts
  18  |     'GET',
  19  |     `/api/student/facilities/buildings/${building.id}/floors`,
  20  |   );
  21  |   expect(floorsResponse.status()).toBe(200);
  22  | 
  23  |   const floors = await jsonBody(floorsResponse);
  24  |   const floor = floors?.[0];
  25  |   if (!floor) {
  26  |     return null;
  27  |   }
  28  | 
  29  |   const classroomsResponse = await requestAs(
  30  |     request,
  31  |     'student',
  32  |     'GET',
  33  |     `/api/student/facilities/buildings/${building.id}/floors/${floor.floorNumber}/classrooms`,
  34  |   );
  35  |   expect(classroomsResponse.status()).toBe(200);
  36  | 
  37  |   const classrooms = await jsonBody(classroomsResponse);
  38  |   const availableClassrooms = (classrooms || []).filter(c => c.operationalStatus === 'AVAILABLE');
  39  |   return availableClassrooms?.[0] || null;
  40  | }
  41  | 
  42  | async function pickFirstResource(request) {
  43  |   const resourcesResponse = await requestAs(request, 'student', 'GET', '/api/student/resources');
  44  |   expect(resourcesResponse.status()).toBe(200);
  45  | 
  46  |   const resources = await jsonBody(resourcesResponse);
  47  |   return resources?.[0] || null;
  48  | }
  49  | 
  50  | test.describe('Member 2 - Booking workflow + conflict checking', () => {
  51  |   test('student can view own booking workflows', async ({ request }) => {
  52  |     const facilityBookings = await requestAs(request, 'student', 'GET', '/api/student/facilities/bookings');
  53  |     expect(facilityBookings.status()).toBe(200);
  54  | 
  55  |     const resourceBookings = await requestAs(request, 'student', 'GET', '/api/student/resources/bookings');
  56  |     expect(resourceBookings.status()).toBe(200);
  57  |   });
  58  | 
  59  |   test('facility booking conflict returns validation error on overlapping booking', async ({ request }) => {
  60  |     test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run conflict creation tests');
  61  | 
  62  |     const classroom = await pickFirstClassroom(request);
  63  |     test.skip(!classroom?.id, 'No classroom data available to run facility conflict test');
  64  | 
  65  |     const bookingDate = isoDateOffset(Math.floor(Math.random() * 20) + 5);
  66  |     const startTime = '20:00';
  67  |     const endTime = '21:00';
  68  | 
  69  |     const seat = Math.floor(Math.random() * 20) + 1;
  70  |     const firstResponse = await requestAs(request, 'student', 'POST', '/api/student/facilities/bookings', {
  71  |       data: {
  72  |         classroomId: classroom.id,
  73  |         bookingDate,
  74  |         startTime,
  75  |         endTime,
  76  |         selectedSeats: classroom.seatSelectionEnabled ? [seat] : [],
  77  |         purpose: 'Playwright conflict baseline',
  78  |         priority: 'medium',
  79  |       },
  80  |     });
  81  |     expect(firstResponse.status()).toBe(200);
  82  | 
  83  |     const secondResponse = await requestAs(request, 'student', 'POST', '/api/student/facilities/bookings', {
  84  |       data: {
  85  |         classroomId: classroom.id,
  86  |         bookingDate,
  87  |         startTime: '20:15',
  88  |         endTime: '20:45',
  89  |         selectedSeats: classroom.seatSelectionEnabled ? [seat] : [],
  90  |         purpose: 'Playwright overlap check',
  91  |         priority: 'medium',
  92  |       },
  93  |     });
  94  | 
  95  |     expect(secondResponse.status()).toBe(400);
  96  |     const secondBody = await jsonBody(secondResponse);
  97  |     expect(secondBody?.message || '').not.toEqual('');
  98  |   });
  99  | 
  100 |   test('resource booking conflict returns validation error on overlapping booking', async ({ request }) => {
  101 |     test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run conflict creation tests');
  102 | 
  103 |     const resource = await pickFirstResource(request);
  104 |     test.skip(!resource?.id, 'No resource data available to run resource conflict test');
  105 | 
  106 |     const bookingDate = isoDateOffset(Math.floor(Math.random() * 20) + 5);
  107 |     const startTime = '18:00';
  108 |     const endTime = '19:00';
  109 | 
  110 |     const firstResponse = await requestAs(request, 'student', 'POST', '/api/student/resources/bookings', {
  111 |       data: {
  112 |         resourceId: resource.id,
  113 |         bookingDate,
  114 |         startTime,
  115 |         endTime,
  116 |       },
  117 |     });
> 118 |     expect(firstResponse.status()).toBe(200);
      |                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  119 | 
  120 |     // Wait for DB consistency (MongoDB Atlas)
  121 |     await new Promise(resolve => setTimeout(resolve, 1500));
  122 | 
  123 |     const secondResponse = await requestAs(request, 'student', 'POST', '/api/student/resources/bookings', {
  124 |       data: {
  125 |         resourceId: resource.id,
  126 |         bookingDate,
  127 |         startTime: '18:15',
  128 |         endTime: '18:45',
  129 |       },
  130 |     });
  131 | 
  132 |     expect(secondResponse.status()).toBe(400);
  133 |     const secondBody = await jsonBody(secondResponse);
  134 |     expect((secondBody?.message || '').toLowerCase()).toContain('booked');
  135 |   });
  136 | 
  137 |   test('admin can list all bookings and update status', async ({ request }) => {
  138 |     test.skip(!mutationsEnabled(), 'Set E2E_ALLOW_MUTATIONS=true to run admin update tests');
  139 | 
  140 |     const response = await requestAs(request, 'admin', 'GET', '/api/admin/facilities/bookings');
  141 |     expect(response.status()).toBe(200);
  142 | 
  143 |     const bookings = await jsonBody(response);
  144 |     expect(Array.isArray(bookings)).toBeTruthy();
  145 | 
  146 |     if (bookings.length > 0) {
  147 |       const target = bookings[0];
  148 |       const updateResponse = await requestAs(request, 'admin', 'PATCH', `/api/admin/facilities/bookings/${target.id}`, {
  149 |         data: {
  150 |           status: 'APPROVED',
  151 |           reason: 'Playwright admin approval',
  152 |         },
  153 |       });
  154 |       expect(updateResponse.status()).toBe(200);
  155 |       const updated = await jsonBody(updateResponse);
  156 |       expect(updated.status).toBe('APPROVED');
  157 |     }
  158 |   });
  159 | });
  160 | 
```