import api from "./api";

export async function fetchMySupportTickets() {
  const { data } = await api.get("/support/me");
  return data;
}

export async function fetchMySupportTicket(ticketId) {
  const { data } = await api.get(`/support/me/${ticketId}`);
  return data;
}

export async function createSupportTicket(payload) {
  const { data } = await api.post("/support/me", payload);
  return data;
}

export async function fetchAllSupportTickets() {
  const { data } = await api.get("/support/admin");
  return data;
}

export async function fetchAdminSupportTicket(ticketId) {
  const { data } = await api.get(`/support/admin/${ticketId}`);
  return data;
}

export async function updateSupportTicketStatus(ticketId, payload) {
  const { data } = await api.patch(`/support/admin/${ticketId}`, payload);
  return data;
}