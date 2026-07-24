import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment, type DepartmentFilters, } from "@/api/departments";
import type { Department } from "@/types";

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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
    });
}

export function useUpdateDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Department, "id">> }) =>
            updateDepartment(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
    });
}

export function useDeleteDepartment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => deleteDepartment(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["departments"] }),
    });
}