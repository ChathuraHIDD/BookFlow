import api from "./api";

export async function fetchMyNotifications() {
  const { data } = await api.get("/notifications/me");
  return data;
}
