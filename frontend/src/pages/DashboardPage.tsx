import { Users, UserCheck, Calendar, AlertCircle, Cake, Check, X, Building2 } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendances } from "@/hooks/useAttendance";
import { useDepartments } from "@/hooks/useDepartments";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/useLeaves";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

export default function DashboardPage() {
    const { data: employeesData } = useEmployees();
    const { data: pendingLeavesData } = useLeaveRequests({ statut: "en_attente" });
    const updateLeaveRequest = useUpdateLeaveRequest();
    const { data: departmentsData } = useDepartments();
    const totalDepartments = departmentsData?.count ?? 0;

    const today = new Date().toISOString().split("T")[0];
    const { data: attendancesData } = useAttendances({ date: today });

    const totalEmployees = employeesData?.count ?? 0;
    const employees = employeesData?.results ?? [];
    const pendingLeaves = pendingLeavesData?.results ?? [];

    const presentToday =
        attendancesData?.results.filter((a) => a.statut === "present").length ?? 0;
    const absentToday =
        attendancesData?.results.filter((a) => a.statut === "absent").length ?? 0;
    const absenteeismRate =
        totalEmployees > 0 ? ((absentToday / totalEmployees) * 100).toFixed(1) : "0.0";

    const todayMonthDay = new Date().toISOString().slice(5, 10);
    const currentMonth = new Date().getMonth() + 1;
    const departmentChartData = (departmentsData?.results ?? []).map((dept) => ({
        nom: dept.nom,
        effectif: employees.filter((e) => e.department === dept.id).length,
    }));

    const birthdaysThisMonth = employees.filter((e) => {
        if (!e.date_naissance) return false;
        const birthMonth = new Date(e.date_naissance).getMonth() + 1;
        return birthMonth === currentMonth;
    });

    function isToday(dateNaissance: string) {
        return dateNaissance.slice(5, 10) === todayMonthDay;
    }

    function handleApprove(id: string) {
        updateLeaveRequest.mutate({
            id,
            data: { statut: "approuve", date_validation: new Date().toISOString() },
        });
    }

    function handleReject(id: string) {
        updateLeaveRequest.mutate({
            id,
            data: { statut: "rejete", date_validation: new Date().toISOString() },
        });
    }
    const isLoading = !employeesData || !pendingLeavesData || !attendancesData;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement du tableau de bord...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {new Date().toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Users className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalEmployees}</p>
                    <p className="text-sm text-muted-foreground">Effectif total</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                        <Building2 className="text-purple-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalDepartments}</p>
                    <p className="text-sm text-muted-foreground">Départements</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <UserCheck className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{presentToday}</p>
                    <p className="text-sm text-muted-foreground">Présents aujourd'hui</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <Calendar className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingLeaves.length}</p>
                    <p className="text-sm text-muted-foreground">Congés en attente</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
                        <AlertCircle className="text-red-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{absenteeismRate}%</p>
                    <p className="text-sm text-muted-foreground">Taux d'absentéisme</p>
                </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <h2 className="font-semibold text-foreground mb-4">Effectif par département</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={departmentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="effectif" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Cake className="text-pink-500" size={18} />
                        <h2 className="font-semibold text-foreground">Anniversaires du mois</h2>
                    </div>

                    {birthdaysThisMonth.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucun anniversaire ce mois-ci.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {birthdaysThisMonth.map((employee) => (
                                <div key={employee.id} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-sm font-semibold shrink-0">
                                        {employee.nom_complet.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {employee.nom_complet}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{employee.poste}</p>
                                    </div>
                                    {isToday(employee.date_naissance!) && (
                                        <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-full shrink-0">
                                            Aujourd'hui 🎂
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">À valider</h2>
                    </div>

                    {pendingLeaves.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Aucune demande en attente.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {pendingLeaves.map((leave) => {
                                const employee = employees.find((e) => e.id === leave.employee);
                                return (
                                    <div key={leave.id} className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold shrink-0">
                                            {employee?.nom_complet.charAt(0).toUpperCase() ?? "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {employee?.nom_complet ?? "Employé inconnu"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {leave.nombre_jours} jour(s) · {leave.date_debut}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => handleApprove(leave.id)}
                                                disabled={updateLeaveRequest.isPending}
                                                className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="Approuver"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(leave.id)}
                                                disabled={updateLeaveRequest.isPending}
                                                className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                title="Rejeter"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}