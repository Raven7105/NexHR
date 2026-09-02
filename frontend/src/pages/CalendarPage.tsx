import { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
} from "lucide-react";
import { useLeaveRequests, useLeaveTypes } from "@/hooks/useLeaves";
import { useHolidays } from "@/hooks/useAttendance";
import { useEmployees } from "@/hooks/useEmployees";
import type { LeaveRequest, Holiday } from "@/types";

const MOIS_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { data: leavesData } = useLeaveRequests();
  const { data: leaveTypesData } = useLeaveTypes();
  const { data: holidaysData } = useHolidays();
  const { data: employeesData } = useEmployees();

  const leaves = leavesData?.results ?? [];
  const leaveTypes = leaveTypesData?.results ?? [];
  const holidays = Array.isArray(holidaysData) ? holidaysData : (holidaysData as any)?.results ?? [];
  const employees = employeesData?.results ?? [];

  // Filter approved leaves
  const approvedLeaves = leaves.filter((l) => l.statut === "approuve");

  // Navigation
  function handlePrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function handleNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  // Days calculations for monthly grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const totalDaysInMonth = lastDayOfMonth.getDate();

  const daysGrid: Array<{ dayNumber: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Padding days from previous month
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const dateStr = new Date(year, month - 1, d).toISOString().slice(0, 10);
    daysGrid.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  // Days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    const dateStr = `${year}-${mStr}-${dStr}`;
    daysGrid.push({ dayNumber: d, dateStr, isCurrentMonth: true });
  }

  // Remaining padding days for next month to complete 5 or 6 rows (multiple of 7)
  const remaining = (7 - (daysGrid.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const dateStr = new Date(year, month + 1, d).toISOString().slice(0, 10);
    daysGrid.push({ dayNumber: d, dateStr, isCurrentMonth: false });
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarIcon className="text-primary h-7 w-7" />
            Calendrier des Équipes
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble des congés approuvés et des jours fériés de l'entreprise.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-bold text-foreground px-3">
            {MOIS_NAMES[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold transition-colors ml-2"
          >
            Aujourd'hui
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs bg-card border border-border rounded-xl p-3 shadow-sm">
        <span className="font-semibold text-muted-foreground">Légende :</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-medium">
          <Building2 size={12} /> Jour férié
        </span>
        {leaveTypes.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-foreground font-medium border border-border"
            style={{ backgroundColor: `${t.couleur}20` }}
          >
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.couleur }} />
            {t.nom}
          </span>
        ))}
      </div>

      {/* Grille Mensuelle */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-semibold text-muted-foreground py-3">
          {JOURS_SEMAINE.map((j) => (
            <div key={j}>{j}</div>
          ))}
        </div>

        {/* Grille des cellules du mois */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border min-h-[550px]">
          {daysGrid.map((cell, idx) => {
            const isToday = cell.dateStr === todayStr;

            // Events on this date
            const dayHolidays = holidays.filter((h: Holiday) => h.date === cell.dateStr);
            const dayLeaves = approvedLeaves.filter((l: LeaveRequest) => {
              return cell.dateStr >= l.date_debut && cell.dateStr <= l.date_fin;
            });

            return (
              <div
                key={idx}
                className={`p-2 transition-colors min-h-[90px] ${
                  !cell.isCurrentMonth ? "bg-muted/10 opacity-40" : "bg-card hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-semibold h-6 w-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-foreground"
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Badges d'événements */}
                <div className="space-y-1">
                  {dayHolidays.map((h: Holiday) => (
                    <div
                      key={h.id}
                      onClick={() => setSelectedEvent({ type: "holiday", data: h })}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 truncate cursor-pointer hover:opacity-80"
                      title={h.nom}
                    >
                      🎉 {h.nom}
                    </div>
                  ))}

                  {dayLeaves.map((l: LeaveRequest) => {
                    const emp = employees.find((e) => e.id === l.employee);
                    const lType = leaveTypes.find((t) => t.id === l.leave_type);
                    const color = lType?.couleur ?? "#3b82f6";

                    return (
                      <div
                        key={l.id}
                        onClick={() => setSelectedEvent({ type: "leave", data: l, emp, lType })}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-medium text-foreground truncate cursor-pointer hover:opacity-80 border border-border/50"
                        style={{ backgroundColor: `${color}25` }}
                        title={`${emp?.nom_complet ?? "Employé"} — ${lType?.nom ?? "Congé"}`}
                      >
                        <span className="font-semibold">{emp?.nom_complet?.split(" ")[0]}</span> ({lType?.nom ?? "Congé"})
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Détail Événement */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4">
            {selectedEvent.type === "holiday" ? (
              <>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  🎉 {selectedEvent.data.nom}
                </h3>
                <p className="text-xs text-muted-foreground">Jour férié officiel — {selectedEvent.data.date}</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <User className="text-primary h-5 w-5" />
                  {selectedEvent.emp?.nom_complet ?? "Employé"}
                </h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Type :</span> {selectedEvent.lType?.nom ?? "Congé"}
                  </p>
                  <p>
                    <span className="font-semibold text-foreground">Période :</span> Du {selectedEvent.data.date_debut} au {selectedEvent.data.date_fin} ({selectedEvent.data.nombre_jours} jours)
                  </p>
                  {selectedEvent.data.motif && (
                    <p>
                      <span className="font-semibold text-foreground">Motif :</span> {selectedEvent.data.motif}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
