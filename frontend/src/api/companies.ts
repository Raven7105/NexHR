import api from "./axios";
import type { Company, PaginatedResponse } from "../types";

export async function getCompanies(): Promise<PaginatedResponse<Company> | Company[]> {
  const response = await api.get("/companies/");
  return response.data;
}

export async function getCompany(id: string): Promise<Company> {
  const response = await api.get(`/companies/${id}/`);
  return response.data;
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<Company> {
  const response = await api.patch(`/companies/${id}/`, data);
  return response.data;
}
