import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPayslips,
  generatePayslip,
  updatePayslip,
  deletePayslip,
  getSalaryComponents,
  createSalaryComponent,
  deleteSalaryComponent,
  getPayrollSettings,
  type PayslipFilters,
  type SalaryComponent,
} from "../api/payroll";
import type { Payslip } from "../types";
import { toast } from "sonner";

export function usePayslips(filters: PayslipFilters = {}) {
  return useQuery({
    queryKey: ["payslips", filters],
    queryFn: () => getPayslips(filters),
  });
}

export function useGeneratePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employee: string; mois: number; annee: number }) => generatePayslip(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Bulletin de paie généré avec succès.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Impossible de générer ce bulletin de paie.";
      toast.error(msg);
    },
  });
}

export function useUpdatePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payslip> }) => updatePayslip(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Bulletin de paie mis à jour.");
    },
    onError: () => {
      toast.error("Impossible de modifier le bulletin.");
    },
  });
}

export function useDeletePayslip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePayslip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payslips"] });
      toast.success("Bulletin de paie supprimé.");
    },
  });
}

export function useSalaryComponents() {
  return useQuery({
    queryKey: ["salary-components"],
    queryFn: getSalaryComponents,
  });
}

export function useCreateSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SalaryComponent, "id" | "company">) => createSalaryComponent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components"] });
      toast.success("Élément de salaire créé.");
    },
    onError: () => {
      toast.error("Erreur lors de la création du composant.");
    },
  });
}

export function useDeleteSalaryComponent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSalaryComponent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salary-components"] });
      toast.success("Élément de salaire supprimé.");
    },
  });
}

export function usePayrollSettings() {
  return useQuery({
    queryKey: ["payroll-settings"],
    queryFn: getPayrollSettings,
  });
}