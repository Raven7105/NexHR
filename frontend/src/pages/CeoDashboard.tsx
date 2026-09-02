import { useState } from "react";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    TrendingUp,
    Users,
    Building2,
    Award,
    Calendar,
    ChevronRight,
    Eye,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    useLeaveRequests,
    useCeoApproveLeaveRequest,
    useCeoRejectLeaveRequest,
} from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import LeaveApprovalTimeline from "@/components/LeaveApprovalTimeline";
import type { LeaveRequest } from "@/types";
import { toast } from "sonner";

export default function CeoDashboard() {
    const { user } = useAuth();
    const { data: leavesData, isLoading: leavesLoading } = useLeaveRequests();
    const { data: employeesData } = useEmployees();

    const ceoApprove = useCeoApproveLeaveRequest();
    const ceoReject = useCeoRejectLeaveRequest();

    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        request: LeaveRequest | null;
        action: "ceo_approve" | "ceo_reject";
        comment: string;
    }>({
        isOpen: false,
        request: null,
        action: "ceo_approve",
        comment: "",
    });

    const requests = leavesData?.results ?? [];
    const employees = employeesData?.results ?? [];

    // Demandes en attente de la signature PDG
    const pendingCeoRequests = requests.filter((r) => r.statut === "PENDING_CEO");
    const approvedRequests = requests.filter((r) => r.statut === "APPROVED" || r.statut === "approuve");
    const rejectedRequests = requests.filter((r) => r.statut === "REJECTED" || r.statut === "rejete");
    const totalPending = requests.filter((r) => r.statut.startsWith("PENDING_") || r.statut === "en_attente");

    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionModal.request) return;

        const id = actionModal.request.id;
        const comment = actionModal.comment;

        if (actionModal.action === "ceo_approve") {
            ceoApprove.mutate(
                { id, comment },
                {
                    onSuccess: () => {
                        setActionModal({ ...actionModal, isOpen: false });
                        if (selectedRequest?.id === id) setSelectedRequest(null);
                    },
                }
            );
        } else {
            if (!comment.trim()) {
                toast.error("Le motif du rejet est obligatoire.");
                return;
            }
            ceoReject.mutate(
                { id, comment },
                {
                    onSuccess: () => {
                        setActionModal({ ...actionModal, isOpen: false });
                        if (selectedRequest?.id === id) setSelectedRequest(null);
                    },
                }
            );
        }
    };

    return (
        <div className="space-y-8">
            {/* Header d'Accueil Exécutif */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-3">
                            <Award size={14} /> Direction Générale • Vue Décisionnelle
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            Bonjour, {user?.first_name || "Monsieur le Directeur Général"}
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm mt-1.5 max-w-xl">
                            Tableau de bord stratégique pour l'arbitrage des congés et le suivi des effectifs de l'entreprise.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start md:self-auto">
                        <div className="px-4 py-2 bg-slate-800/80 rounded-xl border border-slate-700/80 text-right">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Aujourd'hui</p>
                            <p className="text-xs font-bold text-white font-mono mt-0.5">
                                {new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cartes KPI Décisionnelles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-purple-500/30 rounded-2xl p-5 shadow-sm relative overflow-hidden bg-gradient-to-br from-purple-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">À Valider (PDG)</p>
                        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <ShieldCheck size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-foreground mt-3 font-mono">
                        {pendingCeoRequests.length}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-1">
                        Dossiers en attente de votre signature
                    </p>
                </div>

                <div className="bg-card border border-emerald-500/30 rounded-2xl p-5 shadow-sm bg-gradient-to-br from-emerald-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Approuvées ce mois</p>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-foreground mt-3 font-mono">
                        {approvedRequests.length}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Autorisations officielles accordées
                    </p>
                </div>

                <div className="bg-card border border-rose-500/30 rounded-2xl p-5 shadow-sm bg-gradient-to-br from-rose-500/5 to-transparent">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rejetées ce mois</p>
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            <XCircle size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-foreground mt-3 font-mono">
                        {rejectedRequests.length}
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                        Demandes non accordées
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total en attente</p>
                        <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                            <Clock size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-foreground mt-3 font-mono">
                        {totalPending.length}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                        En cours sur tous les niveaux
                    </p>
                </div>
            </div>

            {/* Section 1 : DEMANDES EN ATTENTE DE SIGNATURE PDG */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <ShieldCheck className="text-purple-600 dark:text-purple-400" size={22} />
                            Demandes de congés à valider (Étape PDG)
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Chaque approbation génère l'autorisation PDF officielle et déduit automatiquement le solde.
                        </p>
                    </div>
                    <span className="text-xs font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full">
                        {pendingCeoRequests.length} dossier{pendingCeoRequests.length > 1 ? "s" : ""}
                    </span>
                </div>

                {leavesLoading ? (
                    <div className="py-12 text-center text-muted-foreground">Chargement des dossiers en attente...</div>
                ) : pendingCeoRequests.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                        <CheckCircle2 size={40} className="text-emerald-500/50 mb-2" />
                        <p className="text-sm font-semibold text-foreground">Aucune demande en attente de votre signature.</p>
                        <p className="text-xs text-muted-foreground mt-1">Toutes les demandes révisées ont été traitées.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingCeoRequests.map((req) => {
                            const empName = req.employee_detail?.nom_complet || "Demandeur";
                            const empPoste = req.employee_detail?.poste || "";
                            const empDept = req.employee_detail?.department_nom || "Entreprise";

                            return (
                                <div
                                    key={req.id}
                                    className="bg-card border border-purple-500/30 rounded-2xl p-5 shadow-sm hover:border-purple-500/60 transition-all space-y-4 flex flex-col justify-between"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-sm text-foreground">{empName}</h3>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {empPoste} • <span className="text-foreground">{empDept}</span>
                                                </p>
                                            </div>
                                            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full font-bold text-[11px] border border-purple-500/20">
                                                {req.leave_type_nom}
                                            </span>
                                        </div>

                                        <div className="bg-muted/50 rounded-xl p-3 text-xs space-y-1.5 font-mono">
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>Période :</span>
                                                <span className="font-bold text-foreground">
                                                    {new Date(req.date_debut).toLocaleDateString("fr-FR")} → {new Date(req.date_fin).toLocaleDateString("fr-FR")}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-muted-foreground">
                                                <span>Durée demandée :</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{req.nombre_jours} jours</span>
                                            </div>
                                            {req.motif && (
                                                <p className="text-[11px] font-sans text-muted-foreground italic border-t border-border/50 pt-1.5 mt-1.5">
                                                    "{req.motif}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="flex-1 py-2 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Eye size={14} /> Dossier complet
                                        </button>
                                        <button
                                            onClick={() => setActionModal({ isOpen: true, request: req, action: "ceo_reject", comment: "" })}
                                            className="py-2 px-3 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors shadow-sm"
                                        >
                                            Rejeter
                                        </button>
                                        <button
                                            onClick={() => setActionModal({ isOpen: true, request: req, action: "ceo_approve", comment: "" })}
                                            className="py-2 px-4 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5"
                                        >
                                            <ShieldCheck size={15} /> Signer
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal : Consultation du Dossier Complet */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                            <div>
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <FileText className="text-purple-600 dark:text-purple-400" size={22} />
                                    Dossier de Validation de Congé
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Demandeur : {selectedRequest.employee_detail?.nom_complet} ({selectedRequest.employee_detail?.matricule})
                                </p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Timeline Visuelle Adaptée */}
                        <LeaveApprovalTimeline request={selectedRequest} />

                        {/* Actions PDG directes dans la modale */}
                        {selectedRequest.statut === "PENDING_CEO" && (
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    onClick={() => setActionModal({ isOpen: true, request: selectedRequest, action: "ceo_reject", comment: "" })}
                                    className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition-colors"
                                >
                                    Rejeter la demande
                                </button>
                                <button
                                    onClick={() => setActionModal({ isOpen: true, request: selectedRequest, action: "ceo_approve", comment: "" })}
                                    className="px-5 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    <ShieldCheck size={16} /> Signer et Accorder l'autorisation
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal : Action d'approbation / rejet */}
            {actionModal.isOpen && actionModal.request && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">
                                {actionModal.action === "ceo_approve" ? "Signature de l'Autorisation de Congé" : "Motif de rejet obligatoire"}
                            </h3>
                            <button onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="text-muted-foreground">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleActionSubmit} className="space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Demande de <span className="font-semibold text-foreground">{actionModal.request.employee_detail?.nom_complet}</span> (
                                {actionModal.request.leave_type_nom} : {actionModal.request.date_debut} → {actionModal.request.date_fin})
                            </p>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">
                                    {actionModal.action === "ceo_reject" ? "Motif du rejet *" : "Commentaire / Remarques de Direction (Optionnel)"}
                                </label>
                                <textarea
                                    value={actionModal.comment}
                                    onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                                    rows={3}
                                    required={actionModal.action === "ceo_reject"}
                                    placeholder={actionModal.action === "ceo_reject" ? "Raison du rejet..." : "Autorisation accordée par la Direction..."}
                                    className="w-full border border-border rounded-xl p-3 text-xs bg-background focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className={`px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-sm ${actionModal.action === "ceo_approve" ? "bg-purple-600 hover:bg-purple-700" : "bg-rose-600 hover:bg-rose-700"
                                        }`}
                                >
                                    {actionModal.action === "ceo_approve" ? "Confirmer & Signer le PDF" : "Confirmer le Rejet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
