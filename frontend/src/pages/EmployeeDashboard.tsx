import { Calendar, Clock, Wallet, TrendingUp, Building2 } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { useLeaveBalances, useLeaveRequests } from "@/hooks/useLeaves";
import { useAttendances } from "@/hooks/useAttendance";
import { useDepartments } from "@/hooks/useDepartments";

const STATUT_LABELS: Record<string, string> = {
    en_attente: "En attente",
    approuve: "Approuvé",
    rejete: "Rejeté",
    annule: "Annulé",
};

const STATUT_COLORS: Record<string, string> = {
    en_attente: "bg-amber-100 text-amber-700",
    approuve: "bg-green-100 text-green-700",
    rejete: "bg-red-100 text-red-700",
    annule: "bg-slate-100 text-slate-700",
};

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function calculerHeures(arrivee: string | null, depart: string | null): number {
    if (!arrivee || !depart) return 0;
    const [h1, m1] = arrivee.split(":").map(Number);
    const [h2, m2] = depart.split(":").map(Number);
    return h2 + m2 / 60 - (h1 + m1 / 60);
}

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const myEmployeeId = user?.employee_profile?.id;
    const myDepartmentId = user?.employee_profile?.department;

    const { data: departmentsData } = useDepartments();
    const { data: balancesData } = useLeaveBalances({ employee: myEmployeeId });
    const { data: myLeavesData } = useLeaveRequests({ employee: myEmployeeId });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateApres = thirtyDaysAgo.toISOString().split("T")[0];
    const dateAvant = new Date().toISOString().split("T")[0];

    const { data: myAttendanceData } = useAttendances({
        employee: myEmployeeId,
        date_apres: dateApres,
        date_avant: dateAvant,
    });

    const isLoading = !balancesData || !myLeavesData || !myAttendanceData || !departmentsData;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    const myDepartment = departmentsData.results.find((d) => d.id === myDepartmentId);

    const totalDaysRemaining = balancesData.results.reduce((sum, b) => {
        return sum + (parseFloat(b.jours_alloues) - parseFloat(b.jours_utilises));
    }, 0);
    const totalDaysAllocated = balancesData.results.reduce(
        (sum, b) => sum + parseFloat(b.jours_alloues),
        0
    );
    const totalDaysUsed = balancesData.results.reduce(
        (sum, b) => sum + parseFloat(b.jours_utilises),
        0
    );

    const pendingCount = myLeavesData.results.filter((l) => l.statut === "en_attente").length;

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    const startOfWeekStr = startOfWeek.toISOString().split("T")[0];

    const thisWeekAttendance = myAttendanceData.filter((a) => a.date >= startOfWeekStr);
    const hoursThisWeek = thisWeekAttendance.reduce(
        (sum, a) => sum + calculerHeures(a.heure_arrivee, a.heure_depart),
        0
    );

    const presentDaysCount = myAttendanceData.filter((a) => a.statut === "present").length;
    const attendanceRate =
        myAttendanceData.length > 0
            ? ((presentDaysCount / myAttendanceData.length) * 100).toFixed(0)
            : "0";

    const lineChartData = myAttendanceData.map((a) => ({
        date: a.date.slice(5),
        heures: Number(calculerHeures(a.heure_arrivee, a.heure_depart).toFixed(1)),
    }));

    const pieChartData = [
        { name: "Utilisés", value: totalDaysUsed },
        { name: "Restants", value: totalDaysRemaining },
    ];
    const PIE_COLORS = ["#f59e0b", "#22c55e"];

    const hoursByWeekday = JOURS_SEMAINE.map((jour, index) => {
        const dayAttendance = thisWeekAttendance.filter((a) => {
            const jsDay = new Date(a.date).getDay();
            const adjustedDay = jsDay === 0 ? 6 : jsDay - 1;
            return adjustedDay === index;
        });
        const heures = dayAttendance.reduce(
            (sum, a) => sum + calculerHeures(a.heure_arrivee, a.heure_depart),
            0
        );
        return { jour, heures: Number(heures.toFixed(1)) };
    });

    const recentLeaves = [...myLeavesData.results]
        .sort((a, b) => new Date(b.date_creation ?? 0).getTime() - new Date(a.date_creation ?? 0).getTime())
        .slice(0, 3);

    return (
        <div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
                        {user?.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">
                            Bonjour {user?.employee_profile?.poste ?? ""} 👋
                        </h1>
                        <div className="flex items-center gap-4 text-blue-100 text-sm mt-1">
                            {myDepartment && (
                                <span className="flex items-center gap-1">
                                    <Building2 size={14} /> {myDepartment.nom}
                                </span>
                            )}
                            <span>
                                {new Date().toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Calendar className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalDaysRemaining}</p>
                    <p className="text-sm text-muted-foreground">Jours de congé restants</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <TrendingUp className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Taux de présence (30j)</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                        <Clock className="text-purple-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{hoursThisWeek.toFixed(1)}h</p>
                    <p className="text-sm text-muted-foreground">Heures cette semaine</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <Wallet className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Demandes en attente</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Présences — 30 derniers jours</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="heures" stroke="#2563eb" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Congés</h2>
                    {totalDaysAllocated === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun solde configuré.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                >
                                    {pieChartData.map((_, index) => (
                                        <Cell key={index} fill={PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={30} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Heures par jour (cette semaine)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={hoursByWeekday}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="heures" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Mes dernières demandes</h2>
                    {recentLeaves.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune demande de congé.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentLeaves.map((leave) => (
                                <div key={leave.id} className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            {leave.date_debut} → {leave.date_fin}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{leave.nombre_jours} jour(s)</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_COLORS[leave.statut]}`}
                                    >
                                        {STATUT_LABELS[leave.statut]}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}