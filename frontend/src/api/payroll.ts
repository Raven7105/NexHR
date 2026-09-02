import api from "./axios";
import type { Payslip, PaginatedResponse } from "../types";

export interface SalaryComponent {
  id: string;
  nom: string;
  type_composant: "gain" | "retenue";
  imposable: boolean;
  soumis_cnss: boolean;
  company: string;
}

export interface PayslipItem {
  id: string;
  payslip: string;
  salary_component: string;
  montant: string;
}

export interface PayrollSetting {
  id: string;
  company: string;
  date_effet: string;
  taux_cnss_salariale: string;
  taux_cnss_patronale: string;
  taux_inam_salariale: string;
  taux_inam_patronale: string;
  smig: string;
  jours_travail_par_mois: number;
}

export interface PayslipFilters {
  employee?: string;
  mois?: number;
  annee?: number;
  statut?: string;
}

export async function getPayslips(filters: PayslipFilters = {}): Promise<PaginatedResponse<Payslip> | Payslip[]> {
  const response = await api.get("/payslips/", { params: filters });
  return response.data;
}

export async function generatePayslip(data: { employee: string; mois: number; annee: number }): Promise<Payslip> {
  const response = await api.post("/payslips/generate/", data);
  return response.data;
}

export async function updatePayslip(id: string, data: Partial<Payslip>): Promise<Payslip> {
  const response = await api.patch(`/payslips/${id}/`, data);
  return response.data;
}

export async function deletePayslip(id: string): Promise<void> {
  await api.delete(`/payslips/${id}/`);
}

export async function getSalaryComponents(): Promise<PaginatedResponse<SalaryComponent> | SalaryComponent[]> {
  const response = await api.get("/salary-components/");
  return response.data;
}

export async function createSalaryComponent(data: Omit<SalaryComponent, "id" | "company">): Promise<SalaryComponent> {
  const response = await api.post("/salary-components/", data);
  return response.data;
}

export async function deleteSalaryComponent(id: string): Promise<void> {
  await api.delete(`/salary-components/${id}/`);
}

export async function getPayrollSettings(): Promise<PaginatedResponse<PayrollSetting> | PayrollSetting[]> {
  const response = await api.get("/payroll-settings/");
  return response.data;
}