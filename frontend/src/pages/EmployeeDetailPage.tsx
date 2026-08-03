import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Mail, Briefcase, Calendar, Building2, BadgeCheck, Wallet, UserRound, Phone } from "lucide-react";
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

            <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                            {employee.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-foreground">{employee.nom_complet}</h1>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_STYLES[employee.statut]}`}>
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
                                <span className="flex items-center gap-1.5"><Mail size={14} /> {employee.email}</span>
                                {employee.phone_number && (
                                    <span className="flex items-center gap-1.5"><Phone size={14} /> {employee.phone_number}</span>
                                )}
                                <span className="flex items-center gap-1.5"><Briefcase size={14} /> {employee.matricule}</span>
                                {employee.department_nom && (
                                    <span className="flex items-center gap-1.5"><Building2 size={14} /> {employee.department_nom}</span>
                                )}
                                <span className="flex items-center gap-1.5"><Calendar size={14} /> Embauché le {employee.date_embauche}</span>
                            </div>
                        </div>
                    </div>
                    <Link to={`/employees/${id}/edit`} className="px-3 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                        Modifier
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-foreground">
                        <UserRound size={16} />
                        <h2 className="font-semibold">Informations générales</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex justify-between"><span>Poste</span><span className="font-medium text-foreground">{employee.poste}</span></div>
                        <div className="flex justify-between"><span>Type de contrat</span><span className="font-medium text-foreground">{employee.type_contrat}</span></div>
                        <div className="flex justify-between"><span>Département</span><span className="font-medium text-foreground">{employee.department_nom ?? "—"}</span></div>
                        <div className="flex justify-between"><span>Matricule</span><span className="font-medium text-foreground">{employee.matricule}</span></div>
                        <div className="flex justify-between"><span>Téléphone</span><span className="font-medium text-foreground">{employee.phone_number || "—"}</span></div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3 text-foreground">
                        <Wallet size={16} />
                        <h2 className="font-semibold">Détails RH</h2>
                    </div>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex justify-between"><span>Salaire de base</span><span className="font-medium text-foreground">{employee.salaire_de_base} FCFA</span></div>
                        <div className="flex justify-between"><span>Personnes à charge</span><span className="font-medium text-foreground">{employee.nombre_personnes_charge}</span></div>
                        <div className="flex justify-between"><span>Date d’embauche</span><span className="font-medium text-foreground">{employee.date_embauche}</span></div>
                        <div className="flex justify-between"><span>Date de naissance</span><span className="font-medium text-foreground">{employee.date_naissance ?? "—"}</span></div>
                    </div>
                </div>
            </div>

            <div className="mt-4 bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3 text-foreground">
                    <BadgeCheck size={16} />
                    <h2 className="font-semibold">Résumé</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    {employee.nom_complet} travaille en tant que <span className="font-medium text-foreground">{employee.poste}</span> dans le département <span className="font-medium text-foreground">{employee.department_nom ?? "non défini"}</span>.
                </p>
            </div>
        </div>
    );
}