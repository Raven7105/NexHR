import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPayrollSettings, updatePayrollSetting, getSalaryComponents, createSalaryComponent, getPayslips, getPayslip, generatePayslip, type PayrollSetting, type SalaryComponent, type PayslipFilters, type GeneratePayslipInput, } from "@/api/payroll";


export function usePayrollSettings() {
    return useQuery({
        queryKey: ["payroll-settings"],
        queryFn: getPayrollSettings,
    });
}

export function useUpdatePayrollSetting() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: Partial<Omit<PayrollSetting, "id" | "company">>;
        }) => updatePayrollSetting(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payroll-settings"] });
            toast.success("Paramètres de paie mis à jour.");
        },
        onError: () => {
            toast.error("Impossible de mettre à jour les paramètres de paie.");
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
        mutationFn: (data: Omit<SalaryComponent, "id" | "company">) =>
            createSalaryComponent(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["salary-components"] });
            toast.success("Composant de salaire créé.");
        },
        onError: () => {
            toast.error("Impossible de créer ce composant de salaire.");
        },
    });
}


export function usePayslips(filters: PayslipFilters = {}) {
    return useQuery({
        queryKey: ["payslips", filters],
        queryFn: () => getPayslips(filters),
    });
}

export function usePayslip(id: string) {
    return useQuery({
        queryKey: ["payslips", id],
        queryFn: () => getPayslip(id),
        enabled: !!id,
    });
}

export function useGeneratePayslip() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: GeneratePayslipInput) => generatePayslip(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["payslips"] });
            toast.success("Bulletin de paie généré avec succès.");
        },
        onError: (error: any) => {
            const message =
                error?.response?.data?.detail ||
                "Erreur lors de la génération du bulletin.";
            toast.error(message);
        },
    });
}