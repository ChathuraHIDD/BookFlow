import api from "./api";

export async function fetchMyNotifications() {
  const { data } = await api.get("/notifications/me");
  return data;
}

export async function fetchMyUnreadCount() {
  const { data } = await api.get("/notifications/me/unread-count");
  return data?.count || 0;
}

export async function markNotificationAsRead(notificationId) {
  const { data } = await api.patch(`/notifications/me/${notificationId}/read`);
  return data;
}

export async function deleteNotification(notificationId) {
  const { data } = await api.delete(`/notifications/me/${notificationId}`);
  return data;
}

export async function clearAllNotifications() {
  const { data } = await api.delete("/notifications/me");
  return data;
}
