import { getEmployee, getEmployees,createEmployee, updateEmployee, type EmployeeFilters, deleteEmployee } from "@/api/employees";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    },
  });
}


export function useUpdateEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data}: { id: string; data: UpdateEmployeeInput}) =>
            updateEmployee(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"]});
        }
    })
}

export function useDeleteEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ( id: string) => deleteEmployee(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["employees"]});
        },

    });
}