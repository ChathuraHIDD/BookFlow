import api from "./api";

export async function fetchStudentFacilitiesOverview() {
  const { data } = await api.get("/student/facilities");
  return data;
}

export async function fetchBuildingFloors(buildingId) {
  const { data } = await api.get(`/student/facilities/buildings/${buildingId}/floors`);
  return data;
}

export async function fetchFloorClassrooms(buildingId, floorNumber, date, startTime, endTime) {
  const { data } = await api.get(`/student/facilities/buildings/${buildingId}/floors/${floorNumber}/classrooms`, {
    params: {
      ...(date ? { date } : {}),
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
    },
  });
  return data;
}

export async function fetchAdminFloorClassrooms(buildingId, floorNumber) {
  const { data } = await api.get(`/admin/facilities/buildings/${buildingId}/floors/${floorNumber}/classrooms`);
  return data;
}

export async function createFacilityBooking(payload) {
  const { data } = await api.post("/student/facilities/bookings", payload);
  return data;
}

export async function fetchStudentBookings() {
  const { data } = await api.get("/student/facilities/bookings");
  return data;
}

export async function fetchAdminFacilitiesBuildings() {
  const { data } = await api.get("/admin/facilities/buildings");
  return data;
}

export async function createAdminBuilding(payload) {
  const { data } = await api.post("/admin/facilities/buildings", payload);
  return data;
}

export async function updateAdminBuildingFloors(buildingId, payload) {
  const { data } = await api.patch(`/admin/facilities/buildings/${buildingId}/floors`, payload);
  return data;
}

export async function createAdminClassroom(buildingId, floorNumber, payload) {
  const { data } = await api.post(`/admin/facilities/buildings/${buildingId}/floors/${floorNumber}/classrooms`, payload);
  return data;
}

export async function updateAdminClassroom(classroomId, payload) {
  const { data } = await api.put(`/admin/facilities/classrooms/${classroomId}`, payload);
  return data;
}

export async function updateAdminClassroomStatus(classroomId, status) {
  const { data } = await api.patch(`/admin/facilities/classrooms/${classroomId}/status/${status}`);
  return data;
}

export async function deleteAdminClassroom(classroomId) {
  await api.delete(`/admin/facilities/classrooms/${classroomId}`);
}

export async function fetchAdminFacilityBookings() {
  const { data } = await api.get("/admin/facilities/bookings");
  return data;
}

export async function updateAdminBookingStatus(bookingId, status) {
  const { data } = await api.patch(`/admin/facilities/bookings/${bookingId}`, { status });
  return data;
}

export async function fetchAdminFacilityReports() {
  const { data } = await api.get("/admin/facilities/reports");
  return data;
}
