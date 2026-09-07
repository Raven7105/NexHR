import { useState } from "react";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Download,
    Eye,
    Clock,
    UserCheck,
    Search,
    FileSignature,
    Check,
    X,
    AlertCircle,
} from "lucide-react";
import {
    useLeaveRequests,
    useLeaveTypes,
    useCeoApproveLeaveRequest,
    useCeoRejectLeaveRequest,
} from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import { downloadLeavePdf } from "@/api/leaves";
import LeaveApprovalTimeline from "@/components/LeaveApprovalTimeline";
import type { LeaveRequest } from "@/types";
import { toast } from "sonner";

function getEmployeeEmail(emp?: any): string {
    if (!emp) return "Collaborateur";
    if (typeof emp.user === "object" && emp.user?.email) return emp.user.email;
    return emp.user_email || emp.matricule || "Collaborateur";
}

export default function CeoApprovalsPage() {
    const { data: leavesData, isLoading } = useLeaveRequests();
    const { data: leaveTypesData } = useLeaveTypes();
    const { data: employeesData } = useEmployees();

    const ceoApprove = useCeoApproveLeaveRequest();
    const ceoReject = useCeoRejectLeaveRequest();

    const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
    const [search, setSearch] = useState("");
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    // Modal de décision
    const [decisionModal, setDecisionModal] = useState<{
        isOpen: boolean;
        request: LeaveRequest | null;
        action: "approve" | "reject";
        comment: string;
    }>({
        isOpen: false,
        request: null,
        action: "approve",
        comment: "",
    });

    const requests = leavesData?.results ?? [];
    const leaveTypes = leaveTypesData?.results ?? [];
    const employees = employeesData?.results ?? [];

    // Filter requests
    const pendingRequests = requests.filter((r) => r.statut === "PENDING_CEO");
    const approvedRequests = requests.filter((r) => r.statut === "APPROVED" || r.statut === "approuve");
    const rejectedRequests = requests.filter((r) => r.statut === "REJECTED" || r.statut === "rejete");

    const currentList =
        activeTab === "pending"
            ? pendingRequests
            : activeTab === "approved"
                ? approvedRequests
                : rejectedRequests;

    const filteredRequests = currentList.filter((r) => {
        const emp = employees.find((e) => e.id === r.employee);
        const term = search.toLowerCase();
        return (
            getEmployeeEmail(emp).toLowerCase().includes(term) ||
            (emp?.matricule?.toLowerCase().includes(term) ?? false) ||
            (emp?.poste?.toLowerCase().includes(term) ?? false) ||
            (r.motif?.toLowerCase().includes(term) ?? false)
        );
    });

    const handleConfirmDecision = async () => {
        if (!decisionModal.request) return;

        if (decisionModal.action === "approve") {
            await ceoApprove.mutateAsync({
                id: decisionModal.request.id,
                comment: decisionModal.comment || "Autorisation accordée par la Direction Générale.",
            });
        } else {
            if (!decisionModal.comment.trim()) {
                toast.error("Veuillez saisir un motif de rejet.");
                return;
            }
            await ceoReject.mutateAsync({
                id: decisionModal.request.id,
                comment: decisionModal.comment,
            });
        }

        setDecisionModal({ isOpen: false, request: null, action: "approve", comment: "" });
    };

    return (
        <div>
            {/* Header Plateforme */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Signatures & Arbitrages</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Validation finale hiérarchique, visas numériques et registre des autorisations officielles
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-card border border-border rounded-xl px-4 py-2 text-center">
                        <span className="text-xs text-muted-foreground font-medium">À signer : </span>
                        <span className="text-sm font-bold text-amber-600 font-mono ml-1">{pendingRequests.length}</span>
                    </div>
                    <div className="bg-card border border-border rounded-xl px-4 py-2 text-center">
                        <span className="text-xs text-muted-foreground font-medium">Accordées : </span>
                        <span className="text-sm font-bold text-green-600 font-mono ml-1">{approvedRequests.length}</span>
                    </div>
                </div>
            </div>

            {/* Statistiques Rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <Clock className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingRequests.length}</p>
                    <p className="text-sm text-muted-foreground">Dossiers en attente de visa</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <CheckCircle2 className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{approvedRequests.length}</p>
                    <p className="text-sm text-muted-foreground">Autorisations officielles accordées</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mb-3">
                        <XCircle className="text-red-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{rejectedRequests.length}</p>
                    <p className="text-sm text-muted-foreground">Demandes non accordées</p>
                </div>
            </div>

            {/* Barre de Recherche et Onglets Plateforme */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "pending"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Clock size={15} />
                        À Signer
                        {pendingRequests.length > 0 && (
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab("approved")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "approved"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <CheckCircle2 size={15} />
                        Autorisations Signées ({approvedRequests.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("rejected")}
                        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "rejected"
                            ? "bg-card text-foreground shadow-sm font-semibold"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <XCircle size={15} />
                        Refusées ({rejectedRequests.length})
                    </button>
                </div>

                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher un collaborateur..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Liste des Dossiers */}
            {isLoading ? (
                <div className="flex items-center justify-center p-12 bg-card border border-border rounded-xl">
                    <p className="text-sm text-muted-foreground">Chargement des dossiers d'arbitrage...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="text-center p-12 bg-card border border-border rounded-xl">
                    <ShieldCheck className="mx-auto text-muted-foreground mb-3" size={40} />
                    <p className="text-base font-semibold text-foreground">Aucun dossier dans cette catégorie</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {activeTab === "pending"
                            ? "Toutes les demandes de congés ont été arbitrées par la Direction."
                            : "Aucun résultat trouvé pour cette sélection."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredRequests.map((req) => {
                        const emp = employees.find((e) => e.id === req.employee);
                        const leaveType = leaveTypes.find((lt) => lt.id === req.leave_type);
                        const isPendingMe = req.statut === "PENDING_CEO";

                        return (
                            <div
                                key={req.id}
                                className="bg-card border border-border rounded-xl p-5 transition-colors hover:border-border/80"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Infos Collaborateur */}
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                                            {getEmployeeEmail(emp).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {getEmployeeEmail(emp)}
                                                </p>
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {emp?.matricule ?? "RH-N/A"}
                                                </span>
                                                <span
                                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: `${leaveType?.couleur || "#3B82F6"}20`,
                                                        color: leaveType?.couleur || "#3B82F6",
                                                    }}
                                                >
                                                    {leaveType?.nom || "Congé"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {emp?.poste || "Collaborateur"} • <span className="font-semibold text-foreground">{req.nombre_jours} jour{parseFloat(String(req.nombre_jours)) > 1 ? "s" : ""}</span> ({req.date_debut} au {req.date_fin})
                                            </p>
                                            {req.motif && (
                                                <p className="text-xs text-foreground/80 mt-1 italic">
                                                    « {req.motif} »
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Validations & Actions */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:self-center">
                                        <div className="flex items-center gap-2 text-xs">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                                                <CheckCircle2 size={13} className="text-green-600" />
                                                Manager : Favorable
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200">
                                                <UserCheck size={13} className="text-green-600" />
                                                RH : Conforme
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isPendingMe ? (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            setDecisionModal({
                                                                isOpen: true,
                                                                request: req,
                                                                action: "reject",
                                                                comment: "",
                                                            })
                                                        }
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                                                    >
                                                        Refuser
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setDecisionModal({
                                                                isOpen: true,
                                                                request: req,
                                                                action: "approve",
                                                                comment: "Autorisation accordée par la Direction Générale.",
                                                            })
                                                        }
                                                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                                                    >
                                                        <FileSignature size={14} />
                                                        Signer
                                                    </button>
                                                </>
                                            ) : req.statut === "APPROVED" || req.statut === "approuve" ? (
                                                <button
                                                    onClick={() => downloadLeavePdf(req.id)}
                                                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                                                >
                                                    <Download size={13} />
                                                    Attestation PDF
                                                </button>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                                    Refusé
                                                </span>
                                            )}

                                            <button
                                                onClick={() => setSelectedRequest(req)}
                                                className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted text-xs"
                                                title="Voir le dossier"
                                            >
                                                <Eye size={15} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Consultation Complète du Dossier */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl w-full max-w-xl p-6 shadow-xl">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Dossier d'Arbitrage</h3>
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="text-muted-foreground hover:text-foreground p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="py-4 space-y-4">
                            <div className="bg-muted/40 p-3 rounded-lg border border-border text-xs space-y-1">
                                <p className="font-medium text-foreground">
                                    Référence : AUT-CON-{selectedRequest.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-muted-foreground">
                                    Période : {selectedRequest.date_debut} → {selectedRequest.date_fin} ({selectedRequest.nombre_jours} jours)
                                </p>
                                {selectedRequest.motif && (
                                    <p className="text-foreground pt-1">
                                        <span className="font-semibold text-muted-foreground">Motif : </span>
                                        {selectedRequest.motif}
                                    </p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                    Parcours Hiérarchique de Validation
                                </h4>
                                <LeaveApprovalTimeline request={selectedRequest} />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border flex justify-end">
                            <button
                                onClick={() => setSelectedRequest(null)}
                                className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted/80"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Décision d'Approbation / Rejet */}
            {decisionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${decisionModal.action === "approve"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                                    }`}
                            >
                                {decisionModal.action === "approve" ? (
                                    <FileSignature size={20} />
                                ) : (
                                    <AlertCircle size={20} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    {decisionModal.action === "approve"
                                        ? "Visa & Signature Direction"
                                        : "Refus du dossier de congé"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {decisionModal.action === "approve"
                                        ? "Génère l'attestation officielle avec signature PDG et QR Code."
                                        : "Indiquez la raison motivant ce refus."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-5">
                            <label className="text-sm font-medium text-foreground">
                                {decisionModal.action === "approve"
                                    ? "Commentaire ou Visa (facultatif)"
                                    : "Motif du rejet (obligatoire)"}
                            </label>
                            <textarea
                                value={decisionModal.comment}
                                onChange={(e) =>
                                    setDecisionModal((prev) => ({ ...prev, comment: e.target.value }))
                                }
                                rows={3}
                                placeholder={
                                    decisionModal.action === "approve"
                                        ? "Autorisation accordée par la Direction Générale."
                                        : "Ex: Nécessité de service, planning surchargé..."
                                }
                                className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() =>
                                    setDecisionModal({
                                        isOpen: false,
                                        request: null,
                                        action: "approve",
                                        comment: "",
                                    })
                                }
                                className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted text-foreground transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleConfirmDecision}
                                disabled={ceoApprove.isPending || ceoReject.isPending}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${decisionModal.action === "approve"
                                    ? "bg-primary text-white hover:bg-primary/90"
                                    : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                            >
                                {decisionModal.action === "approve" ? (
                                    <>
                                        <Check size={14} />
                                        {ceoApprove.isPending ? "Signature..." : "Apposer mon Visa"}
                                    </>
                                ) : (
                                    <>
                                        <X size={14} />
                                        {ceoReject.isPending ? "Rejet..." : "Confirmer le Refus"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
