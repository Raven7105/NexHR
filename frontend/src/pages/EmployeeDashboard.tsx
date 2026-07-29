import { Calendar, Clock, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLeaveBalances, useLeaveRequests } from "@/hooks/useLeaves";
import { useAttendances } from "@/hooks/useAttendance";

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const myEmployeeId = user?.employee_profile?.id;

    const { data: balancesData } = useLeaveBalances({ employee: myEmployeeId });
    const { data: myLeavesData } = useLeaveRequests({ employee: myEmployeeId });
    const { data: myAttendanceData } = useAttendances({ employee: myEmployeeId });

    const isLoading = !balancesData || !myLeavesData || !myAttendanceData;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    const totalDaysRemaining = balancesData.results.reduce((sum, b) => {
        return sum + (parseFloat(b.jours_alloues) - parseFloat(b.jours_utilises));
    }, 0);

    const pendingCount = myLeavesData.results.filter((l) => l.statut === "en_attente").length;
    const recentAttendance = myAttendanceData.slice(0, 5);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground">
                    Bonjour, {user?.employee_profile?.poste ?? "Bienvenue"}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {new Date().toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Calendar className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalDaysRemaining}</p>
                    <p className="text-sm text-muted-foreground">Jours de congé restants</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <Clock className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Mes demandes en attente</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Wallet className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{user?.employee_profile?.matricule}</p>
                    <p className="text-sm text-muted-foreground">Mon matricule</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold text-foreground mb-4">Mes présences récentes</h2>
                {recentAttendance.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune présence enregistrée.</p>
                ) : (
                    <div className="space-y-2">
                        {recentAttendance.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-sm">
                                <span className="text-foreground">{a.date}</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.statut === "present"
                                            ? "bg-green-100 text-green-700"
                                            : a.statut === "absent"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-slate-100 text-slate-700"
                                        }`}
                                >
                                    {a.statut}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}