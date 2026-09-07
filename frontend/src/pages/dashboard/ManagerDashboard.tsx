import { Users, Calendar, Check, X, Briefcase, ArrowRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import { useLeaveRequests, useUpdateLeaveRequest } from "@/hooks/useLeaves";

export default function ManagerDashboard() {
    const { user } = useAuth();
    const myEmployeeId = user?.employee_profile?.id;

    const { data: employeesData } = useEmployees();
    const { data: pendingLeavesData } = useLeaveRequests({ statut: "en_attente" });
    const updateLeaveRequest = useUpdateLeaveRequest();

    const isLoading = !employeesData || !pendingLeavesData;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    const myTeam = employeesData.results.filter((e) => e.manager === myEmployeeId);
    const myTeamIds = myTeam.map((e) => e.id);
    const myTeamPendingLeaves = pendingLeavesData.results.filter((leave) =>
        myTeamIds.includes(leave.employee)
    );
    const activeMembers = myTeam.filter((e) => e.statut === "actif").length;
    const onLeaveMembers = myTeam.filter((e) => e.statut === "en_conge" || e.statut === "suspendu").length;

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

    return (
        <div>
            <div className="mb-8 rounded-xl border border-border bg-gradient-to-r from-blue-50 to-indigo-50 p-5 dark:from-blue-950/40 dark:to-indigo-950/40">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground mt-2">Mon équipe</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            {new Date().toLocaleDateString("fr-FR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Bonjour <span className="font-semibold text-foreground">{user?.employee_profile?.id ? "Manager" : "Utilisateur"}</span>, vous gérez aujourd’hui <span className="font-semibold text-foreground">{myTeam.length}</span> collaborateur(s).
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Users className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{myTeam.length}</p>
                    <p className="text-sm text-muted-foreground">Membres de mon équipe</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Briefcase className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{activeMembers}</p>
                    <p className="text-sm text-muted-foreground">Actifs aujourd’hui</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <Calendar className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{myTeamPendingLeaves.length}</p>
                    <p className="text-sm text-muted-foreground">Congés à valider</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">Demandes de mon équipe</h2>
                        <span className="text-xs text-muted-foreground">{myTeamPendingLeaves.length} en attente</span>
                    </div>

                    {myTeamPendingLeaves.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
                    ) : (
                        <div className="space-y-3">
                            {myTeamPendingLeaves.map((leave) => {
                                const employee = myTeam.find((e) => e.id === leave.employee);
                                return (
                                    <div key={leave.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold shrink-0">
                                            {employee?.nom_complet.charAt(0).toUpperCase() ?? "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {employee?.nom_complet ?? "Employé inconnu"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {leave.nombre_jours} jour(s) · {leave.date_debut} → {leave.date_fin}
                                            </p>
                                        </div>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() => handleApprove(leave.id)}
                                                disabled={updateLeaveRequest.isPending}
                                                className="w-7 h-7 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 disabled:opacity-50 transition-colors"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(leave.id)}
                                                disabled={updateLeaveRequest.isPending}
                                                className="w-7 h-7 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 disabled:opacity-50 transition-colors"
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

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">Actions rapides</h2>
                        <Clock3 size={16} className="text-muted-foreground" />
                    </div>
                    <div className="space-y-3">
                        <Link to="/employees" className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                            <p className="text-sm font-medium text-foreground">Suivi d’équipe</p>
                            <p className="text-xs text-muted-foreground mt-1">Consultez les profils et suivez les absences en un clic.</p>
                        </Link>
                        <Link to="/leaves" className="block rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                            <p className="text-sm font-medium text-foreground">Validation RH</p>
                            <p className="text-xs text-muted-foreground mt-1">Validez les demandes de congé rapidement depuis ce tableau.</p>
                        </Link>
                        <div className="rounded-lg border border-border p-3">
                            <p className="text-sm font-medium text-foreground">Équipe en congé</p>
                            <p className="text-xs text-muted-foreground mt-1">{onLeaveMembers} collaborateur(s) actuellement en congé.</p>
                        </div>
                    </div>
                    <Link to="/employees" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        Voir l’équipe <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}