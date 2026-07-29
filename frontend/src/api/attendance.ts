import api from "./axios";
import type { Holiday, Attendance, PaginatedResponse } from "../types";


export async function getHolidays(): Promise<PaginatedResponse<Holiday>> {
    const response = await api.get<PaginatedResponse<Holiday>>("/holidays/");
    return response.data;
}

export async function createHoliday(
    data: Omit<Holiday, "id">
): Promise<Holiday> {
    const response = await api.post<Holiday>("/holidays/", data);
    return response.data;
}


export interface AttendanceFilters {
    employee?: string;
    date?: string;
    date_apres?: string;
    date_avant?: string;
    page?: number;
}

export async function getAttendances(
    filters: AttendanceFilters = {}
): Promise<Attendance[]> {
    const response = await api.get<Attendance[]>("/attendances/", {
        params: filters,
    });
    return response.data;
}

export async function createAttendance(
    data: Omit<Attendance, "id">
): Promise<Attendance> {
    const response = await api.post<Attendance>("/attendances/", data);
    return response.data;
}

export async function updateAttendance(
    id: string,
    data: Partial<Omit<Attendance, "id">>
): Promise<Attendance> {
    const response = await api.patch<Attendance>(`/attendances/${id}/`, data);
    return response.data;
}