import api from "./axios";
import type { LeaveType, LeaveBalance, LeaveRequest, PaginatedResponse, } from "../types";


export async function getLeaveTypes(): Promise<PaginatedResponse<LeaveType>> {
    const response = await api.get<PaginatedResponse<LeaveType>>("/leave-types/");
    return response.data;
}

export async function createLeaveType(
    data: Omit<LeaveType, "id" | "company"> & { company?: string }
): Promise<LeaveType> {
    const response = await api.post<LeaveType>("/leave-types/", data);
    return response.data;
}

export async function updateLeaveType(
    id: string,
    data: Partial<LeaveType>
): Promise<LeaveType> {
    const response = await api.patch<LeaveType>(`/leave-types/${id}/`, data);
    return response.data;
}

export async function deleteLeaveType(id: string): Promise<void> {
    await api.delete(`/leave-types/${id}/`);
}


export interface LeaveBalanceFilters {
    employee?: string;
    annee?: number;
}

export async function getLeaveBalances(
    filters: LeaveBalanceFilters = {}
): Promise<PaginatedResponse<LeaveBalance>> {
    const response = await api.get<PaginatedResponse<LeaveBalance>>("/leave-balances/", {
        params: filters,
    });
    return response.data;
}

export async function createLeaveBalance(
    data: Omit<LeaveBalance, "id">
): Promise<LeaveBalance> {
    const response = await api.post<LeaveBalance>("/leave-balances/", data);
    return response.data;
}

export async function updateLeaveBalance(
    id: string,
    data: Partial<LeaveBalance>
): Promise<LeaveBalance> {
    const response = await api.patch<LeaveBalance>(`/leave-balances/${id}/`, data);
    return response.data;
}

export async function deleteLeaveBalance(id: string): Promise<void> {
    await api.delete(`/leave-balances/${id}/`);
}


export interface LeaveRequestFilters {
    employee?: string;
    statut?: string;
    page?: number;
}

export async function getLeaveRequests(
    filters: LeaveRequestFilters = {}
): Promise<PaginatedResponse<LeaveRequest>> {
    const response = await api.get<PaginatedResponse<LeaveRequest>>("/leave-requests/", {
        params: filters,
    });
    return response.data;
}

export async function createLeaveRequest(
    data: Omit<LeaveRequest, "id" | "statut" | "validateur" | "date_validation" | "commentaire_validateur">
): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>("/leave-requests/", data);
    return response.data;
}

export async function updateLeaveRequest(
    id: string,
    data: Partial<LeaveRequest>
): Promise<LeaveRequest> {
    const response = await api.patch<LeaveRequest>(`/leave-requests/${id}/`, data);
    return response.data;
}