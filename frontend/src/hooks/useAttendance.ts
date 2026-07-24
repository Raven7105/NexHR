import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHolidays, createHoliday, getAttendances, createAttendance, updateAttendance, type AttendanceFilters, } from "@/api/attendance";
import type { Holiday, Attendance } from "@/types";
import { toast } from "sonner";

export function useHolidays() {
    return useQuery({
        queryKey: ["holidays"],
        queryFn: getHolidays,
    });
}

export function useCreateHoliday() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Holiday, "id">) => createHoliday(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["holidays"] });
            toast.success("Jour férié ajouté.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible d'ajouter ce jour férié.");
        },
    });
}

export function useAttendances(filters: AttendanceFilters = {}) {
    return useQuery({
        queryKey: ["attendances", filters],
        queryFn: () => getAttendances(filters),
    });
}

export function useCreateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Omit<Attendance, "id">) => createAttendance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendances"] });
            toast.success("Présence enregistrée.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible d'enregistrer la présence.");
        },
    });
}

export function useUpdateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Attendance, "id">> }) =>
            updateAttendance(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendances"] });
            toast.success("Présence mis à jour.");
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || "Impossible de mettre à jour la présence.");
        },
    });
}