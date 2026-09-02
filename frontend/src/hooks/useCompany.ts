import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCompanies, getCompany, updateCompany } from "../api/companies";
import type { Company } from "../types";
import { toast } from "sonner";

export function useCompanies() {
  return useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });
}

export function useCompany(id?: string) {
  return useQuery({
    queryKey: ["company", id],
    queryFn: () => (id ? getCompany(id) : Promise.reject("No company ID")),
    enabled: Boolean(id),
  });
}

export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Company> }) => updateCompany(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["company"] });
      toast.success("Paramètres de l'entreprise mis à jour.");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'entreprise.");
    },
  });
}
