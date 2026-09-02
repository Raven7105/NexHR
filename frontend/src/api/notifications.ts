import api from "./axios";
import type { Notification, PaginatedResponse } from "../types";

export async function getNotifications(): Promise<PaginatedResponse<Notification>> {
    const response = await api.get<PaginatedResponse<Notification>>("/notifications/");
    return response.data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
    const response = await api.post<Notification>(`/notifications/${id}/mark-read/`);
    return response.data;
}

export async function markAllNotificationsRead(): Promise<void> {
    await api.post("/notifications/mark-all-read/");
}
