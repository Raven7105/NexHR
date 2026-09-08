import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
    Users,
    ShieldCheck,
    Milestone,
    Sparkles,
    Calendar,
    Clock,
    FileCheck2,
    ArrowUpRight,
    Award,
    Briefcase,
} from "lucide-react";
import type { SubordinateBrief } from "@/types";
import RecommendEvolutionModal from "./RecommendEvolutionModal";

interface ManagerTeamCareerCardProps {
    subordinates: SubordinateBrief[];
    managerName?: string;
}

const CONTRACT_BADGES: Record<string, { label: string; class: string }> = {
    cdi: { label: "CDI", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
    cdd: { label: "CDD", class: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
    stage: { label: "Stage", class: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
    freelance: { label: "Freelance", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
};

function calculateAverageTenure(subordinates: SubordinateBrief[]): string {
    if (!subordinates || subordinates.length === 0) return "—";

    const now = new Date().getTime();
    const validDates = subordinates
        .filter((s) => s.date_embauche)
        .map((s) => new Date(s.date_embauche).getTime())
        .filter((time) => !isNaN(time) && time <= now);

    if (validDates.length === 0) return "—";

    const totalDays = validDates.reduce((acc, hireTime) => {
        return acc + Math.floor((now - hireTime) / (1000 * 60 * 60 * 24));
    }, 0);

    const avgDays = Math.floor(totalDays / validDates.length);
    const years = Math.floor(avgDays / 365.25);
    const months = Math.floor((avgDays % 365.25) / 30.4375);

    if (years === 0 && months === 0) return `${avgDays} jour${avgDays > 1 ? "s" : ""}`;
    if (years === 0) return `${months} mois`;
    if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
    return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
}

function calculateTenure(dateEmbauche: string): string {
    if (!dateEmbauche) return "—";
    try {
        const hireDate = new Date(dateEmbauche);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return "Récent";
        const years = Math.floor(diffDays / 365.25);
        const months = Math.floor((diffDays % 365.25) / 30.4375);

        if (years === 0 && months === 0) return `${diffDays} j`;
        if (years === 0) return `${months} mois`;
        if (months === 0) return `${years} an${years > 1 ? "s" : ""}`;
        return `${years} a ${months} m`;
    } catch {
        return "—";
    }
}

export default function ManagerTeamCareerCard({
    subordinates = [],
    managerName,
}: ManagerTeamCareerCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubordinateId, setSelectedSubordinateId] = useState<string | undefined>(undefined);

    const avgTenure = useMemo(() => calculateAverageTenure(subordinates), [subordinates]);

    const cdiCount = subordinates.filter((s) => s.type_contrat === "cdi").length;
    const cdiPercentage =
        subordinates.length > 0 ? Math.round((cdiCount / subordinates.length) * 100) : 100;

    const handleOpenRecommend = (subId?: string) => {
        setSelectedSubordinateId(subId);
        setIsModalOpen(true);
    };

    return (
        <>
            <div className="bg-card border-2 border-primary/20 rounded-2xl p-6 mb-6 shadow-md relative overflow-hidden">
                {/* Lueur d'arrière plan subtile */}
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-gradient-to-br from-primary/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* En-tête : Titre exécutif & Bouton d'action managériale */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/80">
                    <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-white shadow-md shadow-primary/20 shrink-0">
                            <ShieldCheck size={22} />
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base sm:text-lg font-bold text-foreground">
                                    Espace Management & Carrière d'Équipe
                                </h2>
                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                    <Award size={12} />
                                    Privilège Manager
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {managerName ? `Équipe supervisée par ${managerName} : suivez` : "Suivez"} les jalons de vos collaborateurs directs et soumettez vos recommandations de promotion ou d'évolution RH.
                            </p>
                        </div>
                    </div>

                    {subordinates.length > 0 && (
                        <button
                            type="button"
                            onClick={() => handleOpenRecommend()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 hover:opacity-95 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
                        >
                            <Sparkles size={16} />
                            Recommander une évolution RH
                        </button>
                    )}
                </div>

                {/* Métriques clés de l'équipe managée */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
                    {/* KPI 1 : Effectif direct */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                Collaborateurs directs
                            </p>
                            <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
                                {subordinates.length} membre{subordinates.length > 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>

                    {/* KPI 2 : Ancienneté moyenne */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                Ancienneté moyenne
                            </p>
                            <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
                                {avgTenure}
                            </p>
                        </div>
                    </div>

                    {/* KPI 3 : Stabilité & Contrats */}
                    <div className="bg-muted/30 border border-border/80 rounded-xl p-3.5 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <FileCheck2 size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                                Pérennisation contrats
                            </p>
                            <p className="text-lg font-bold text-foreground leading-tight mt-0.5">
                                {cdiPercentage}% CDI ({cdiCount}/{subordinates.length})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Liste des collaborateurs supervisés */}
                {subordinates.length === 0 ? (
                    <div className="text-center py-8 px-4 bg-muted/20 border border-dashed border-border rounded-xl">
                        <Users size={32} className="mx-auto text-muted-foreground/60 mb-2" />
                        <p className="text-sm font-semibold text-foreground">
                            Aucun collaborateur direct assigné
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                            Dès que des collaborateurs vous seront rattachés par l'administration RH, vous pourrez consulter leur parcours complet et émettre des recommandations de promotion ici.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                Collaborateurs sous votre responsabilité
                            </h3>
                            <span className="text-[11px] text-muted-foreground font-medium">
                                Cliquez sur un profil pour explorer son parcours
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {subordinates.map((sub) => {
                                const contractBadge =
                                    CONTRACT_BADGES[sub.type_contrat?.toLowerCase()] || CONTRACT_BADGES.cdi;
                                const tenureStr = calculateTenure(sub.date_embauche);

                                return (
                                    <div
                                        key={sub.id}
                                        className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 transition-all hover:shadow-md flex flex-col justify-between group"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/20 via-blue-500/10 to-transparent text-primary font-bold flex items-center justify-center text-sm border border-primary/20 shrink-0 group-hover:scale-105 transition-transform">
                                                    {sub.nom_complet.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                        {sub.nom_complet}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
                                                        <Briefcase size={12} className="shrink-0" />
                                                        {sub.poste}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span
                                                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${contractBadge.class}`}
                                                        >
                                                            {contractBadge.label}
                                                        </span>
                                                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                            <Calendar size={11} />
                                                            {sub.date_embauche} ({tenureStr})
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions rapides */}
                                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-border/60">
                                            <Link
                                                to={`/employees/${sub.id}`}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/80 hover:border-primary/30 text-xs font-semibold text-foreground transition-colors"
                                            >
                                                <Milestone size={13} />
                                                Voir le parcours
                                                <ArrowUpRight size={13} className="text-muted-foreground group-hover:text-primary" />
                                            </Link>

                                            <button
                                                type="button"
                                                onClick={() => handleOpenRecommend(sub.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-xs font-semibold transition-all cursor-pointer"
                                                title="Proposer une promotion ou revalorisation"
                                            >
                                                <Sparkles size={13} />
                                                Recommander
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Recommandation Managériale */}
            <RecommendEvolutionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSubordinateId(undefined);
                }}
                subordinates={subordinates}
                selectedSubordinateId={selectedSubordinateId}
            />
        </>
    );
}
