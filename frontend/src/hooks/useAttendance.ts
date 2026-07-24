import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHolidays, createHoliday, getAttendances, createAttendance, updateAttendance, type AttendanceFilters, } from "@/api/attendance";
import type { Holiday, Attendance } from "@/types";

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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["holidays"] }),
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
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendances"] }),
    });
}

export function useUpdateAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Attendance, "id">> }) =>
            updateAttendance(id, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendances"] }),
    });
}