import { useState, useMemo } from "react";
import {
    Sparkles,
    Award,
    Briefcase,
    Coins,
    Building2,
    FileSignature,
    LogOut,
    Milestone,
    Plus,
    Trash2,
    ArrowUpDown,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Minus,
    BarChart3,
    Flag,
    Clock,
} from "lucide-react";
import { useEmployeeHistory, useDeleteEmployeeHistory } from "@/hooks/useEmployeeHistory";
import CareerEventForm from "./CareerEventForm";
import CareerChart from "./CareerChart";
import type { Employee, EmployeeHistory, CareerEventType } from "@/types";

interface CareerHistoryProps {
    employee: Employee;
    canManage?: boolean;
}

interface EventConfig {
    label: string;
    icon: typeof Milestone;
    iconBg: string;
    badgeBg: string;
}

const EVENT_CONFIGS: Record<CareerEventType, EventConfig> = {
    embauche: {
        label: "Embauche",
        icon: Sparkles,
        iconBg: "bg-emerald-500 text-white ring-4 ring-emerald-100 dark:ring-emerald-950/40",
        badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    stage: {
        label: "Début de stage",
        icon: Sparkles,
        iconBg: "bg-teal-500 text-white ring-4 ring-teal-100 dark:ring-teal-950/40",
        badgeBg: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
    },
    promotion: {
        label: "Promotion",
        icon: Award,
        iconBg: "bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-950/40",
        badgeBg: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    poste: {
        label: "Changement de poste",
        icon: Briefcase,
        iconBg: "bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-950/40",
        badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    },
    salaire: {
        label: "Ajustement salarial",
        icon: Coins,
        iconBg: "bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/40",
        badgeBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    transfert: {
        label: "Transfert de département",
        icon: Building2,
        iconBg: "bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950/40",
        badgeBg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    },
    changement_contrat: {
        label: "Changement de contrat",
        icon: FileSignature,
        iconBg: "bg-indigo-500 text-white ring-4 ring-indigo-100 dark:ring-indigo-950/40",
        badgeBg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
    },
    depart: {
        label: "Départ / Fin de contrat",
        icon: LogOut,
        iconBg: "bg-rose-500 text-white ring-4 ring-rose-100 dark:ring-rose-950/40",
        badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    autre: {
        label: "Autre événement",
        icon: Milestone,
        iconBg: "bg-slate-500 text-white ring-4 ring-slate-100 dark:ring-slate-950/40",
        badgeBg: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    },
    recommandation: {
        label: "Recommandation Managériale",
        icon: Award,
        iconBg: "bg-amber-600 text-white ring-4 ring-amber-100 dark:ring-amber-950/40",
        badgeBg: "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border-amber-300 dark:border-amber-700",
    },
};

function formatFrenchDate(dateStr: string) {
    if (!dateStr) return "—";
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

function calculateRetirementInfo(dateNaissance: string | null | undefined, dateEmbauche: string | null | undefined) {
    const RETIREMENT_AGE = 60;
    const now = new Date();
    let retirementDate: Date;
    let hasExactBirthDate = false;

    if (dateNaissance) {
        try {
            const [bYear, bMonth, bDay] = dateNaissance.split("-").map(Number);
            retirementDate = new Date(bYear + RETIREMENT_AGE, (bMonth || 1) - 1, bDay || 1);
            hasExactBirthDate = true;
        } catch {
            const hireYear = dateEmbauche ? new Date(dateEmbauche).getFullYear() : now.getFullYear();
            retirementDate = new Date(hireYear + 30, 11, 31);
        }
    } else {
        const hireYear = dateEmbauche ? new Date(dateEmbauche).getFullYear() : now.getFullYear();
        retirementDate = new Date(hireYear + 30, 11, 31);
    }

    const diffMs = retirementDate.getTime() - now.getTime();
    const isRetired = diffMs <= 0;
    const remainingYears = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 3600 * 1000)));

    return {
        retirementDate,
        formattedDate: retirementDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        }),
        year: retirementDate.getFullYear(),
        isRetired,
        remainingYears,
        hasExactBirthDate,
    };
}

function calculateSalaryTrend(oldValStr: string, newValStr: string) {
    const oldVal = parseFloat(oldValStr) || 0;
    const newVal = parseFloat(newValStr) || 0;
    const diff = newVal - oldVal;

    if (diff > 0) {
        const pct = oldVal > 0 ? ((diff / oldVal) * 100).toFixed(1) : null;
        return {
            direction: "up" as const,
            diffFormatted: `+${diff.toLocaleString()} FCFA`,
            pctFormatted: pct ? `(+${pct}%)` : "",
            colorClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
            icon: TrendingUp,
        };
    } else if (diff < 0) {
        const pct = oldVal > 0 ? ((Math.abs(diff) / oldVal) * 100).toFixed(1) : null;
        return {
            direction: "down" as const,
            diffFormatted: `-${Math.abs(diff).toLocaleString()} FCFA`,
            pctFormatted: pct ? `(-${pct}%)` : "",
            colorClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800",
            icon: TrendingDown,
        };
    } else {
        return {
            direction: "neutral" as const,
            diffFormatted: "Inchangé",
            pctFormatted: "",
            colorClass: "bg-muted text-muted-foreground border-border",
            icon: Minus,
        };
    }
}

export default function CareerHistory({ employee, canManage = false }: CareerHistoryProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [sortAsc, setSortAsc] = useState(true); // Par défaut: du plus ancien au plus récent
    const [showChart, setShowChart] = useState(true);

    const { data: historyData, isLoading } = useEmployeeHistory({ employee: employee.id });
    const deleteHistory = useDeleteEmployeeHistory();

    const retirementInfo = useMemo(() => {
        return calculateRetirementInfo(employee.date_naissance, employee.date_embauche);
    }, [employee.date_naissance, employee.date_embauche]);

    const hasEmbaucheInHistory = useMemo(() => {
        return (historyData?.results ?? []).some((e) => e.field === "embauche");
    }, [historyData?.results]);

    const events = useMemo(() => {
        const list = [...(historyData?.results ?? [])];

        // S'assurer que le jalon d'embauche initial est TOUJOURS présent à la date d'embauche de l'employé !
        if (!hasEmbaucheInHistory && employee.date_embauche) {
            list.push({
                id: "synthetic-embauche",
                company: employee.company,
                employee: employee.id,
                field: "embauche",
                old_value: "",
                new_value: employee.poste,
                contract_type: employee.type_contrat,
                department: employee.department,
                department_nom: employee.department_nom,
                change_date: employee.date_embauche,
                reason: "Entrée en fonction dans l'entreprise",
                created_by: null,
                created_by_nom: "Fiche d'embauche",
                date_creation: employee.date_embauche,
            });
        }

        return list.sort((a, b) => {
            const timeA = new Date(a.change_date).getTime();
            const timeB = new Date(b.change_date).getTime();
            if (timeA === timeB) {
                if (a.field === "embauche") return sortAsc ? -1 : 1;
                if (b.field === "embauche") return sortAsc ? 1 : -1;
                return new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime();
            }
            return sortAsc ? timeA - timeB : timeB - timeA;
        });
    }, [historyData?.results, hasEmbaucheInHistory, employee, sortAsc]);

    function handleDelete(event: EmployeeHistory) {
        if (event.id === "synthetic-embauche") return;
        if (confirm(`Supprimer l'événement "${EVENT_CONFIGS[event.field]?.label || event.field}" du ${event.change_date} ?`)) {
            deleteHistory.mutate(event.id);
        }
    }

    return (
        <div className="space-y-6">
            {/* Graphique de trajectoire & analytics */}
            {showChart && (
                <CareerChart
                    employee={employee}
                    history={historyData?.results ?? []}
                />
            )}

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                {/* En-tête de la section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                            <Milestone size={22} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                Parcours professionnel
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                                    {events.length} {events.length > 1 ? "jalons" : "jalon"}
                                </span>
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Historique chronologique des postes, salaires, contrats et mutations
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        {/* Bouton de bascule Graphique */}
                        <button
                            type="button"
                            onClick={() => setShowChart(!showChart)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                                showChart
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            }`}
                            title={showChart ? "Masquer le graphique d'évolution" : "Afficher le graphique d'évolution"}
                        >
                            <BarChart3 size={13} />
                            {showChart ? "Graphique masquable" : "Afficher graphique"}
                        </button>

                        {events.length > 1 && (
                            <button
                                type="button"
                                onClick={() => setSortAsc(!sortAsc)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title={sortAsc ? "Trier du plus récent au plus ancien" : "Trier du plus ancien au plus récent"}
                            >
                                <ArrowUpDown size={13} />
                                {sortAsc ? "Plus ancien d'abord" : "Plus récent d'abord"}
                            </button>
                        )}

                        {canManage && (
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-xs"
                            >
                                <Plus size={14} />
                                Ajouter un événement
                            </button>
                        )}
                    </div>
                </div>

                {/* Roadmap : Cycle complet de vie professionnelle (De l'Embauche à la Retraite ou Fin de contrat) */}
                <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Étape 1 : Embauche */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                                <Sparkles size={19} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                    1. Date d'embauche
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    {formatFrenchDate(employee.date_embauche)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Contrat {employee.type_contrat?.toUpperCase()} • {employee.poste}
                                </p>
                            </div>
                        </div>

                        {/* Flèche intermédiaire */}
                        <div className="hidden md:flex items-center text-muted-foreground/40">
                            <ArrowRight size={18} />
                        </div>

                        {/* Étape 2 : Situation Actuelle */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
                                <Clock size={19} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                    2. Étape actuelle
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    {Number(employee.salaire_de_base).toLocaleString()} FCFA
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {employee.department_nom || "Général"} • Statut {employee.statut}
                                </p>
                            </div>
                        </div>

                        {/* Flèche intermédiaire */}
                        <div className="hidden md:flex items-center text-muted-foreground/40">
                            <ArrowRight size={18} />
                        </div>

                        {/* Étape 3 : Horizon Retraite ou Fin de contrat */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                                <Flag size={19} />
                            </div>
                            <div>
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                    {employee.statut === "inactif"
                                        ? "3. Fin de contrat / Départ"
                                        : employee.type_contrat === "cdd" && employee.date_fin_contrat
                                        ? "3. Échéance du CDD"
                                        : "3. Horizon Retraite (60 ans)"}
                                </span>
                                <p className="text-sm font-bold text-foreground">
                                    {employee.statut === "inactif"
                                        ? (employee.date_fin_contrat ? formatFrenchDate(employee.date_fin_contrat) : "Contrat clôturé")
                                        : employee.type_contrat === "cdd" && employee.date_fin_contrat
                                        ? formatFrenchDate(employee.date_fin_contrat)
                                        : `${retirementInfo.year} (~${retirementInfo.remainingYears} ans)`}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {employee.statut === "inactif"
                                        ? "Employé inactif"
                                        : retirementInfo.isRetired
                                        ? "Âge légal de départ atteint"
                                        : `Cap fixé au ${retirementInfo.formattedDate}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            {/* État de chargement */}
            {isLoading && (
                <div className="py-12 flex items-center justify-center text-sm text-muted-foreground">
                    Chargement de l'historique de carrière...
                </div>
            )}

            {/* État vide */}
            {!isLoading && events.length === 0 && (
                <div className="py-12 px-4 text-center max-w-md mx-auto">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                        <Milestone size={24} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm">Aucun événement enregistré</h3>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">
                        Les changements de poste, révisions salariales, promotions ou transferts de département
                        enregistrés apparaîtront automatiquement ici sous forme de frise chronologique.
                    </p>
                    {canManage && (
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                            <Plus size={14} />
                            Enregistrer le premier jalon
                        </button>
                    )}
                </div>
            )}

            {/* Frise chronologique verticale */}
            {!isLoading && events.length > 0 && (
                <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                    {events.map((event) => {
                        const config = EVENT_CONFIGS[event.field] || EVENT_CONFIGS.autre;
                        const IconComponent = config.icon;
                        const isSalaryEvent = event.field === "salaire";
                        const salaryTrend = isSalaryEvent ? calculateSalaryTrend(event.old_value, event.new_value) : null;
                        const hasValues = Boolean(event.old_value || event.new_value);
                        const hasChange = Boolean(event.old_value && event.new_value && event.old_value !== event.new_value);

                        return (
                            <div key={event.id} className="relative group">
                                {/* Puce / Icône sur la ligne verticale */}
                                <div
                                    className={`absolute -left-7 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xs z-10 transition-transform group-hover:scale-110 ${config.iconBg}`}
                                    title={config.label}
                                >
                                    <IconComponent size={13} />
                                </div>

                                {/* Conteneur de l'événement */}
                                <div className="bg-muted/30 hover:bg-muted/50 border border-border/80 rounded-xl p-4 transition-colors">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg}`}>
                                                {config.label}
                                            </span>

                                            {/* Badge type de contrat si présent */}
                                            {event.contract_type && (
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wide">
                                                    {event.contract_type}
                                                </span>
                                            )}

                                            {/* Badge département si présent */}
                                            {event.department_nom && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                                                    <Building2 size={11} />
                                                    {event.department_nom}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-medium text-foreground">
                                                {formatFrenchDate(event.change_date)}
                                            </span>

                                            {canManage && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(event)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                                                    title="Supprimer cet événement"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Comparaison Ancienne valeur -> Nouvelle valeur */}
                                    {hasValues && (
                                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm">
                                            {hasChange ? (
                                                <>
                                                    <span className="line-through text-muted-foreground/80 font-normal">
                                                        {isSalaryEvent ? `${Number(event.old_value).toLocaleString()} FCFA` : event.old_value}
                                                    </span>
                                                    <ArrowRight size={14} className="text-muted-foreground/60 shrink-0" />
                                                    <span className="font-semibold text-foreground">
                                                        {isSalaryEvent ? `${Number(event.new_value).toLocaleString()} FCFA` : event.new_value}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-semibold text-foreground">
                                                    {isSalaryEvent ? `${Number(event.new_value || event.old_value).toLocaleString()} FCFA` : (event.new_value || event.old_value)}
                                                </span>
                                            )}

                                            {/* Indicateur de tendance pour les salaires */}
                                            {isSalaryEvent && salaryTrend && (
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold border ${salaryTrend.colorClass}`}
                                                >
                                                    <salaryTrend.icon size={12} />
                                                    {salaryTrend.diffFormatted} {salaryTrend.pctFormatted}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Motif / Note libre en italique */}
                                    {event.reason && (
                                        <div className="mt-2.5 text-xs text-muted-foreground bg-background/60 border border-border/50 rounded-lg px-3 py-2 italic">
                                            « {event.reason} »
                                        </div>
                                    )}

                                    {/* Info d'audit discrète */}
                                    {event.created_by_nom && (
                                        <div className="mt-2 text-[11px] text-muted-foreground/70 flex justify-end">
                                            Enregistré par {event.created_by_nom}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {/* Jalon d'arrivée prévisionnel : Retraite (60 ans) ou Fin de contrat */}
                    {sortAsc && (
                        <div className="relative group">
                            <div className="absolute -left-7 top-1 w-6 h-6 rounded-full flex items-center justify-center shadow-xs z-10 bg-purple-600 text-white ring-4 ring-purple-100 dark:ring-purple-950/40">
                                <Flag size={13} />
                            </div>
                            <div className="bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                            {employee.statut === "inactif"
                                                ? "Départ / Fin de fonction"
                                                : employee.type_contrat === "cdd" && employee.date_fin_contrat
                                                ? "Échéance de contrat"
                                                : "🏁 Horizon Retraite (60 ans)"}
                                        </span>
                                    </div>
                                    <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">
                                        {employee.statut === "inactif" && employee.date_fin_contrat
                                            ? formatFrenchDate(employee.date_fin_contrat)
                                            : employee.type_contrat === "cdd" && employee.date_fin_contrat
                                            ? formatFrenchDate(employee.date_fin_contrat)
                                            : retirementInfo.formattedDate}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {employee.statut === "inactif"
                                        ? "L'employé est actuellement inactif dans l'organisation."
                                        : employee.type_contrat === "cdd" && employee.date_fin_contrat
                                        ? "Date de fin d'échéance pour le contrat à durée déterminée."
                                        : `Départ légal à la retraite estimé à l'âge de 60 ans (${retirementInfo.remainingYears} an${retirementInfo.remainingYears > 1 ? "s" : ""} restant${retirementInfo.remainingYears > 1 ? "s" : ""}).`}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal de saisie manuelle */}
            <CareerEventForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                employee={employee}
            />
        </div>
    </div>
);
}

