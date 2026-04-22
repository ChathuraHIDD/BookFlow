import api from "./api";

export async function fetchAllResources() {
  const { data } = await api.get("/student/resources");
  return data;
}

export async function fetchResourcesByCategory(category) {
  const { data } = await api.get(`/student/resources/categories/${category}`);
  return data;
}

export async function fetchResourceBySlug(slug) {
  const { data } = await api.get(`/student/resources/${slug}`);
  return data;
}

export async function createResourceBooking(payload) {
  const { data } = await api.post("/student/resources/bookings", payload);
  return data;
}

export async function fetchStudentResourceBookings() {
  const { data } = await api.get("/student/resources/bookings");
  return data;
}

export async function updateAdminResourceBookingStatus(bookingId, status) {
  const { data } = await api.patch(`/admin/resources/bookings/${bookingId}/status`, { status });
  return data;
}

export async function fetchAdminResourceBookings() {
  const { data } = await api.get("/admin/resources/bookings");
  return data;
}
