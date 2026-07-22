import api from "./axios";
import type {
    Employee,
    CreateEmployeeInput,
    UpdateEmployeeInput,
    PaginatedResponse,
} from "../types";

export interface EmployeeFilters {
    search?: string;
    department?: string;
    statut?: string;
    page?: number;
}

export async function getEmployees(
    filters: EmployeeFilters = {}
): Promise<PaginatedResponse<Employee>> {
    const response = await api.get<PaginatedResponse<Employee>>("/employees/", {
        params: filters,
    });
    return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
    const response = await api.get<Employee>(`/employees/${id}/`);
    return response.data;
}

export async function createEmployee(
    data: CreateEmployeeInput
): Promise<Employee> {
    const response = await api.post<Employee>("/employees/", data);
    return response.data;
}

export async function updateEmployee(
    id: string,
    data: UpdateEmployeeInput
): Promise<Employee> {
    const response = await api.patch<Employee>(`/employees/${id}/`, data);
    return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
    await api.delete(`/employees/${id}/`);
}