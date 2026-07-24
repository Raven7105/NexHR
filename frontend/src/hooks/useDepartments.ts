import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, type DepartmentFilters, } from "@/api/departments";
import type { Department } from "@/types";
import { toast } from "sonner";

export function useDepartments(filters: DepartmentFilters = {}) {
    return useQuery({
        queryKey: ["departments", filters],
        queryFn: () => getDepartments(filters),
    });
}

export function useDepartment(id: string) {
    return useQuery({
        queryKey: ["departments", id],
        queryFn: () => getDepartment(id),
        enabled: !!id,
    });
}

export function useCreateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Department, "id">) => createDepartment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            toast.success("Département créé.")
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de créer le département.");
        },
    });
}

export function useUpdateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Department, "id">> }) =>
            updateDepartment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            toast.success("Département mis à jour");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de mettre à jour le département.");
        },
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDepartment(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["departments"] });
            toast.success("Département supprimé.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de supprimé le département.");
        },
    });
}