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
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    useLeaveTypes,
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType,
    useLeaveRequests,
    useLeaveBalances,
    useCreateLeaveBalance,
    useUpdateLeaveBalance,
    useDeleteLeaveBalance,
    useCreateLeaveRequest,
    useUpdateLeaveRequest,
} from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import type { LeaveType, LeaveBalance } from "@/types";

const STATUT_LABELS: Record<string, string> = {
    en_attente: "En attente",
    approuve: "Approuvé",
    rejete: "Rejeté",
    annule: "Annulé",
};

const STATUT_COLORS: Record<string, string> = {
    en_attente: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    approuve: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
    rejete: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
    annule: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export default function LeavesPage() {
    const { user } = useAuth();
    const isEmployee = user?.role === "employe";
    const isManager = user?.role === "manager";
    const isAdminRH = user?.role === "admin_rh" || user?.role === "superadmin";
    const myEmployeeId = user?.employee_profile?.id;

    // Queries
    const { data: leaveTypesData } = useLeaveTypes();
    const { data: leavesData, isLoading } = useLeaveRequests(
        isEmployee ? { employee: myEmployeeId } : {}
    );
    const { data: balancesData } = useLeaveBalances(
        myEmployeeId ? { employee: myEmployeeId } : {}
    );
    const { data: employeesData } = useEmployees();

    // Leave Types Mutations
    const createLeaveType = useCreateLeaveType();
    const updateLeaveType = useUpdateLeaveType();
    const deleteLeaveType = useDeleteLeaveType();

    // Leave Balances Mutations
    const createLeaveBalance = useCreateLeaveBalance();
    const updateLeaveBalance = useUpdateLeaveBalance();
    const deleteLeaveBalance = useDeleteLeaveBalance();

    // Leave Requests Mutations
    const createLeaveRequest = useCreateLeaveRequest();
    const updateLeaveRequest = useUpdateLeaveRequest();

    // Modals state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isManageLeaveTypesOpen, setIsManageLeaveTypesOpen] = useState(false);
    const [editingType, setEditingType] = useState<LeaveType | null>(null);
    const [isManageBalancesOpen, setIsManageBalancesOpen] = useState(false);
    const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);

    const [decisionModal, setDecisionModal] = useState<{
        isOpen: boolean;
        leaveId: string;
        action: "approuve" | "rejete";
        comment: string;
    }>({
        isOpen: false,
        leaveId: "",
        action: "approuve",
        comment: "",
    });

    // Form states
    const [formData, setFormData] = useState({
        targetType: "self" as "self" | "other",
        employee: "",
        leave_type: "",
        date_debut: "",
        date_fin: "",
        motif: "",
    });

    const [typeFormData, setTypeFormData] = useState({
        nom: "",
        jours_par_an: 25,
        couleur: "#3b82f6",
    });

    const [balanceFormData, setBalanceFormData] = useState({
        employee: "",
        leave_type: "",
        annee: new Date().getFullYear(),
        jours_alloues: "25.00",
        jours_utilises: "0.00",
    });

    // Filtering state
    const [viewModeFilter, setViewModeFilter] = useState<"all" | "my_leaves" | "to_validate">("all");
    const [statusFilter, setStatusFilter] = useState<string>("tous");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const employees = employeesData?.results ?? [];
    const allLeaves = leavesData?.results ?? [];
    const leaveTypes = leaveTypesData?.results ?? [];
    const myBalances = balancesData?.results ?? [];

    const visibleLeaves = isManager
        ? allLeaves.filter((leave) => {
            const emp = employees.find((e) => e.id === leave.employee);
            return emp?.manager === myEmployeeId || leave.employee === myEmployeeId;
        })
        : allLeaves;

    function canValidateLeave(leave: any) {
        if (!leave || leave.statut !== "en_attente") return false;

        // Anti-auto-approbation : On ne peut pas valider sa propre demande
        if (myEmployeeId && leave.employee === myEmployeeId) {
            return false;
        }

        const employee = employees.find((e) => e.id === leave.employee);

        if (isAdminRH) {
            return true;
        }

        if (isManager) {
            return employee?.manager === myEmployeeId;
        }

        return false;
    }

    const filteredLeaves = visibleLeaves.filter((leave) => {
        // Vue par mode (Mes congés / À valider)
        if (viewModeFilter === "my_leaves" && leave.employee !== myEmployeeId) {
            return false;
        }
        if (viewModeFilter === "to_validate" && (!canValidateLeave(leave))) {
            return false;
        }

        // Filtre par statut
        if (statusFilter !== "tous" && leave.statut !== statusFilter) {
            return false;
        }

        // Recherche par nom / motif
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const employee = employees.find((e) => e.id === leave.employee);
            const empName = employee?.nom_complet?.toLowerCase() ?? "";
            const motif = leave.motif?.toLowerCase() ?? "";
            return empName.includes(query) || motif.includes(query);
        }
        return true;
    });

    const displayedLeaves = [...filteredLeaves].sort((a, b) => {
        const aDate = new Date(a.date_creation ?? 0).getTime();
        const bDate = new Date(b.date_creation ?? 0).getTime();
        return bDate - aDate;
    });

    const pendingCount = visibleLeaves.filter((leave) => leave.statut === "en_attente").length;
    const approvedCount = visibleLeaves.filter((leave) => leave.statut === "approuve").length;

    const computedDays =
        formData.date_debut && formData.date_fin
            ? calculateDays(formData.date_debut, formData.date_fin)
            : 0;
    const dateRangeError =
        formData.date_debut && formData.date_fin && computedDays <= 0
            ? "La date de fin doit être égale ou postérieure à la date de début."
            : "";
    const isFormValid = Boolean(
        formData.leave_type &&
        formData.date_debut &&
        formData.date_fin &&
        computedDays > 0 &&
        (isEmployee || formData.targetType === "self" || formData.employee)
    );

    function calculateDays(debut: string, fin: string): number {
        if (!debut || !fin) return 0;
        const d1 = new Date(debut);
        const d2 = new Date(fin);
        const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
        return diff >= 0 ? diff + 1 : 0;
    }

    // Submit handlers
    function handleSubmitRequest(e: React.FormEvent) {
        e.preventDefault();
        const targetEmployeeId = (formData.targetType === "self" || isEmployee)
            ? myEmployeeId
            : formData.employee;

        if (!targetEmployeeId) return;

        const days = calculateDays(formData.date_debut, formData.date_fin);
        if (!formData.leave_type || !formData.date_debut || !formData.date_fin || days <= 0) {
            return;
        }

        createLeaveRequest.mutate(
            {
                employee: targetEmployeeId,
                leave_type: formData.leave_type,
                date_debut: formData.date_debut,
                date_fin: formData.date_fin,
                date_creation: new Date().toISOString(),
                nombre_jours: String(days),
                motif: formData.motif,
            },
            {
                onSuccess: () => {
                    setIsModalOpen(false);
                    setFormData({ targetType: "self", employee: "", leave_type: "", date_debut: "", date_fin: "", motif: "" });
                },
            }
        );
    }

    function handleSaveLeaveType(e: React.FormEvent) {
        e.preventDefault();
        if (!typeFormData.nom.trim()) return;

        if (editingType) {
            updateLeaveType.mutate(
                {
                    id: editingType.id,
                    data: {
                        nom: typeFormData.nom.trim(),
                        jours_par_an: Number(typeFormData.jours_par_an),
                        couleur: typeFormData.couleur,
                    },
                },
                {
                    onSuccess: () => {
                        setEditingType(null);
                        setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#3b82f6" });
                    },
                }
            );
        } else {
            createLeaveType.mutate(
                {
                    nom: typeFormData.nom.trim(),
                    jours_par_an: Number(typeFormData.jours_par_an),
                    couleur: typeFormData.couleur,
                },
                {
                    onSuccess: () => {
                        setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#3b82f6" });
                    },
                }
            );
        }
    }

    function handleDeleteType(id: string) {
        if (confirm("Voulez-vous vraiment supprimer ce type de congé ?")) {
            deleteLeaveType.mutate(id);
        }
    }

    function handleSaveBalance(e: React.FormEvent) {
        e.preventDefault();
        if (!balanceFormData.employee || !balanceFormData.leave_type) return;

        if (editingBalance) {
            updateLeaveBalance.mutate(
                {
                    id: editingBalance.id,
                    data: {
                        annee: Number(balanceFormData.annee),
                        jours_alloues: String(balanceFormData.jours_alloues),
                        jours_utilises: String(balanceFormData.jours_utilises),
                    },
                },
                {
                    onSuccess: () => {
                        setEditingBalance(null);
                    },
                }
            );
        } else {
            createLeaveBalance.mutate(
                {
                    employee: balanceFormData.employee,
                    leave_type: balanceFormData.leave_type,
                    annee: Number(balanceFormData.annee),
                    jours_alloues: String(balanceFormData.jours_alloues),
                    jours_utilises: String(balanceFormData.jours_utilises),
                },
                {
                    onSuccess: () => {
                        setBalanceFormData({
                            employee: "",
                            leave_type: "",
                            annee: new Date().getFullYear(),
                            jours_alloues: "25.00",
                            jours_utilises: "0.00",
                        });
                    },
                }
            );
        }
    }

    function handleDeleteBalance(id: string) {
        if (confirm("Voulez-vous vraiment supprimer ce solde ?")) {
            deleteLeaveBalance.mutate(id);
        }
    }

    function handleOpenDecision(leaveId: string, action: "approuve" | "rejete") {
        setDecisionModal({
            isOpen: true,
            leaveId,
            action,
            comment: "",
        });
    }

    function handleConfirmDecision() {
        if (!decisionModal.leaveId) return;
        updateLeaveRequest.mutate(
            {
                id: decisionModal.leaveId,
                data: {
                    statut: decisionModal.action,
                    commentaire_validateur: decisionModal.comment.trim(),
                    date_validation: new Date().toISOString(),
                },
            },
            {
                onSuccess: () => {
                    setDecisionModal({ isOpen: false, leaveId: "", action: "approuve", comment: "" });
                },
            }
        );
    }

    function handleCancelRequest(id: string) {
        if (confirm("Êtes-vous sûr de vouloir annuler cette demande de congé ?")) {
            updateLeaveRequest.mutate({
                id,
                data: { statut: "annule" },
            });
        }
    }

    const inputClass =
        "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
    const labelClass = "block text-sm font-medium text-foreground mb-1.5";

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Congés</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {isEmployee ? "Mes demandes et soldes de congés" : "Gestion, soldes et demandes de congé"}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {!isEmployee && (
                        <button
                            onClick={() => setIsManageBalancesOpen(true)}
                            className="flex items-center gap-2 border border-border bg-card hover:bg-accent px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <SlidersHorizontal size={16} />
                            Ajuster les soldes
                        </button>
                    )}
                    {isAdminRH && (
                        <button
                            onClick={() => setIsManageLeaveTypesOpen(true)}
                            className="flex items-center gap-2 border border-border bg-card hover:bg-accent px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Tag size={16} />
                            Gérer les types
                        </button>
                    )}
                    <button
                        onClick={() => {
                            setFormData((p) => ({ ...p, targetType: "self" }));
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Nouvelle demande
                    </button>
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock3 size={16} className="text-amber-500" />
                        <span>En attente</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{pendingCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BadgeCheck size={16} className="text-green-500" />
                        <span>Approuvées</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{approvedCount}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={16} className="text-blue-500" />
                        <span>Total des demandes</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold text-foreground">{visibleLeaves.length}</p>
                </div>
            </div>

            {/* Cartes des soldes personnels (visibles pour Employés ET Managers/Admins ayant un profil) */}
            {myEmployeeId && myBalances.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <User size={14} />
                        Mes soldes de congés personnels
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {myBalances.map((balance) => {
                            const leaveType = leaveTypes.find((t) => t.id === balance.leave_type);
                            const remaining = parseFloat(balance.jours_alloues) - parseFloat(balance.jours_utilises);
                            return (
                                <div key={balance.id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-xs font-medium text-muted-foreground">{leaveType?.nom ?? "Congé"}</p>
                                        {leaveType?.couleur && (
                                            <span
                                                className="w-3 h-3 rounded-full border border-border"
                                                style={{ backgroundColor: leaveType.couleur }}
                                            />
                                        )}
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{remaining} jours</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {balance.jours_utilises} utilisés sur {balance.jours_alloues} alloués
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Onglets de vue (Mes demandes vs À valider) pour Managers/Admins */}
            {!isEmployee && (
                <div className="flex items-center gap-2 mb-4 border-b border-border pb-2">
                    <button
                        onClick={() => setViewModeFilter("all")}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${viewModeFilter === "all"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        <Users size={14} />
                        Toutes les demandes ({visibleLeaves.length})
                    </button>
                    <button
                        onClick={() => setViewModeFilter("my_leaves")}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${viewModeFilter === "my_leaves"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        <User size={14} />
                        Mes demandes ({visibleLeaves.filter((l) => l.employee === myEmployeeId).length})
                    </button>
                    <button
                        onClick={() => setViewModeFilter("to_validate")}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${viewModeFilter === "to_validate"
                            ? "bg-primary text-primary-foreground font-semibold"
                            : "text-muted-foreground hover:bg-muted"
                            }`}
                    >
                        <Clock3 size={14} />
                        À valider ({visibleLeaves.filter((l) => canValidateLeave(l)).length})
                    </button>
                </div>
            )}

            {/* Barre de filtres et recherche */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs font-medium overflow-x-auto">
                    {[
                        { id: "tous", label: "Tous statuts" },
                        { id: "en_attente", label: "En attente" },
                        { id: "approuve", label: "Approuvées" },
                        { id: "rejete", label: "Rejetées" },
                        { id: "annule", label: "Annulées" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${statusFilter === tab.id
                                ? "bg-card text-foreground shadow-sm font-semibold"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {!isEmployee && (
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                        <input
                            type="text"
                            placeholder="Rechercher employé ou motif..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                )}
            </div>

            {/* Table des demandes */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64 rounded-xl border border-dashed border-border bg-card">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Sparkles size={18} />
                        <p>Chargement des demandes...</p>
                    </div>
                </div>
            ) : displayedLeaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-xl border border-dashed border-border bg-card text-muted-foreground">
                    <Calendar size={32} />
                    <p>Aucune demande de congé trouvée.</p>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/50 text-left">
                                {!isEmployee && (
                                    <th className="font-medium text-muted-foreground px-4 py-3">Employé</th>
                                )}
                                <th className="font-medium text-muted-foreground px-4 py-3">Type</th>
                                <th className="font-medium text-muted-foreground px-4 py-3">Période</th>
                                <th className="font-medium text-muted-foreground px-4 py-3">Jours</th>
                                <th className="font-medium text-muted-foreground px-4 py-3">Motif & Remarques</th>
                                <th className="font-medium text-muted-foreground px-4 py-3">Statut</th>
                                <th className="font-medium text-muted-foreground px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedLeaves.map((leave) => {
                                const employee = employees.find((e) => e.id === leave.employee);
                                const leaveType = leaveTypes.find((t) => t.id === leave.leave_type);
                                const isMyOwnRequest = leave.employee === myEmployeeId;

                                return (
                                    <tr key={leave.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                        {!isEmployee && (
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                {employee?.nom_complet ?? "—"}
                                                {isMyOwnRequest && (
                                                    <span className="ml-2 text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.5 rounded">
                                                        Moi
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {leaveType?.couleur && (
                                                    <span
                                                        className="w-2.5 h-2.5 rounded-full border border-border"
                                                        style={{ backgroundColor: leaveType.couleur }}
                                                    />
                                                )}
                                                <span className="text-foreground font-medium">{leaveType?.nom ?? "Congé"}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {leave.date_debut} → {leave.date_fin}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-foreground">{leave.nombre_jours} j</td>
                                        <td className="px-4 py-3 text-muted-foreground max-w-xs">
                                            <p className="truncate">{leave.motif || "—"}</p>
                                            {leave.commentaire_validateur && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1 italic">
                                                    <MessageSquare size={12} />
                                                    {leave.commentaire_validateur}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[leave.statut]}`}
                                            >
                                                {STATUT_LABELS[leave.statut]}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                {canValidateLeave(leave) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenDecision(leave.id, "approuve")}
                                                            title="Approuver la demande"
                                                            disabled={updateLeaveRequest.isPending}
                                                            className="h-8 px-2.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-950/60 dark:text-green-300 dark:hover:bg-green-900/80 flex items-center gap-1 text-xs font-medium transition-colors"
                                                        >
                                                            <Check size={14} />
                                                            <span>Approuver</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenDecision(leave.id, "rejete")}
                                                            title="Rejeter la demande"
                                                            disabled={updateLeaveRequest.isPending}
                                                            className="h-8 px-2.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/80 flex items-center gap-1 text-xs font-medium transition-colors"
                                                        >
                                                            <X size={14} />
                                                            <span>Rejeter</span>
                                                        </button>
                                                    </>
                                                )}

                                                {isMyOwnRequest && leave.statut === "en_attente" && (
                                                    <button
                                                        onClick={() => handleCancelRequest(leave.id)}
                                                        title="Annuler ma demande"
                                                        disabled={updateLeaveRequest.isPending}
                                                        className="h-8 px-2 rounded-lg border border-border text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-1 text-xs transition-colors"
                                                    >
                                                        <Ban size={14} />
                                                        <span>Annuler</span>
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

            {/* Modal Nouvelle Demande de Congé */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground mb-4">Nouvelle demande de congé</h2>

                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            {!isEmployee && (
                                <div className="flex items-center gap-4 bg-muted/40 p-2.5 rounded-lg border border-border">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground cursor-pointer">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="self"
                                            checked={formData.targetType === "self"}
                                            onChange={() => setFormData((p) => ({ ...p, targetType: "self" }))}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>Pour moi-même</span>
                                    </label>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground cursor-pointer">
                                        <input
                                            type="radio"
                                            name="targetType"
                                            value="other"
                                            checked={formData.targetType === "other"}
                                            onChange={() => setFormData((p) => ({ ...p, targetType: "other" }))}
                                            className="text-primary focus:ring-primary"
                                        />
                                        <span>Pour un autre employé</span>
                                    </label>
                                </div>
                            )}

                            {!isEmployee && formData.targetType === "other" && (
                                <div>
                                    <label className={labelClass}>Sélectionner l'employé *</label>
                                    <select
                                        required
                                        value={formData.employee}
                                        onChange={(e) => setFormData((p) => ({ ...p, employee: e.target.value }))}
                                        className={inputClass}
                                    >
                                        <option value="">Sélectionner un employé...</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.nom_complet} ({emp.poste || "Employé"})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Type de congé *</label>
                                <select
                                    required
                                    value={formData.leave_type}
                                    onChange={(e) => setFormData((p) => ({ ...p, leave_type: e.target.value }))}
                                    className={inputClass}
                                >
                                    <option value="">Sélectionner un type...</option>
                                    {leaveTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.nom} ({type.jours_par_an}j/an)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Date de début *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_debut}
                                        onChange={(e) => setFormData((p) => ({ ...p, date_debut: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Date de fin *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date_fin}
                                        onChange={(e) => setFormData((p) => ({ ...p, date_fin: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            {formData.date_debut && formData.date_fin && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-primary">
                                        Durée calculée : {computedDays} jour(s)
                                    </p>
                                    {dateRangeError && (
                                        <p className="text-xs text-red-600">{dateRangeError}</p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Motif de la demande</label>
                                <textarea
                                    value={formData.motif}
                                    onChange={(e) => setFormData((p) => ({ ...p, motif: e.target.value }))}
                                    rows={3}
                                    placeholder="Explication ou détails complémentaires..."
                                    className={inputClass}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLeaveRequest.isPending || !isFormValid}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    Envoyer la demande
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Gérer et Modifier les Types de Congés (Admin RH) */}
            {isManageLeaveTypesOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <Tag size={18} />
                                Configuration des Types de Congés
                            </h2>
                            <button
                                onClick={() => {
                                    setIsManageLeaveTypesOpen(false);
                                    setEditingType(null);
                                }}
                                className="text-muted-foreground hover:text-foreground p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Formulaire d'édition / création */}
                        <form onSubmit={handleSaveLeaveType} className="bg-muted/40 p-4 rounded-xl border border-border mb-6 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {editingType ? `Modifier : ${editingType.nom}` : "Ajouter un nouveau type de congé"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>Nom *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="ex: RTT, Congé Payé"
                                        value={typeFormData.nom}
                                        onChange={(e) => setTypeFormData((p) => ({ ...p, nom: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Jours / An *</label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={typeFormData.jours_par_an}
                                        onChange={(e) => setTypeFormData((p) => ({ ...p, jours_par_an: Number(e.target.value) }))}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Couleur</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={typeFormData.couleur}
                                            onChange={(e) => setTypeFormData((p) => ({ ...p, couleur: e.target.value }))}
                                            className="h-9 w-10 rounded cursor-pointer border border-border p-1 bg-background"
                                        />
                                        <input
                                            type="text"
                                            value={typeFormData.couleur}
                                            onChange={(e) => setTypeFormData((p) => ({ ...p, couleur: e.target.value }))}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                {editingType && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingType(null);
                                            setTypeFormData({ nom: "", jours_par_an: 25, couleur: "#3b82f6" });
                                        }}
                                        className="px-3 py-1.5 rounded-lg text-xs border border-border text-foreground hover:bg-muted"
                                    >
                                        Annuler la modification
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={createLeaveType.isPending || updateLeaveType.isPending}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90"
                                >
                                    {editingType ? "Mettre à jour" : "Ajouter ce type"}
                                </button>
                            </div>
                        </form>

                        {/* Liste des types existants */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Types de congés existants ({leaveTypes.length})
                            </h3>

                            {leaveTypes.map((type) => (
                                <div
                                    key={type.id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="w-4 h-4 rounded-full border border-border"
                                            style={{ backgroundColor: type.couleur }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{type.nom}</p>
                                            <p className="text-xs text-muted-foreground">{type.jours_par_an} jours / an</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingType(type);
                                                setTypeFormData({
                                                    nom: type.nom,
                                                    jours_par_an: type.jours_par_an,
                                                    couleur: type.couleur || "#3b82f6",
                                                });
                                            }}
                                            title="Modifier ce type"
                                            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Edit2 size={15} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteType(type.id)}
                                            title="Supprimer ce type"
                                            className="p-1.5 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-600 dark:hover:bg-red-950/50 transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Gérer et Ajuster les Soldes d'Employés (Admin RH & Manager) */}
            {isManageBalancesOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                <SlidersHorizontal size={18} />
                                Ajustement des Soldes de Congés
                            </h2>
                            <button
                                onClick={() => {
                                    setIsManageBalancesOpen(false);
                                    setEditingBalance(null);
                                }}
                                className="text-muted-foreground hover:text-foreground p-1"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Formulaire d'édition / attribution de solde */}
                        <form onSubmit={handleSaveBalance} className="bg-muted/40 p-4 rounded-xl border border-border mb-6 space-y-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {editingBalance ? "Modifier le solde existant" : "Attribuer un nouveau solde à un employé"}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {!editingBalance && (
                                    <div>
                                        <label className={labelClass}>Employé *</label>
                                        <select
                                            required
                                            value={balanceFormData.employee}
                                            onChange={(e) => setBalanceFormData((p) => ({ ...p, employee: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">Sélectionner un employé...</option>
                                            {employees.map((emp) => (
                                                <option key={emp.id} value={emp.id}>
                                                    {emp.nom_complet}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {!editingBalance && (
                                    <div>
                                        <label className={labelClass}>Type de congé *</label>
                                        <select
                                            required
                                            value={balanceFormData.leave_type}
                                            onChange={(e) => setBalanceFormData((p) => ({ ...p, leave_type: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">Sélectionner un type...</option>
                                            {leaveTypes.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.nom}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className={labelClass}>Année *</label>
                                    <input
                                        type="number"
                                        required
                                        value={balanceFormData.annee}
                                        onChange={(e) => setBalanceFormData((p) => ({ ...p, annee: Number(e.target.value) }))}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Jours alloués *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={balanceFormData.jours_alloues}
                                        onChange={(e) => setBalanceFormData((p) => ({ ...p, jours_alloues: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Jours utilisés *</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        required
                                        value={balanceFormData.jours_utilises}
                                        onChange={(e) => setBalanceFormData((p) => ({ ...p, jours_utilises: e.target.value }))}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                                {editingBalance && (
                                    <button
                                        type="button"
                                        onClick={() => setEditingBalance(null)}
                                        className="px-3 py-1.5 rounded-lg text-xs border border-border text-foreground hover:bg-muted"
                                    >
                                        Annuler la modification
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={createLeaveBalance.isPending || updateLeaveBalance.isPending}
                                    className="px-4 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90"
                                >
                                    {editingBalance ? "Mettre à jour le solde" : "Attribuer ce solde"}
                                </button>
                            </div>
                        </form>

                        {/* Liste des soldes d'employés */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                                Soldes attribués ({allBalances.length})
                            </h3>

                            {allBalances.length === 0 ? (
                                <p className="text-xs text-muted-foreground italic py-4 text-center">Aucun solde configuré pour le moment.</p>
                            ) : (
                                allBalances.map((bal) => {
                                    const emp = employees.find((e) => e.id === bal.employee);
                                    const lType = leaveTypes.find((t) => t.id === bal.leave_type);
                                    const remaining = parseFloat(bal.jours_alloues) - parseFloat(bal.jours_utilises);

                                    return (
                                        <div
                                            key={bal.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors text-xs"
                                        >
                                            <div>
                                                <p className="font-semibold text-foreground text-sm">{emp?.nom_complet ?? "Employé inconnu"}</p>
                                                <p className="text-muted-foreground">
                                                    {lType?.nom ?? "Congé"} ({bal.annee}) — <span className="font-medium text-foreground">{remaining} j disponibles</span> ({bal.jours_utilises} / {bal.jours_alloues} alloués)
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => {
                                                        setEditingBalance(bal);
                                                        setBalanceFormData({
                                                            employee: bal.employee,
                                                            leave_type: bal.leave_type,
                                                            annee: bal.annee,
                                                            jours_alloues: String(bal.jours_alloues),
                                                            jours_utilises: String(bal.jours_utilises),
                                                        });
                                                    }}
                                                    title="Ajuster ce solde"
                                                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteBalance(bal.id)}
                                                    title="Supprimer ce solde"
                                                    className="p-1.5 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-600 dark:hover:bg-red-950/50 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Décision / Validation avec Commentaire */}
            {decisionModal.isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg">
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                            {decisionModal.action === "approuve" ? "Approuver la demande" : "Rejeter la demande"}
                        </h2>
                        <p className="text-xs text-muted-foreground mb-4">
                            Vous pouvez ajouter un commentaire explicatif pour l'employé (optionnel).
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>Commentaire du validateur</label>
                                <textarea
                                    value={decisionModal.comment}
                                    onChange={(e) => setDecisionModal((p) => ({ ...p, comment: e.target.value }))}
                                    rows={3}
                                    placeholder={
                                        decisionModal.action === "approuve"
                                            ? "Ex: Congé accordé, bon repos !"
                                            : "Ex: Période de forte activité en équipe, report nécessaire."
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setDecisionModal({ isOpen: false, leaveId: "", action: "approuve", comment: "" })}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    onClick={handleConfirmDecision}
                                    disabled={updateLeaveRequest.isPending}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity ${decisionModal.action === "approuve"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-red-600 hover:bg-red-700"
                                        }`}
                                >
                                    Confirmer {decisionModal.action === "approuve" ? "l'approbation" : "le rejet"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}