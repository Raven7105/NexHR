import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getHolidays,
  createHoliday,
  deleteHoliday,
  type AttendanceFilters,
} from "../api/attendance";
import type { Attendance, Holiday } from "../types";
import { toast } from "sonner";

export function useAttendances(filters: AttendanceFilters = {}) {
  return useQuery({
    queryKey: ["attendances", filters],
    queryFn: () => getAttendances(filters),
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Attendance>) => createAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Pointage enregistré avec succès.");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Erreur lors de l'enregistrement du pointage.";
      toast.error(msg);
    },
  });
}

export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Attendance> }) => updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Pointage mis à jour.");
    },
    onError: () => {
      toast.error("Impossible de modifier le pointage.");
    },
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendances"] });
      toast.success("Pointage supprimé.");
    },
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: getHolidays,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Holiday, "id" | "company">) => createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Jour férié ajouté.");
    },
    onError: () => {
      toast.error("Impossible d'ajouter le jour férié.");
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["holidays"] });
      toast.success("Jour férié supprimé.");
    },
  });
}