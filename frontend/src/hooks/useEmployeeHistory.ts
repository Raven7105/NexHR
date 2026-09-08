import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getEmployeeHistory,
    createEmployeeHistory,
    deleteEmployeeHistory,
    type EmployeeHistoryFilters,
} from "@/api/employeeHistory";
import type { CreateEmployeeHistoryInput } from "@/types";

export function useEmployeeHistory(filters: EmployeeHistoryFilters = {}) {
    return useQuery({
        queryKey: ["employee-history", filters],
        queryFn: () => getEmployeeHistory(filters),
        enabled: filters.employee !== undefined ? !!filters.employee : true,
    });
}

export function useCreateEmployeeHistory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEmployeeHistoryInput) => createEmployeeHistory(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee-history"] });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Événement de carrière enregistré avec succès.");
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Impossible d'enregistrer l'événement.";
            toast.error(message);
        },
    });
}

export function useDeleteEmployeeHistory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEmployeeHistory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employee-history"] });
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Événement supprimé.");
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.detail ||
                "Impossible de supprimer l'événement.";
            toast.error(message);
        },
    });
}
