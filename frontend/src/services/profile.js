import api from "./api";

export async function fetchMyProfile() {
  const { data } = await api.get("/student/profile");
  return data;
}

export async function fetchMyProfileRequests() {
  const { data } = await api.get("/student/profile/requests");
  return data;
}

export async function submitMyProfileRequest(payload) {
  const { data } = await api.post("/student/profile/requests", payload);
  return data;
}

export async function fetchPendingProfileRequests() {
  const { data } = await api.get("/admin/profile-requests");
  return data;
}

export async function approveProfileRequest(requestId, adminNote) {
  const { data } = await api.post(`/admin/profile-requests/${requestId}/approve`, {
    adminNote,
  });
  return data;
}

export async function declineProfileRequest(requestId, adminNote) {
  const { data } = await api.post(`/admin/profile-requests/${requestId}/decline`, {
    adminNote,
  });
  return data;
}
