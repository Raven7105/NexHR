import api from "./axios";
import type { EmployeeHistory, CreateEmployeeHistoryInput, PaginatedResponse } from "../types";

export interface EmployeeHistoryFilters {
    employee?: string;
    field?: string;
    ordering?: string;
}

export async function getEmployeeHistory(
    filters: EmployeeHistoryFilters = {}
): Promise<PaginatedResponse<EmployeeHistory>> {
    const response = await api.get<PaginatedResponse<EmployeeHistory>>("/employee-history/", {
        params: filters,
    });
    return response.data;
}

export async function createEmployeeHistory(
    data: CreateEmployeeHistoryInput
): Promise<EmployeeHistory> {
    const response = await api.post<EmployeeHistory>("/employee-history/", data);
    return response.data;
}

export async function deleteEmployeeHistory(id: string): Promise<void> {
    await api.delete(`/employee-history/${id}/`);
}
