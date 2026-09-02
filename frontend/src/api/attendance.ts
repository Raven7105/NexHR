import api from "./axios";
import type { Attendance, Holiday, PaginatedResponse } from "../types";

export interface AttendanceFilters {
  employee?: string;
  date?: string;
  date_apres?: string;
  date_avant?: string;
  statut?: string;
}

export async function getAttendances(filters: AttendanceFilters = {}): Promise<Attendance[]> {
  const response = await api.get("/attendances/", { params: filters });
  return Array.isArray(response.data) ? response.data : response.data.results ?? [];
}

export async function createAttendance(data: Partial<Attendance>): Promise<Attendance> {
  const response = await api.post("/attendances/", data);
  return response.data;
}

export async function updateAttendance(id: string, data: Partial<Attendance>): Promise<Attendance> {
  const response = await api.patch(`/attendances/${id}/`, data);
  return response.data;
}

export async function deleteAttendance(id: string): Promise<void> {
  await api.delete(`/attendances/${id}/`);
}

export async function getHolidays(): Promise<PaginatedResponse<Holiday> | Holiday[]> {
  const response = await api.get("/holidays/");
  return response.data;
}

export async function createHoliday(data: Omit<Holiday, "id" | "company">): Promise<Holiday> {
  const response = await api.post("/holidays/", data);
  return response.data;
}

export async function deleteHoliday(id: string): Promise<void> {
  await api.delete(`/holidays/${id}/`);
}