import { useState } from "react";
import {
    ShieldCheck,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Users,
    Wallet,
    Eye,
    X,
    Check,
    FileSignature,
    Download,
    Award,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import { useAuth } from "@/context/AuthContext";
import {
    useLeaveRequests,
    useLeaveTypes,
    useCeoApproveLeaveRequest,
    useCeoRejectLeaveRequest,
} from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useAttendances } from "@/hooks/useAttendance";
import { downloadLeavePdf } from "@/api/leaves";
import LeaveApprovalTimeline from "@/components/LeaveApprovalTimeline";
import type { LeaveRequest } from "@/types";
import { toast } from "sonner";

function getEmployeeEmail(emp?: any): string {
    if (!emp) return "Collaborateur";
    if (typeof emp.user === "object" && emp.user?.email) return emp.user.email;
    return emp.user_email || emp.matricule || "Collaborateur";
}

export default function CeoDashboard() {
    const { user } = useAuth();
    const { data: leavesData, isLoading: leavesLoading } = useLeaveRequests();
    const { data: leaveTypesData } = useLeaveTypes();
    const { data: employeesData } = useEmployees();
    const { data: departmentsData } = useDepartments();

    const todayStr = new Date().toISOString().split("T")[0];
    const { data: todayAttendances } = useAttendances({ date: todayStr });

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
    const leaveTypes = leaveTypesData?.results ?? [];
    const employees = employeesData?.results ?? [];
    const departments = departmentsData?.results ?? [];

    // Demandes en attente de signature PDG
    const pendingCeoRequests = requests.filter((r) => r.statut === "PENDING_CEO");
    const approvedRequests = requests.filter((r) => r.statut === "APPROVED" || r.statut === "approuve");

    // Calcul Masse Salariale
    const totalPayroll = employees.reduce((acc, emp) => {
        const base = parseFloat(emp.salaire_de_base || "0");
        return acc + (isNaN(base) ? 0 : base);
    }, 0);

    const formattedPayroll = totalPayroll > 0
        ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(totalPayroll) + " FCFA"
        : "N/A";

    // Taux d'assiduité du jour
    const presentCount = (todayAttendances ?? []).filter((a) => a.statut === "present").length;
    const attendanceRate = employees.length > 0
        ? Math.round((presentCount / employees.length) * 100)
        : 100;

    // Répartition des contrats
    const contractCounts = employees.reduce<Record<string, number>>((acc, emp) => {
        const c = emp.type_contrat || "cdi";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {});

    const contractData = [
        { name: "CDI", value: contractCounts["cdi"] || 0, color: "#10b981" },
        { name: "CDD", value: contractCounts["cdd"] || 0, color: "#2563eb" },
        { name: "Stage", value: contractCounts["stage"] || 0, color: "#f59e0b" },
        { name: "Autre", value: contractCounts["freelance"] || 0, color: "#7c3aed" },
    ].filter((item) => item.value > 0);

    // Masse salariale par département pour le BarChart
    const deptSalaryData = departments.map((dept) => {
        const deptEmps = employees.filter((e) => e.department === dept.id);
        const deptTotal = deptEmps.reduce((sum, e) => sum + (parseFloat(e.salaire_de_base || "0") || 0), 0);
        return {
            nom: dept.nom.length > 14 ? dept.nom.slice(0, 12) + "..." : dept.nom,
            salaire: Math.round(deptTotal / 1000), // En milliers
            effectif: deptEmps.length,
        };
    }).filter((d) => d.effectif > 0);

    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionModal.request) return;

        const id = actionModal.request.id;
        const comment = actionModal.comment;

        if (actionModal.action === "ceo_approve") {
            ceoApprove.mutate(
                { id, comment: comment || "Autorisation accordée par la Direction Générale." },
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
        <div>
            {/* Header d'Accueil Exécutif (Même Vibe que la plateforme) */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
                        {user?.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold">
                            Bonjour {user?.email ? user.email.split("@")[0] : "Monsieur le Directeur Général"} 👋
                        </h1>
                        <div className="flex items-center gap-4 text-blue-100 text-sm mt-1">
                            <span className="flex items-center gap-1 font-medium">
                                <Award size={14} /> Direction Générale • Cockpit Stratégique
                            </span>
                            <span>•</span>
                            <span>
                                {new Date().toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cartes KPI Standard de la Plateforme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 1. Arbitrages en attente */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                        <ShieldCheck className="text-amber-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{pendingCeoRequests.length}</p>
                    <p className="text-sm text-muted-foreground">Arbitrages en attente (Visa PDG)</p>
                </div>

                {/* 2. Effectif Total */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                        <Users className="text-blue-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{employees.length}</p>
                    <p className="text-sm text-muted-foreground">Effectif total ({departments.length} départements)</p>
                </div>

                {/* 3. Masse Salariale */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                        <Wallet className="text-green-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{formattedPayroll}</p>
                    <p className="text-sm text-muted-foreground">Masse salariale mensuelle</p>
                </div>

                {/* 4. Taux de Présence */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                        <TrendingUp className="text-purple-600" size={20} />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{attendanceRate}%</p>
                    <p className="text-sm text-muted-foreground">Taux de présence aujourd'hui</p>
                </div>
            </div>

            {/* Graphiques Décisionnels */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* BarChart Masse Salariale */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Masse salariale par département (en k FCFA)</h2>
                    {deptSalaryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={230}>
                            <BarChart data={deptSalaryData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis dataKey="nom" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    formatter={(val: any) => [`${val} k FCFA`, "Masse Salariale"]}
                                />
                                <Bar dataKey="salaire" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                            Aucune donnée de salaire par département.
                        </div>
                    )}
                </div>

                {/* Donut Répartition Contrats */}
                <div className="bg-card border border-border rounded-xl p-5">
                    <h2 className="font-semibold text-foreground mb-4">Typologie des contrats</h2>
                    {contractData.length > 0 ? (
                        <div className="flex flex-col items-center">
                            <ResponsiveContainer width="100%" height={160}>
                                <PieChart>
                                    <Pie
                                        data={contractData}
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {contractData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-xs">
                                {contractData.map((c) => (
                                    <div key={c.name} className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                                        <span className="text-muted-foreground">{c.name} :</span>
                                        <span className="font-semibold text-foreground">{c.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                            Aucun contrat enregistré.
                        </div>
                    )}
                </div>
            </div>

            {/* Section 1 : DEMANDES EN ATTENTE DE SIGNATURE PDG */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <ShieldCheck className="text-amber-600" size={20} />
                            Demandes de congés à valider (Visa PDG)
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Dossiers vérifiés par les RH en attente de votre signature finale.
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
                        {pendingCeoRequests.length} en attente
                    </span>
                </div>

                {leavesLoading ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                        Chargement des dossiers...
                    </div>
                ) : pendingCeoRequests.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border">
                        <CheckCircle2 size={32} className="mx-auto text-green-600 mb-2" />
                        <p className="text-sm font-medium text-foreground">Aucune demande en attente de votre visa</p>
                        <p className="text-xs mt-1">Tous les dossiers soumis à la Direction Générale sont à jour.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {pendingCeoRequests.map((req) => {
                            const emp = employees.find((e) => e.id === req.employee);
                            const lt = leaveTypes.find((t) => t.id === req.leave_type);

                            return (
                                <div
                                    key={req.id}
                                    className="p-4 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-border/80 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                                            {getEmployeeEmail(emp).charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-foreground">
                                                    {getEmployeeEmail(emp)}
                                                </p>
                                                <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {emp?.matricule}
                                                </span>
                                                <span
                                                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                                                    style={{
                                                        backgroundColor: `${lt?.couleur || "#3B82F6"}20`,
                                                        color: lt?.couleur || "#3B82F6",
                                                    }}
                                                >
                                                    {lt?.nom || "Congé"}
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

                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted text-xs flex items-center gap-1"
                                            title="Consulter le dossier"
                                        >
                                            <Eye size={14} /> Dossier
                                        </button>
                                        <button
                                            onClick={() =>
                                                setActionModal({
                                                    isOpen: true,
                                                    request: req,
                                                    action: "ceo_reject",
                                                    comment: "",
                                                })
                                            }
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                                        >
                                            Refuser
                                        </button>
                                        <button
                                            onClick={() =>
                                                setActionModal({
                                                    isOpen: true,
                                                    request: req,
                                                    action: "ceo_approve",
                                                    comment: "Autorisation accordée par la Direction Générale.",
                                                })
                                            }
                                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                                        >
                                            <FileSignature size={14} />
                                            Signer
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Section 2 : REGISTRE DES DERNIÈRES AUTORISATIONS OFFICIELLES ACCORDÉES */}
            <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="font-semibold text-foreground flex items-center gap-2">
                            <CheckCircle2 className="text-green-600" size={20} />
                            Dernières autorisations accordées par la Direction
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Historique des congés validés avec attestation PDF officielle générée.
                        </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                        {approvedRequests.length} accordée{approvedRequests.length > 1 ? "s" : ""}
                    </span>
                </div>

                {approvedRequests.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        Aucune autorisation signée pour le moment.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                                <tr>
                                    <th className="py-2.5 px-4">Collaborateur</th>
                                    <th className="py-2.5 px-4">Type</th>
                                    <th className="py-2.5 px-4">Période</th>
                                    <th className="py-2.5 px-4">Durée</th>
                                    <th className="py-2.5 px-4">Date Visa PDG</th>
                                    <th className="py-2.5 px-4 text-right">Attestation PDF</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {approvedRequests.slice(0, 5).map((req) => {
                                    const emp = employees.find((e) => e.id === req.employee);
                                    const lt = leaveTypes.find((t) => t.id === req.leave_type);

                                    return (
                                        <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-medium text-foreground">
                                                {getEmployeeEmail(emp)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${lt?.couleur || "#3B82F6"}20`,
                                                        color: lt?.couleur || "#3B82F6",
                                                    }}
                                                >
                                                    {lt?.nom || "Congé"}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {req.date_debut} → {req.date_fin}
                                            </td>
                                            <td className="py-3 px-4 font-semibold text-foreground">
                                                {req.nombre_jours} j
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {req.date_validation_ceo
                                                    ? new Date(req.date_validation_ceo).toLocaleDateString("fr-FR")
                                                    : "Récemment"}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <button
                                                    onClick={() => downloadLeavePdf(req.id)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                                                >
                                                    <Download size={13} /> Télécharger
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Consultation Complète du Dossier */}
            {selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl w-full max-w-xl p-6 shadow-xl">
                        <div className="flex items-center justify-between pb-4 border-b border-border">
                            <h3 className="font-semibold text-foreground">Dossier de Congé</h3>
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
                                    Chaîne de Validation Hiérarchique
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
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center ${actionModal.action === "ceo_approve"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-red-100 text-red-600"
                                    }`}
                            >
                                {actionModal.action === "ceo_approve" ? (
                                    <FileSignature size={20} />
                                ) : (
                                    <XCircle size={20} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">
                                    {actionModal.action === "ceo_approve"
                                        ? "Visa & Signature Direction"
                                        : "Refus du dossier de congé"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {actionModal.action === "ceo_approve"
                                        ? "Génère l'attestation officielle avec signature PDG et QR Code."
                                        : "Indiquez la raison motivant ce refus."}
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleActionSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">
                                    {actionModal.action === "ceo_approve"
                                        ? "Commentaire ou Visa (facultatif)"
                                        : "Motif du rejet (obligatoire)"}
                                </label>
                                <textarea
                                    value={actionModal.comment}
                                    onChange={(e) =>
                                        setActionModal({ ...actionModal, comment: e.target.value })
                                    }
                                    rows={3}
                                    placeholder={
                                        actionModal.action === "ceo_approve"
                                            ? "Autorisation accordée par la Direction Générale."
                                            : "Ex: Nécessité de service, planning surchargé..."
                                    }
                                    className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:outline-none mt-1"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted text-foreground transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={ceoApprove.isPending || ceoReject.isPending}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${actionModal.action === "ceo_approve"
                                        ? "bg-primary text-white hover:bg-primary/90"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                        }`}
                                >
                                    {actionModal.action === "ceo_approve" ? (
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
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
