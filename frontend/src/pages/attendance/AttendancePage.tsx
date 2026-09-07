import { useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  UserCheck,
  Building2,
  Trash2,
  Edit2,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useAttendances,
  useCreateAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
} from "@/hooks/useAttendance";
import type { Attendance, Holiday } from "@/types";

import { useLeaveRequests } from "@/hooks/useLeaves";

const STATUT_CONFIG: Record<string, { label: string; bg: string; icon: any }> = {
  present: { label: "Présent", bg: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border-green-200 dark:border-green-800", icon: CheckCircle2 },
  late: { label: "En retard", bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800", icon: AlertCircle },
  absent: { label: "Absent", bg: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800", icon: XCircle },
  en_conge: { label: "En congé", bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: CalendarIcon },
  jour_ferie: { label: "Jour Férié", bg: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800", icon: Building2 },
};

export default function AttendancePage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employe";
  const myEmployeeId = user?.employee_profile?.id;

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statutFilter, setStatutFilter] = useState<string>("tous");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);

  const { data: employeesData } = useEmployees();
  const { data: attendancesData, isLoading } = useAttendances(
    isEmployee && myEmployeeId ? { employee: myEmployeeId } : {}
  );
  const { data: holidaysData } = useHolidays();
  const { data: leavesData } = useLeaveRequests();

  const createAttendance = useCreateAttendance();
  const updateAttendance = useUpdateAttendance();
  const deleteAttendance = useDeleteAttendance();
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const employees = employeesData?.results ?? [];
  const rawAttendances = Array.isArray(attendancesData) ? attendancesData : (attendancesData as any)?.results ?? [];
  const holidays = Array.isArray(holidaysData) ? holidaysData : (holidaysData as any)?.results ?? [];
  const approvedLeaves = (leavesData?.results ?? []).filter((l) => l.statut === "approuve");

  // Merge attendances + approved leaves for selectedDate
  const attendances: Attendance[] = [...rawAttendances];
  approvedLeaves.forEach((leave) => {
    if (selectedDate >= leave.date_debut && selectedDate <= leave.date_fin) {
      const exists = attendances.some(
        (a) => a.employee === leave.employee && a.date === selectedDate
      );
      if (!exists) {
        attendances.push({
          id: `leave-${leave.id}-${selectedDate}`,
          employee: leave.employee,
          date: selectedDate,
          heure_arrivee: null,
          heure_depart: null,
          statut: "en_conge",
          methode_pointage: "manual",
        });
      }
    }
  });

  // Form states
  const [formData, setFormData] = useState({
    employee: "",
    date: new Date().toISOString().slice(0, 10),
    heure_arrivee: "08:00",
    heure_depart: "17:00",
    statut: "present" as "present" | "absent" | "late" | "en_conge" | "jour_ferie",
    methode_pointage: "manual" as "manual" | "biometric" | "qr",
  });

  const [holidayForm, setHolidayForm] = useState({
    nom: "",
    date: "",
    recurrent: false,
  });

  // Current user's today attendance
  const todayStr = new Date().toISOString().slice(0, 10);
  const myTodayAttendance = attendances.find(
    (a: Attendance) => a.employee === myEmployeeId && a.date === todayStr
  );

  const filteredAttendances = attendances.filter((record: Attendance) => {
    if (selectedDate && record.date !== selectedDate) return false;
    if (statutFilter !== "tous" && record.statut !== statutFilter) return false;
    if (searchQuery.trim()) {
      const emp = employees.find((e) => e.id === record.employee);
      const name = emp?.nom_complet?.toLowerCase() ?? "";
      return name.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Stats
  const todayAttendances = attendances.filter((a: Attendance) => a.date === selectedDate);
  const presentCount = todayAttendances.filter((a: Attendance) => a.statut === "present").length;
  const lateCount = todayAttendances.filter((a: Attendance) => a.statut === "late").length;
  const absentCount = todayAttendances.filter((a: Attendance) => a.statut === "absent").length;
  const leaveCount = todayAttendances.filter((a: Attendance) => a.statut === "en_conge").length;

  function handleCheckIn() {
    if (!myEmployeeId) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const isLate = now.getHours() >= 9;

    createAttendance.mutate({
      employee: myEmployeeId,
      date: todayStr,
      heure_arrivee: timeStr,
      statut: isLate ? "late" : "present",
      methode_pointage: "manual",
    });
  }

  function handleCheckOut() {
    if (!myTodayAttendance) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    updateAttendance.mutate({
      id: myTodayAttendance.id,
      data: { heure_depart: timeStr },
    });
  }

  function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.employee || !formData.date) return;

    if (editingAttendance) {
      updateAttendance.mutate(
        {
          id: editingAttendance.id,
          data: {
            heure_arrivee: formData.heure_arrivee || null,
            heure_depart: formData.heure_depart || null,
            statut: formData.statut,
            methode_pointage: formData.methode_pointage,
          },
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingAttendance(null);
          },
        }
      );
    } else {
      createAttendance.mutate(
        {
          employee: formData.employee,
          date: formData.date,
          heure_arrivee: formData.heure_arrivee || null,
          heure_depart: formData.heure_depart || null,
          statut: formData.statut,
          methode_pointage: formData.methode_pointage,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setFormData({
              employee: "",
              date: new Date().toISOString().slice(0, 10),
              heure_arrivee: "08:00",
              heure_depart: "17:00",
              statut: "present",
              methode_pointage: "manual",
            });
          },
        }
      );
    }
  }

  function handleCreateHolidaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!holidayForm.nom || !holidayForm.date) return;
    createHoliday.mutate(holidayForm, {
      onSuccess: () => {
        setIsHolidayModalOpen(false);
        setHolidayForm({ nom: "", date: "", recurrent: false });
      },
    });
  }

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="text-primary h-7 w-7" />
            Présences & Pointages
          </h1>
          <p className="text-sm text-muted-foreground">
            Suivi en temps réel des présences, retards et jours fériés de l'entreprise.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEmployee && (
            <>
              <button
                onClick={() => setIsHolidayModalOpen(true)}
                className="flex items-center gap-2 border border-border bg-card hover:bg-accent px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <CalendarDays size={16} />
                Jours fériés
              </button>
              <button
                onClick={() => {
                  setEditingAttendance(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
              >
                <Plus size={16} />
                Saisir un pointage
              </button>
            </>
          )}
        </div>
      </div>

      {/* Employé Widget Pointage Rapide */}
      {myEmployeeId && (
        <div className="bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-semibold text-lg">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Pointage d'aujourd'hui — {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
              <h3 className="text-lg font-bold text-foreground mt-0.5">
                {myTodayAttendance ? (
                  <span>
                    Arrivé à <span className="text-primary font-mono">{myTodayAttendance.heure_arrivee ?? "--:--"}</span>
                    {myTodayAttendance.heure_depart && (
                      <span> — Départ à <span className="text-primary font-mono">{myTodayAttendance.heure_depart}</span></span>
                    )}
                  </span>
                ) : (
                  "Vous n'avez pas encore pointé aujourd'hui."
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!myTodayAttendance ? (
              <button
                onClick={handleCheckIn}
                disabled={createAttendance.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm transition-all hover:scale-105"
              >
                Pointer mon arrivée
              </button>
            ) : !myTodayAttendance.heure_depart ? (
              <button
                onClick={handleCheckOut}
                disabled={updateAttendance.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-5 py-2.5 rounded-xl shadow-sm text-sm transition-all hover:scale-105"
              >
                Pointer mon départ
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300">
                <CheckCircle2 size={16} /> Pointage complet
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cartes statistiques du jour sélectionné */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Présents</span>
            <CheckCircle2 size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{presentCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">En retard</span>
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{lateCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Absents</span>
            <XCircle size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{absentCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">En congé</span>
            <CalendarIcon size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{leaveCount}</p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <Filter size={14} className="text-muted-foreground hidden sm:block" />
          {["tous", "present", "late", "absent", "en_conge"].map((st) => (
            <button
              key={st}
              onClick={() => setStatutFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                statutFilter === st
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {st === "tous" ? "Tous" : STATUT_CONFIG[st]?.label ?? st}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des Pointages */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Heure d'arrivée</th>
                <th className="px-4 py-3">Heure de départ</th>
                <th className="px-4 py-3">Méthode</th>
                <th className="px-4 py-3">Statut</th>
                {!isEmployee && <th className="px-4 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Chargement des registres de présence...
                  </td>
                </tr>
              ) : filteredAttendances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground italic">
                    Aucun enregistrement de présence trouvé pour les filtres sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredAttendances.map((rec: Attendance) => {
                  const emp = employees.find((e) => e.id === rec.employee);
                  const conf = STATUT_CONFIG[rec.statut] ?? STATUT_CONFIG.present;
                  const Icon = conf.icon;

                  return (
                    <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {emp?.nom_complet ?? "Employé inconnu"}
                        {emp?.matricule && <span className="ml-1.5 text-muted-foreground text-[10px]">({emp.matricule})</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{rec.date}</td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{rec.heure_arrivee ?? "--:--"}</td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">{rec.heure_depart ?? "--:--"}</td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{rec.methode_pointage}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${conf.bg}`}>
                          <Icon size={12} /> {conf.label}
                        </span>
                      </td>
                      {!isEmployee && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingAttendance(rec);
                                setFormData({
                                  employee: rec.employee,
                                  date: rec.date,
                                  heure_arrivee: rec.heure_arrivee ?? "",
                                  heure_depart: rec.heure_depart ?? "",
                                  statut: rec.statut as any,
                                  methode_pointage: rec.methode_pointage as any,
                                });
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Modifier"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Supprimer ce registre de présence ?")) {
                                  deleteAttendance.mutate(rec.id);
                                }
                              }}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 dark:hover:bg-red-950/50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Saisie / Édition Pointage */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingAttendance ? "Modifier le pointage" : "Saisir un pointage"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {!editingAttendance && (
                <div>
                  <label className={labelClass}>Employé *</label>
                  <select
                    required
                    value={formData.employee}
                    onChange={(e) => setFormData((p) => ({ ...p, employee: e.target.value }))}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un employé...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nom_complet}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelClass}>Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Heure d'arrivée</label>
                  <input
                    type="time"
                    value={formData.heure_arrivee}
                    onChange={(e) => setFormData((p) => ({ ...p, heure_arrivee: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Heure de départ</label>
                  <input
                    type="time"
                    value={formData.heure_depart}
                    onChange={(e) => setFormData((p) => ({ ...p, heure_depart: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Statut *</label>
                <select
                  value={formData.statut}
                  onChange={(e) => setFormData((p) => ({ ...p, statut: e.target.value as any }))}
                  className={inputClass}
                >
                  <option value="present">Présent</option>
                  <option value="late">En retard</option>
                  <option value="absent">Absent</option>
                  <option value="en_conge">En congé</option>
                  <option value="jour_ferie">Jour férié</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createAttendance.isPending || updateAttendance.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gestion Jours Fériés */}
      {isHolidayModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="text-primary h-5 w-5" />
              Gestion des jours fériés
            </h2>

            <form onSubmit={handleCreateHolidaySubmit} className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Ajouter un jour férié</h3>
              <div>
                <label className={labelClass}>Nom du jour férié *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fête de l'Indépendance"
                  value={holidayForm.nom}
                  onChange={(e) => setHolidayForm((p) => ({ ...p, nom: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date *</label>
                <input
                  type="date"
                  required
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm((p) => ({ ...p, date: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex items-center justify-end pt-1">
                <button
                  type="submit"
                  disabled={createHoliday.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
                >
                  Ajouter le jour férié
                </button>
              </div>
            </form>

            <div className="max-h-48 overflow-y-auto space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Jours fériés enregistrés</h3>
              {holidays.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Aucun jour férié configuré.</p>
              ) : (
                holidays.map((h: Holiday) => (
                  <div key={h.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{h.nom}</p>
                      <p className="text-muted-foreground">{h.date}</p>
                    </div>
                    <button
                      onClick={() => deleteHoliday.mutate(h.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHolidayModalOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted font-medium"
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
