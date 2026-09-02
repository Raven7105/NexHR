import api from "./axios";
import type { LeaveType, LeaveBalance, LeaveRequest, LeaveApprovalHistory, PaginatedResponse } from "../types";

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

export async function getMyLeaveBalances(year?: number): Promise<LeaveBalance[]> {
    const response = await api.get<LeaveBalance[]>("/leave-balances/me/", {
        params: { year },
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

// 3-Tier Approval Workflow Actions
export async function managerApproveLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/manager-approve/`, { comment });
    return response.data;
}

export async function managerRejectLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/manager-reject/`, { comment });
    return response.data;
}

export async function hrApproveLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/hr-approve/`, { comment });
    return response.data;
}

export async function hrRejectLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/hr-reject/`, { comment });
    return response.data;
}

export async function ceoApproveLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/ceo-approve/`, { comment });
    return response.data;
}

export async function ceoRejectLeaveRequest(id: string, comment: string): Promise<LeaveRequest> {
    const response = await api.post<LeaveRequest>(`/leave-requests/${id}/ceo-reject/`, { comment });
    return response.data;
}

export async function getLeaveHistory(id: string): Promise<LeaveApprovalHistory[]> {
    const response = await api.get<LeaveApprovalHistory[]>(`/leave-requests/${id}/history/`);
    return response.data;
}

export async function getPublicLeaveVerification(token: string): Promise<any> {
    const response = await api.get(`/public/verify-leave/${token}/`);
    return response.data;
}

export async function downloadLeavePdf(id: string, refNumber?: string): Promise<void> {
    const response = await api.get(`/leave-requests/${id}/pdf/`, {
        responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Autorisation_Conge_${refNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}