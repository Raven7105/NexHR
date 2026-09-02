import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getLeaveTypes,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    getLeaveBalances,
    createLeaveBalance,
    updateLeaveBalance,
    deleteLeaveBalance,
    getLeaveRequests,
    createLeaveRequest,
    updateLeaveRequest,
    managerApproveLeaveRequest,
    managerRejectLeaveRequest,
    hrApproveLeaveRequest,
    hrRejectLeaveRequest,
    ceoApproveLeaveRequest,
    ceoRejectLeaveRequest,
    getLeaveHistory,
    type LeaveBalanceFilters,
    type LeaveRequestFilters,
} from "@/api/leaves";
import type { LeaveType, LeaveBalance, LeaveRequest } from "@/types";
import { toast } from "sonner";

function extractErrorMessage(error: any, fallback: string): string {
    const data = error?.response?.data;
    if (!data) return fallback;
    if (typeof data === "string") return data;
    if (data.detail) return String(data.detail);
    if (typeof data === "object") {
        const messages: string[] = [];
        for (const key of Object.keys(data)) {
            const val = data[key];
            if (Array.isArray(val)) {
                messages.push(`${key !== "non_field_errors" ? key + ": " : ""}${val.join(", ")}`);
            } else if (typeof val === "string") {
                messages.push(`${key !== "non_field_errors" ? key + ": " : ""}${val}`);
            }
        }
        if (messages.length > 0) return messages.join(" | ");
    }
    return fallback;
}

export function useLeaveTypes() {
    return useQuery({
        queryKey: ["leave-types"],
        queryFn: getLeaveTypes,
    });
}

export function useCreateLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<LeaveType, "id" | "company"> & { company?: string }) => createLeaveType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-types"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Type de congé créé avec succès (soldes initialisés pour tous les employés).");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de créer ce type de congé."));
        },
    });
}

export function useUpdateLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LeaveType> }) => updateLeaveType(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-types"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Type de congé mis à jour.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de modifier ce type de congé."));
        },
    });
}

export function useDeleteLeaveType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteLeaveType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-types"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Type de congé supprimé.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de supprimer ce type de congé."));
        },
    });
}

export function useLeaveBalances(filters: LeaveBalanceFilters = {}) {
    return useQuery({
        queryKey: ["leave-balances", filters],
        queryFn: () => getLeaveBalances(filters),
    });
}

export function useMyLeaveBalances(year?: number) {
    return useQuery({
        queryKey: ["leave-balances", "me", year],
        queryFn: () => import("@/api/leaves").then((mod) => mod.getMyLeaveBalances(year)),
    });
}

export function useCreateLeaveBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<LeaveBalance, "id">) => createLeaveBalance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Solde de congé attribué.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible d'attribuer ce solde."));
        },
    });
}

export function useUpdateLeaveBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<LeaveBalance> }) => updateLeaveBalance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Solde de congé mis à jour.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de mettre à jour le solde."));
        },
    });
}

export function useDeleteLeaveBalance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteLeaveBalance(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Solde supprimé.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de supprimer le solde."));
        },
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
            toast.success("Demande de congé envoyée au manager.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible d'envoyer la demande."));
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
            toast.success("Demande de congé mise à jour.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Impossible de mettre à jour la demande."));
        },
    });
}

// Hooks pour le Workflow d'Approbation à 3 Niveaux
export function useManagerApproveLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => managerApproveLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            toast.success("Demande approuvée par le Manager et transmise aux RH.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors de la validation Manager."));
        },
    });
}

export function useManagerRejectLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => managerRejectLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            toast.error("Demande de congé rejetée par le Manager.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors du rejet Manager."));
        },
    });
}

export function useHrApproveLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => hrApproveLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            toast.success("Demande approuvée par les RH et transmise à la Direction Générale (PDG).");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors de la validation RH."));
        },
    });
}

export function useHrRejectLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => hrRejectLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            toast.error("Demande de congé rejetée par le service RH.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors du rejet RH."));
        },
    });
}

export function useCeoApproveLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => ceoApproveLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
            toast.success("Congé définitivement accordé par le PDG ! Autorisation PDF générée.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors de l'approbation PDG."));
        },
    });
}

export function useCeoRejectLeaveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, comment }: { id: string; comment: string }) => ceoRejectLeaveRequest(id, comment),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
            toast.error("Demande de congé rejetée par le PDG.");
        },
        onError: (error: any) => {
            toast.error(extractErrorMessage(error, "Erreur lors du rejet PDG."));
        },
    });
}

export function useLeaveHistory(id: string) {
    return useQuery({
        queryKey: ["leave-history", id],
        queryFn: () => getLeaveHistory(id),
        enabled: Boolean(id),
    });
}