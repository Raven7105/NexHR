import { useState } from "react";
import {
    Plus,
    Check,
    X,
    Calendar,
    Clock3,
    BadgeCheck,
    Sparkles,
    Ban,
    MessageSquare,
    Search,
    Tag,
    Edit2,
    Trash2,
    SlidersHorizontal,
    User,
    Users,
    FileText,
    Download,
    Eye,
    ShieldCheck,
    FileCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    useLeaveTypes,
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType,
    useLeaveRequests,
    useLeaveBalances,
    useMyLeaveBalances,
    useCreateLeaveBalance,
    useUpdateLeaveBalance,
    useDeleteLeaveBalance,
    useCreateLeaveRequest,
    useManagerApproveLeaveRequest,
    useManagerRejectLeaveRequest,
    useHrApproveLeaveRequest,
    useHrRejectLeaveRequest,
    useCeoApproveLeaveRequest,
    useCeoRejectLeaveRequest,
} from "@/hooks/useLeaves";
import { downloadLeavePdf } from "@/api/leaves";
import { useEmployees } from "@/hooks/useEmployees";
import LeaveApprovalTimeline from "@/components/LeaveApprovalTimeline";
import type { LeaveType, LeaveBalance, LeaveRequest } from "@/types";
import { toast } from "sonner";

const STATUT_LABELS: Record<string, string> = {
    PENDING_MANAGER: "En attente du Manager",
    PENDING_HR: "En attente des RH",
    PENDING_CEO: "En attente du PDG",
    APPROVED: "Approuvé (PDF disponible)",
    REJECTED: "Rejeté",
    CANCELLED: "Annulé",
    en_attente: "En attente du Manager",
    approuve: "Approuvé",
    rejete: "Rejeté",
    annule: "Annulé",
};

const STATUT_COLORS: Record<string, string> = {
    PENDING_MANAGER: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
    PENDING_HR: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300",
    PENDING_CEO: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
    REJECTED: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
    CANCELLED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
    en_attente: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300",
    approuve: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300",
    rejete: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300",
    annule: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300",
};

export default function LeavesPage() {
    const { user } = useAuth();
    const isEmployee = user?.role === "employe";
    const isManager = user?.role === "manager";
    const isHR = user?.role === "responsable_rh" || user?.role === "admin_rh";
    const isCEO = user?.role === "pdg";
    const isSuperAdmin = user?.role === "superadmin";

    const myEmployeeId = user?.employee_profile?.id;

    // Active tab
    const [activeTab, setActiveTab] = useState<"all" | "pending_manager" | "pending_hr" | "pending_ceo" | "my">(
        isCEO ? "pending_ceo" : isHR ? "pending_hr" : isManager ? "pending_manager" : "all"
    );
    const [search, setSearch] = useState("");

    // Queries
    const { data: leaveTypesData } = useLeaveTypes();
    const { data: leavesData, isLoading } = useLeaveRequests();
    const { data: myBalancesList } = useMyLeaveBalances();
    const { data: balancesData } = useLeaveBalances(myEmployeeId ? { employee: myEmployeeId } : {});
    const { data: allBalancesData } = useLeaveBalances();
    const { data: employeesData } = useEmployees();

    // Mutations
    const createLeaveType = useCreateLeaveType();
    const updateLeaveType = useUpdateLeaveType();
    const deleteLeaveType = useDeleteLeaveType();

    const createLeaveBalance = useCreateLeaveBalance();
    const updateLeaveBalance = useUpdateLeaveBalance();
    const deleteLeaveBalance = useDeleteLeaveBalance();

    const createLeaveRequest = useCreateLeaveRequest();

    // 3-Tier Workflow Mutations
    const managerApprove = useManagerApproveLeaveRequest();
    const managerReject = useManagerRejectLeaveRequest();
    const hrApprove = useHrApproveLeaveRequest();
    const hrReject = useHrRejectLeaveRequest();
    const ceoApprove = useCeoApproveLeaveRequest();
    const ceoReject = useCeoRejectLeaveRequest();

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageLeaveTypesOpen, setIsManageLeaveTypesOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [isManageBalancesOpen, setIsManageBalancesOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

    // Modal de décision d'approbation / rejet
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        request: LeaveRequest | null;
        action: "manager_approve" | "manager_reject" | "hr_approve" | "hr_reject" | "ceo_approve" | "ceo_reject";
        comment: string;
    }>({
        isOpen: false,
        request: null,
        action: "manager_approve",
        comment: "",
    });

    // Formulaire de nouvelle demande
    const [formData, setFormData] = useState({
        leave_type: "",
        date_debut: "",
        date_fin: "",
        motif: "",
    });

    // Formulaire type de congé
    const [typeFormData, setTypeFormData] = useState({
        nom: "",
        jours_par_an: 25,
        couleur: "#378ADD",
    });

    // Formulaire solde de congé
    const [balanceFormData, setBalanceFormData] = useState({
        employee: "",
        leave_type: "",
        annee: new Date().getFullYear(),
        jours_alloues: "25",
        jours_utilises: "0",
    });

    const leaveTypes = leaveTypesData?.results ?? [];
    const allRequests = leavesData?.results ?? [];
    const balances = (myBalancesList && Array.isArray(myBalancesList) && myBalancesList.length > 0)
        ? myBalancesList
        : (balancesData?.results ?? []);
    const allBalances = allBalancesData?.results ?? [];
    const employees = employeesData?.results ?? [];

    // Handlers pour Types de Congé
    const handleSaveType = (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeFormData.nom.trim()) {
            toast.error("Le nom du type de congé est obligatoire.");
            return;
        }
        if (editingType) {
            updateLeaveType.mutate(
                { id: editingType.id, data: typeFormData },
                {
                    onSuccess: () => {
                        setEditingType(null);
                        setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#378ADD" });
                    },
                }
            );
        } else {
            createLeaveType.mutate(typeFormData, {
                onSuccess: () => {
                    setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#378ADD" });
                },
            });
        }
    };

    const handleDeleteType = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce type de congé ?")) {
            deleteLeaveType.mutate(id);
        }
    };

    const handleEditTypeClick = (lt: LeaveType) => {
        setEditingType(lt);
        setTypeFormData({ nom: lt.nom, jours_par_an: lt.jours_par_an, couleur: lt.couleur || "#378ADD" });
    };

    // Handlers pour Soldes d'Employés
    const handleSaveBalance = (e: React.FormEvent) => {
        e.preventDefault();
        if (!balanceFormData.employee || !balanceFormData.leave_type) {
            toast.error("Veuillez sélectionner un employé et un type de congé.");
            return;
        }
        if (editingBalance) {
            updateLeaveBalance.mutate(
                {
                    id: editingBalance.id,
                    data: {
                        jours_alloues: balanceFormData.jours_alloues,
                        jours_utilises: balanceFormData.jours_utilises,
                        annee: balanceFormData.annee,
                    },
                },
                {
                    onSuccess: () => {
                        setEditingBalance(null);
                        setBalanceFormData({ employee: "", leave_type: "", annee: new Date().getFullYear(), jours_alloues: "25", jours_utilises: "0" });
                    },
                }
            );
        } else {
            createLeaveBalance.mutate(balanceFormData, {
                onSuccess: () => {
                    setBalanceFormData({ employee: "", leave_type: "", annee: new Date().getFullYear(), jours_alloues: "25", jours_utilises: "0" });
                },
            });
        }
    };

    const handleDeleteBalance = (id: string) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce solde ?")) {
            deleteLeaveBalance.mutate(id);
        }
    };

    const handleEditBalanceClick = (b: LeaveBalance) => {
        setEditingBalance(b);
        setBalanceFormData({
            employee: b.employee,
            leave_type: b.leave_type,
            annee: b.annee,
            jours_alloues: String(b.jours_alloues),
            jours_utilises: String(b.jours_utilises),
        });
    };

    // Filtrage des demandes selon les onglets et le rôle
    const filteredRequests = allRequests.filter((req) => {
        const empName = req.employee_detail?.nom_complet || "";
        const matchesSearch =
            empName.toLowerCase().includes(search.toLowerCase()) ||
            req.leave_type_nom?.toLowerCase().includes(search.toLowerCase()) ||
            req.statut.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        if (activeTab === "pending_manager") {
            return req.statut === "PENDING_MANAGER" || req.statut === "en_attente";
        }
        if (activeTab === "pending_hr") {
            return req.statut === "PENDING_HR";
        }
        if (activeTab === "pending_ceo") {
            return req.statut === "PENDING_CEO";
        }
        if (activeTab === "my") {
            return req.employee === myEmployeeId;
        }

        return true;
    });

    const handleCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.leave_type || !formData.date_debut || !formData.date_fin) {
            toast.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        createLeaveRequest.mutate(
            {
                leave_type: formData.leave_type,
                date_debut: formData.date_debut,
                date_fin: formData.date_fin,
                motif: formData.motif,
                employee: myEmployeeId || "",
                nombre_jours: "0",
            },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setFormData({ leave_type: "", date_debut: "", date_fin: "", motif: "" });
                },
            }
        );
    };

    const handleActionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionModal.request) return;

        const id = actionModal.request.id;
        const comment = actionModal.comment;

        switch (actionModal.action) {
            case "manager_approve":
                managerApprove.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
            case "manager_reject":
                if (!comment.trim()) { toast.error("Le motif du rejet est obligatoire."); return; }
                managerReject.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
            case "hr_approve":
                hrApprove.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
            case "hr_reject":
                if (!comment.trim()) { toast.error("Le motif du rejet est obligatoire."); return; }
                hrReject.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
            case "ceo_approve":
                ceoApprove.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
            case "ceo_reject":
                if (!comment.trim()) { toast.error("Le motif du rejet est obligatoire."); return; }
                ceoReject.mutate({ id, comment }, { onSuccess: () => setActionModal({ ...actionModal, isOpen: false }) });
                break;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <FileText className="text-primary" size={28} />
                        Gestion & Validation des Congés
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Workflow d'approbation séquentiel sécurisé : Employé → Manager → Responsable RH → PDG
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {(isHR || isSuperAdmin) && (
                        <>
                            <button
                                onClick={() => setIsManageLeaveTypesOpen(true)}
                                className="flex items-center gap-2 border border-border bg-card px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors shadow-sm"
                            >
                                <Tag size={16} className="text-primary" /> Configuration Types
                            </button>

                            <button
                                onClick={() => setIsManageBalancesOpen(true)}
                                className="flex items-center gap-2 border border-border bg-card px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors shadow-sm"
                            >
                                <SlidersHorizontal size={16} className="text-primary" /> Soldes Employés
                            </button>
                        </>
                    )}

                    {user?.role !== "pdg" && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
                        >
                            <Plus size={16} /> Nouvelle Demande
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Dynamiques des soldes personnels de l'utilisateur connecté */}
            {balances.length > 0 && user?.role !== "pdg" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {balances.map((b) => {
                        const leaveTypeNom = b.leave_type_nom || leaveTypes.find((lt) => lt.id === b.leave_type)?.nom || "Type de congé";
                        const leaveTypeCouleur = b.leave_type_couleur || leaveTypes.find((lt) => lt.id === b.leave_type)?.couleur || "#3B82F6";
                        const total = parseFloat(b.jours_alloues);
                        const used = parseFloat(b.jours_utilises);
                        const remaining = b.jours_restants !== undefined ? parseFloat(String(b.jours_restants)) : Math.max(0, total - used);
                        const percent = total > 0 ? (used / total) * 100 : 0;

                        return (
                            <div key={b.id} className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                                <div
                                    className="absolute top-0 left-0 right-0 h-1.5"
                                    style={{ backgroundColor: leaveTypeCouleur }}
                                />
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                                        {leaveTypeNom}
                                    </p>
                                    <span className="text-[10px] font-mono text-muted-foreground font-semibold px-2 py-0.5 bg-muted rounded-md">
                                        {used} utilisé{used > 1 ? "s" : ""}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-3">
                                    <span className="text-2xl font-extrabold text-foreground">{remaining}</span>
                                    <span className="text-xs text-muted-foreground font-medium">/ {total} j restants</span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 mt-3 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(100, percent)}%`,
                                            backgroundColor: leaveTypeCouleur,
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Barre de Recherche et Onglets de Filtre par Rôle */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Navigation Onglets */}
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Toutes ({allRequests.length})
                        </button>

                        {(isManager || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab("pending_manager")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === "pending_manager" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Étape 1 : Manager (
                                {allRequests.filter((r) => r.statut === "PENDING_MANAGER" || r.statut === "en_attente").length})
                            </button>
                        )}

                        {(isHR || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab("pending_hr")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === "pending_hr" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Étape 2 : RH ({allRequests.filter((r) => r.statut === "PENDING_HR").length})
                            </button>
                        )}

                        {(isCEO || isSuperAdmin) && (
                            <button
                                onClick={() => setActiveTab("pending_ceo")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === "pending_ceo" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Étape 3 : PDG / Direction ({allRequests.filter((r) => r.statut === "PENDING_CEO").length})
                            </button>
                        )}

                        {myEmployeeId && (
                            <button
                                onClick={() => setActiveTab("my")}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${activeTab === "my" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Mes Demandes ({allRequests.filter((r) => r.employee === myEmployeeId).length})
                            </button>
                        )}
                    </div>

                    {/* Barre de Recherche */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher employé, type..."
                            className="w-full border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* Tableau des Demandes de Congé */}
                {isLoading ? (
                    <div className="py-16 text-center text-muted-foreground">Chargement des demandes de congé...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground">Aucune demande de congé trouvée dans cette catégorie.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="py-3 px-4">Employé</th>
                                    <th className="py-3 px-4">Type</th>
                                    <th className="py-3 px-4">Période</th>
                                    <th className="py-3 px-4 text-center">Durée</th>
                                    <th className="py-3 px-4">Statut Workflow</th>
                                    <th className="py-3 px-4 text-right">Actions de Validation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filteredRequests.map((req) => {
                                    const empName = req.employee_detail?.nom_complet || "Employé";
                                    const empDept = req.employee_detail?.department_nom || "";

                                    const canManagerAct = (isManager || isSuperAdmin) && (req.statut === "PENDING_MANAGER" || req.statut === "en_attente");
                                    const canHRAct = (isHR || isSuperAdmin) && req.statut === "PENDING_HR";
                                    const canCEOAct = (isCEO || isSuperAdmin) && req.statut === "PENDING_CEO";

                                    return (
                                        <tr key={req.id} className="hover:bg-muted/40 transition-colors">
                                            <td className="py-3.5 px-4 font-medium text-foreground">
                                                <div>
                                                    <p className="font-semibold text-foreground">{empName}</p>
                                                    <p className="text-[11px] text-muted-foreground">{empDept}</p>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                                                    style={{
                                                        backgroundColor: `${req.leave_type_couleur || "#3B82F6"}15`,
                                                        color: req.leave_type_couleur || "#3B82F6",
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: req.leave_type_couleur || "#3B82F6" }} />
                                                    {req.leave_type_nom || "Congé"}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-muted-foreground">
                                                <div className="flex items-center gap-1 font-mono text-[11px]">
                                                    <Calendar size={13} className="text-muted-foreground/70" />
                                                    {new Date(req.date_debut).toLocaleDateString("fr-FR")} → {new Date(req.date_fin).toLocaleDateString("fr-FR")}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-foreground">
                                                {req.nombre_jours} j
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${STATUT_COLORS[req.statut] || STATUT_COLORS.en_attente}`}>
                                                    {STATUT_LABELS[req.statut] || req.statut}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedRequest(req)}
                                                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                        title="Voir la timeline et le journal"
                                                    >
                                                        <Eye size={15} />
                                                    </button>

                                                    {canManagerAct && (
                                                        <>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "manager_approve", comment: "" })}
                                                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Check size={14} /> Valider MGR
                                                            </button>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "manager_reject", comment: "" })}
                                                                className="px-2 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-colors shadow-sm"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {canHRAct && (
                                                        <>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "hr_approve", comment: "" })}
                                                                className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <Check size={14} /> Valider RH
                                                            </button>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "hr_reject", comment: "" })}
                                                                className="px-2 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-colors shadow-sm"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {canCEOAct && (
                                                        <>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "ceo_approve", comment: "" })}
                                                                className="px-2.5 py-1 rounded-lg bg-purple-600 text-white font-medium text-xs hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <ShieldCheck size={14} /> Signer (PDG)
                                                            </button>
                                                            <button
                                                                onClick={() => setActionModal({ isOpen: true, request: req, action: "ceo_reject", comment: "" })}
                                                                className="px-2 py-1 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition-colors shadow-sm"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {(req.statut === "APPROVED" || req.statut === "approuve") && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    toast.info("Téléchargement de l'autorisation PDF en cours...");
                                                                    await downloadLeavePdf(req.id, req.authorization_number || undefined);
                                                                    toast.success("Autorisation PDF téléchargée avec succès !");
                                                                } catch (err: any) {
                                                                    toast.error(err?.response?.data?.detail || "Erreur lors du téléchargement du PDF.");
                                                                }
                                                            }}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-300 font-medium text-xs hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                            title="Télécharger l'autorisation PDF"
                                                        >
                                                            <Download size={14} /> PDF
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL 1 : CONFIGURATION DES TYPES DE CONGÉS */}
            {isManageLeaveTypesOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Tag size={20} className="text-primary" /> Configuration des Types de Congés
                            </h2>
                            <button
                                onClick={() => {
                                    setIsManageLeaveTypesOpen(false);
                                    setEditingType(null);
                                    setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#378ADD" });
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulaire de création / édition */}
                        <form onSubmit={handleSaveType} className="bg-muted/40 border border-border rounded-xl p-4 mb-6 space-y-4">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                {editingType ? `Éditer : ${editingType.nom}` : "Ajouter un nouveau type de congé"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="sm:col-span-1">
                                    <label className="block text-xs font-semibold text-foreground mb-1">Nom du type *</label>
                                    <input
                                        type="text"
                                        value={typeFormData.nom}
                                        onChange={(e) => setTypeFormData({ ...typeFormData, nom: e.target.value })}
                                        placeholder="ex: Congé Payé, RTT..."
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Jours / an *</label>
                                    <input
                                        type="number"
                                        value={typeFormData.jours_par_an}
                                        onChange={(e) => setTypeFormData({ ...typeFormData, jours_par_an: parseInt(e.target.value) || 0 })}
                                        min="0"
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Couleur d'affichage</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={typeFormData.couleur}
                                            onChange={(e) => setTypeFormData({ ...typeFormData, couleur: e.target.value })}
                                            className="h-8 w-12 border border-border rounded cursor-pointer bg-background p-0.5"
                                        />
                                        <span className="text-xs font-mono text-muted-foreground">{typeFormData.couleur}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingType && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingType(null);
                                            setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#378ADD" });
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-border text-xs"
                                    >
                                        Annuler Édition
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={createLeaveType.isPending || updateLeaveType.isPending}
                                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-sm"
                                >
                                    {editingType ? "Enregistrer les modifications" : "Créer le type"}
                                </button>
                            </div>
                        </form>

                        {/* Liste des types existants */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                                Types de congés configurés ({leaveTypes.length})
                            </h3>

                            {leaveTypes.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">Aucun type de congé configuré.</p>
                            ) : (
                                <div className="divide-y divide-border/60 border border-border rounded-xl overflow-hidden">
                                    {leaveTypes.map((lt) => (
                                        <div key={lt.id} className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <span className="w-4 h-4 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: lt.couleur || "#378ADD" }} />
                                                <div>
                                                    <p className="text-xs font-semibold text-foreground">{lt.nom}</p>
                                                    <p className="text-[11px] text-muted-foreground">{lt.jours_par_an} jours alloués / an par défaut</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditTypeClick(lt)}
                                                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Éditer"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteType(lt.id)}
                                                    className="p-1.5 rounded-lg border border-border text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2 : GESTION ET AJUSTEMENT DES SOLDES D'EMPLOYÉS */}
            {isManageBalancesOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <SlidersHorizontal size={20} className="text-primary" /> Ajuster les Soldes d'Employés
                            </h2>
                            <button
                                onClick={() => {
                                    setIsManageBalancesOpen(false);
                                    setEditingBalance(null);
                                    setBalanceFormData({ employee: "", leave_type: "", annee: new Date().getFullYear(), jours_alloues: "25", jours_utilises: "0" });
                                }}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulaire d'attribution / mise à jour des soldes */}
                        <form onSubmit={handleSaveBalance} className="bg-muted/40 border border-border rounded-xl p-4 mb-6 space-y-4">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">
                                {editingBalance ? "Modifier le solde existant" : "Attribuer ou modifier un solde d'employé"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Employé *</label>
                                    <select
                                        value={balanceFormData.employee}
                                        onChange={(e) => setBalanceFormData({ ...balanceFormData, employee: e.target.value })}
                                        disabled={Boolean(editingBalance)}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background disabled:opacity-60"
                                    >
                                        <option value="">Sélectionner un employé...</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nom_complet} ({emp.matricule})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Type de congé *</label>
                                    <select
                                        value={balanceFormData.leave_type}
                                        onChange={(e) => setBalanceFormData({ ...balanceFormData, leave_type: e.target.value })}
                                        disabled={Boolean(editingBalance)}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background disabled:opacity-60"
                                    >
                                        <option value="">Sélectionner un type...</option>
                                        {leaveTypes.map((lt) => (
                                            <option key={lt.id} value={lt.id}>
                                                {lt.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Année *</label>
                                    <input
                                        type="number"
                                        value={balanceFormData.annee}
                                        onChange={(e) => setBalanceFormData({ ...balanceFormData, annee: parseInt(e.target.value) || new Date().getFullYear() })}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Jours Alloués *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={balanceFormData.jours_alloues}
                                        onChange={(e) => setBalanceFormData({ ...balanceFormData, jours_alloues: e.target.value })}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Jours Utilisés *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        value={balanceFormData.jours_utilises}
                                        onChange={(e) => setBalanceFormData({ ...balanceFormData, jours_utilises: e.target.value })}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-xs bg-background"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                {editingBalance && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingBalance(null);
                                            setBalanceFormData({ employee: "", leave_type: "", annee: new Date().getFullYear(), jours_alloues: "25", jours_utilises: "0" });
                                        }}
                                        className="px-3 py-1.5 rounded-lg border border-border text-xs"
                                    >
                                        Annuler
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={createLeaveBalance.isPending || updateLeaveBalance.isPending}
                                    className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-sm"
                                >
                                    {editingBalance ? "Mettre à jour le solde" : "Attribuer / Enregistrer"}
                                </button>
                            </div>
                        </form>

                        {/* Liste des soldes existants */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2">
                                Historique des soldes attribués ({allBalances.length})
                            </h3>

                            {allBalances.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">Aucun solde d'employé enregistré.</p>
                            ) : (
                                <div className="overflow-x-auto border border-border rounded-xl">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider">
                                            <tr>
                                                <th className="py-2.5 px-3">Employé</th>
                                                <th className="py-2.5 px-3">Type</th>
                                                <th className="py-2.5 px-3 text-center">Année</th>
                                                <th className="py-2.5 px-3 text-center">Alloués</th>
                                                <th className="py-2.5 px-3 text-center">Utilisés</th>
                                                <th className="py-2.5 px-3 text-center">Restants</th>
                                                <th className="py-2.5 px-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60">
                                            {allBalances.map((b) => {
                                                const emp = employees.find((e) => e.id === b.employee);
                                                const lt = leaveTypes.find((t) => t.id === b.leave_type);
                                                const total = parseFloat(b.jours_alloues);
                                                const used = parseFloat(b.jours_utilises);
                                                const remaining = Math.max(0, total - used);

                                                return (
                                                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                                                        <td className="py-2.5 px-3 font-semibold text-foreground">
                                                            {emp?.nom_complet || b.employee}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-muted-foreground">
                                                            {lt?.nom || b.leave_type}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-mono">
                                                            {b.annee}
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center font-bold text-foreground">
                                                            {b.jours_alloues} j
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-amber-600 font-semibold">
                                                            {b.jours_utilises} j
                                                        </td>
                                                        <td className="py-2.5 px-3 text-center text-emerald-600 font-bold">
                                                            {remaining} j
                                                        </td>
                                                        <td className="py-2.5 px-3 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    onClick={() => handleEditBalanceClick(b)}
                                                                    className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                                    title="Modifier"
                                                                >
                                                                    <Edit2 size={13} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBalance(b.id)}
                                                                    className="p-1.5 rounded-lg border border-border text-rose-500 hover:bg-rose-500/10 transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal : Nouvelle demande de congé */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground">Soumettre une demande de congé</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Type de congé *</label>
                                <select
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                                    required
                                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                >
                                    <option value="">Sélectionner un type...</option>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id} value={lt.id}>
                                            {lt.nom} ({lt.jours_par_an}j/an)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Date de début *</label>
                                    <input
                                        type="date"
                                        value={formData.date_debut}
                                        onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground mb-1">Date de fin *</label>
                                    <input
                                        type="date"
                                        value={formData.date_fin}
                                        onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                                        required
                                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground mb-1">Motif / Commentaire</label>
                                <textarea
                                    value={formData.motif}
                                    onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                                    rows={3}
                                    placeholder="Raison de la demande..."
                                    className="w-full border border-border rounded-lg p-3 text-sm bg-background"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-border text-sm">
                                    Annuler
                                </button>
                                <button type="submit" disabled={createLeaveRequest.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                                    {createLeaveRequest.isPending ? "Envoi..." : "Soumettre au Manager"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal : Détails & Timeline Visuelle */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <FileCheck size={20} className="text-primary" />
                                    Détails de la demande & Suivi
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Employé : {selectedRequest.employee_detail?.nom_complet || "Employé"} ({selectedRequest.employee_detail?.matricule})
                                </p>
                            </div>
                            <button onClick={() => setSelectedRequest(null)} className="text-muted-foreground hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Timeline */}
                        <LeaveApprovalTimeline request={selectedRequest} />

                        {(selectedRequest.statut === "APPROVED" || selectedRequest.statut === "approuve") && (
                            <div className="mt-6 p-4 bg-muted/40 rounded-xl flex items-center justify-between border border-border">
                                <div>
                                    <p className="text-xs font-semibold text-foreground">Autorisation officielle signée par le PDG</p>
                                    <p className="text-[11px] text-muted-foreground">Réf: {selectedRequest.authorization_number}</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            toast.info("Téléchargement du PDF en cours...");
                                            await downloadLeavePdf(selectedRequest.id, selectedRequest.authorization_number || undefined);
                                            toast.success("Autorisation PDF téléchargée avec succès !");
                                        } catch (err: any) {
                                            toast.error(err?.response?.data?.detail || "Erreur lors du téléchargement du PDF.");
                                        }
                                    }}
                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                                >
                                    <Download size={14} /> Télécharger le PDF officiel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal : Action d'approbation / rejet */}
            {actionModal.isOpen && actionModal.request && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-foreground">
                                {actionModal.action.endsWith("approve") ? "Confirmation d'approbation" : "Motif de rejet obligatoire"}
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
                                    {actionModal.action.endsWith("reject") ? "Motif du rejet *" : "Commentaire (Optionnel)"}
                                </label>
                                <textarea
                                    value={actionModal.comment}
                                    onChange={(e) => setActionModal({ ...actionModal, comment: e.target.value })}
                                    rows={3}
                                    required={actionModal.action.endsWith("reject")}
                                    placeholder={actionModal.action.endsWith("reject") ? "Expliquez la raison du rejet..." : "Remarques éventuelles..."}
                                    className="w-full border border-border rounded-lg p-2.5 text-xs bg-background"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-3 border-t border-border">
                                <button type="button" onClick={() => setActionModal({ ...actionModal, isOpen: false })} className="px-3.5 py-1.5 rounded-lg border border-border text-xs">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-1.5 rounded-lg text-white font-medium text-xs shadow-sm ${actionModal.action.endsWith("approve") ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                                        }`}
                                >
                                    {actionModal.action.endsWith("approve") ? "Confirmer la validation" : "Confirmer le rejet"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}