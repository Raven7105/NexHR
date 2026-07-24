import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getLeaveTypes, createLeaveType, getLeaveBalances, getLeaveRequests, createLeaveRequest, updateLeaveRequest, type LeaveBalanceFilters, type LeaveRequestFilters, } from "@/api/leaves";
import type { LeaveType, LeaveRequest } from "@/types";

export function useLeaveTypes() {
    return useQuery({
        queryKey: ["leave-types"],
        queryFn: getLeaveTypes,
    });
}

export function useCreateLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<LeaveType, "id">) => createLeaveType(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leave-types"] }),
    });
}

export function useLeaveBalances(filters: LeaveBalanceFilters = {}) {
    return useQuery({
        queryKey: ["leave-balances", filters],
        queryFn: () => getLeaveBalances(filters),
    });
}

export function useLeaveRequests(filters: LeaveRequestFilters = {}) {
    return useQuery({
        queryKey: ["leave-requests", filters],
        queryFn: () => getLeaveRequests(filters),
    });
}

export function useCreateLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (
            data: Omit<LeaveRequest, "id" | "statut" | "validateur" | "date_validation" | "commentaire_validateur">
        ) => createLeaveRequest(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
        },
    });
}

export function useUpdateLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LeaveRequest> }) =>
            updateLeaveRequest(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
        },
    });
}