import api from "./axios";
import type { Payslip, PaginatedResponse } from "../types";


export interface PayrollSetting {
    id: string;
    date_effet: string;
    taux_cnss_salariale: string;
    taux_cnss_patronale: string;
    taux_inam_salariale: string;
    taux_inam_patronale: string;
    abattement_forfaitaire_pourcentage: string;
    plafond_abattement: string;
    montant_charge_famille: string;
    max_personnes_charges: number;
    smig: string;
    plafond_cotisation_cnss: string | null;
    jours_travail_par_mois: number;
    bareme_irpp: { min: number; max: number | null; taux: number }[];
    company: string;
}

export async function getPayrollSettings(): Promise<PaginatedResponse<PayrollSetting>> {
    const response = await api.get<PaginatedResponse<PayrollSetting>>("/payroll-settings/");
    return response.data;
}

export async function updatePayrollSetting(
    id: string,
    data: Partial<Omit<PayrollSetting, "id" | "company">>
): Promise<PayrollSetting> {
    const response = await api.patch<PayrollSetting>(`/payroll-settings/${id}/`, data);
    return response.data;
}


export interface SalaryComponent {
    id: string;
    nom: string;
    type_composant: "gain" | "retenue";
    imposable: boolean;
    soumis_cnss: boolean;
    company: string;
}

export async function getSalaryComponents(): Promise<PaginatedResponse<SalaryComponent>> {
    const response = await api.get<PaginatedResponse<SalaryComponent>>("/salary-components/");
    return response.data;
}

export async function createSalaryComponent(
    data: Omit<SalaryComponent, "id" | "company">
): Promise<SalaryComponent> {
    const response = await api.post<SalaryComponent>("/salary-components/", data);
    return response.data;
}


export interface PayslipFilters {
    employee?: string;
    mois?: number;
    annee?: number;
    page?: number;
}

export async function getPayslips(
    filters: PayslipFilters = {}
): Promise<PaginatedResponse<Payslip>> {
    const response = await api.get<PaginatedResponse<Payslip>>("/payslips/", {
        params: filters,
    });
    return response.data;
}

export async function getPayslip(id: string): Promise<Payslip> {
    const response = await api.get<Payslip>(`/payslips/${id}/`);
    return response.data;
}

export interface GeneratePayslipInput {
    employee: string;
    mois: number;
    annee: number;
}

export async function generatePayslip(
    data: GeneratePayslipInput
): Promise<Payslip> {
    const response = await api.post<Payslip>("/payslips/generate/", data);
    return response.data;
}