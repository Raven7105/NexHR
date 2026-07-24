import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getEmployees,
    getEmployee,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    type EmployeeFilters,
} from "@/api/employees";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/types";

export function useEmployees(filters: EmployeeFilters = {}) {
    return useQuery({
        queryKey: ["employees", filters],
        queryFn: () => getEmployees(filters),
    });
}

export function useEmployee(id: string) {
    return useQuery({
        queryKey: ["employees", id],
        queryFn: () => getEmployee(id),
        enabled: !!id,
    });
}

export function useCreateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateEmployeeInput) => createEmployee(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employé créé avec succès.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de créer l'employé.");
        },
    });
}

export function useUpdateEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateEmployeeInput }) =>
            updateEmployee(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employé mis à jour.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de mettre à jour l'employé.");
        },
    });
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"] });
            toast.success("Employé supprimé.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de supprimer l'employé.");
        },
    });
}