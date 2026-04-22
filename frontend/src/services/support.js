import api from "./api";

export async function fetchMySupportTickets() {
  const { data } = await api.get("/support/me");
  return data;
}

export async function fetchMySupportTicket(ticketId) {
  const { data } = await api.get(`/support/me/${ticketId}`);
  return data;
}

export async function createSupportTicket(payload, attachments = []) {
  if (attachments?.length) {
    const formData = new FormData();
    formData.append("payload", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    attachments.forEach((file) => {
      formData.append("attachments", file);
    });
    const { data } = await api.post("/support/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  const { data } = await api.post("/support/me", payload);
  return data;
}

export async function addSupportTicketComment(ticketId, payload) {
  const { data } = await api.post(`/support/${ticketId}/comments`, payload);
  return data;
}

export async function updateSupportTicketComment(ticketId, commentId, payload) {
  const { data } = await api.patch(`/support/${ticketId}/comments/${commentId}`, payload);
  return data;
}

export async function deleteSupportTicketComment(ticketId, commentId) {
  const { data } = await api.delete(`/support/${ticketId}/comments/${commentId}`);
  return data;
}

export async function addSupportTicketAttachment(ticketId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post(`/support/me/${ticketId}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function downloadSupportAttachment(ticketId, attachmentId) {
  const response = await api.get(`/support/attachments/${ticketId}/${attachmentId}`, {
    responseType: "blob",
  });

  const contentDisposition = response.headers?.["content-disposition"] || "";
  const fileNameMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  const fileName = fileNameMatch?.[1] || `attachment-${attachmentId}`;
  const blob = new Blob([response.data], { type: response.headers?.["content-type"] || "application/octet-stream" });

  return { blob, fileName };
}

export async function fetchAllSupportTickets() {
  const { data } = await api.get("/support/admin");
  return data;
}

export async function fetchTechnicians() {
  const { data } = await api.get("/admin/users", { params: { role: "technician" } });
  return data;
}

export async function assignSupportTechnician(ticketId, payload) {
  const { data } = await api.patch(`/support/admin/${ticketId}/assign`, payload);
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

export async function fetchTechnicianSupportTickets() {
  const { data } = await api.get("/support/technician/me");
  return data;
}

export async function fetchTechnicianSupportTicket(ticketId) {
  const { data } = await api.get(`/support/technician/me/${ticketId}`);
  return data;
}

export async function updateTechnicianSupportTicket(ticketId, payload) {
  const { data } = await api.patch(`/support/technician/me/${ticketId}`, payload);
  return data;
}
