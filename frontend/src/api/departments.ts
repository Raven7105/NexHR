import api from "./axios";
import type { Department, PaginatedResponse } from "../types";

export interface DepartmentFilters {
    search?: string;
    page?: number;
}

export async function getDepartments(
    filters: DepartmentFilters = {}
): Promise<PaginatedResponse<Department>> {
    const response = await api.get<PaginatedResponse<Department>>("/departments/", {
        params: filters,
    });
    return response.data;
}

export async function getDepartment(id: string): Promise<Department> {
    const response = await api.get<Department>(`/departments/${id}/`);
    return response.data;
}

export async function createDepartment(
    data: Omit<Department, "id">
): Promise<Department> {
    const response = await api.post<Department>("/departments/", data);
    return response.data;
}

export async function updateDepartment(
    id: string,
    data: Partial<Omit<Department, "id">>
): Promise<Department> {
    const response = await api.patch<Department>(`/departments/${id}/`, data);
    return response.data;
}

export async function deleteDepartment(id: string): Promise<void> {
    await api.delete(`/departments/${id}/`);
}