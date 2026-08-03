import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Mail, Briefcase, Calendar, Building2 } from "lucide-react";
import { useEmployee } from "@/hooks/useEmployees";
import { useLeaveRequests } from "@/hooks/useLeaves";

const STATUT_STYLES: Record<string, string> = {
    actif: "bg-green-100 text-green-700",
    inactif: "bg-slate-100 text-slate-700",
    suspendu: "bg-red-100 text-red-700",
};

export default function EmployeeDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { data: employee, isLoading, isError } = useEmployee(id ?? "");
    const { data: leavesData } = useLeaveRequests({ employee: id, statut: "approuve" });

    const today = new Date().toISOString().split("T")[0];
    const currentLeave = leavesData?.results.find(
        (leave) => leave.date_debut <= today && leave.date_fin >= today
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Chargement...</p>
            </div>
        );
    }

    if (isError || !employee) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <p className="text-muted-foreground">Employé introuvable.</p>
                <Link to="/employees" className="text-sm text-blue-600 hover:underline">
                    Retour à la liste
                </Link>
            </div>
        );
    }

    return (
        <div>
            <Link
                to="/employees"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Retour à la liste
            </Link>

            <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                        {employee.nom_complet.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold text-foreground">{employee.nom_complet}</h1>
                            <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_STYLES[employee.statut]}`}
                            >
                                {employee.statut}
                            </span>
                            {currentLeave && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    En congé jusqu'au {currentLeave.date_fin}
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground">{employee.poste}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Mail size={14} /> {employee.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Briefcase size={14} /> {employee.matricule}
                            </span>
                            {employee.department_nom && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 size={14} /> {employee.department_nom}
                                </span>
                            )}
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} /> Embauché le {employee.date_embauche}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}