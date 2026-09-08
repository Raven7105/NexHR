import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceDot,
    ReferenceLine,
} from "recharts";
import {
    TrendingUp,
    Clock,
    Wallet,
    Calendar,
    Flag,
    Sparkles,
    SlidersHorizontal,
    Info,
    Compass,
    ArrowUpRight,
} from "lucide-react";
import type { Employee, EmployeeHistory } from "@/types";

interface CareerChartProps {
    employee: Employee;
    history: EmployeeHistory[];
}

type ProjectionMode = "dynamic" | "conservative";

interface TrajectoryPoint {
    chartKey: string;
    date: string;
    displayDate: string;
    formattedDate: string;
    realizedSalary: number | null;
    projectedSalary: number | null;
    displaySalary: number;
    phase: "realized" | "present" | "projected" | "retirement";
    eventTitle?: string;
    eventField?: string;
    eventReason?: string;
    diff?: number;
    diffPct?: string | null;
    isMilestone?: boolean;
    dotColor?: string;
    badgeLabel?: string;
}

function calculateTenureDetails(dateEmbauche: string | null | undefined) {
    if (!dateEmbauche) {
        return { years: 0, months: 0, text: "Date non renseignée", totalDays: 0 };
    }
    try {
        const start = new Date(dateEmbauche);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        if (diffMs < 0) {
            return { years: 0, months: 0, text: "Récent", totalDays: 0 };
        }

        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(totalDays / 365.25);
        const remainingDays = totalDays % 365.25;
        const months = Math.floor(remainingDays / 30.4375);

        let text = "";
        if (years === 0 && months === 0) {
            text = `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
        } else if (years === 0) {
            text = `${months} mois`;
        } else if (months === 0) {
            text = `${years} an${years > 1 ? "s" : ""}`;
        } else {
            text = `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
        }

        return { years, months, text, totalDays };
    } catch {
        return { years: 0, months: 0, text: "—", totalDays: 0 };
    }
}

function calculateRetirementDetails(
    dateNaissance: string | null | undefined,
    dateEmbauche: string | null | undefined
) {
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
    const totalRemainingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const remainingYears = Math.floor(totalRemainingDays / 365.25);
    const remainingMonths = Math.floor((totalRemainingDays % 365.25) / 30.4375);

    // Calcul de la progression globale du cycle de travail (Date embauche -> Aujourd'hui -> Retraite)
    const hireDate = dateEmbauche ? new Date(dateEmbauche) : new Date(now.getFullYear() - 1, 0, 1);
    const totalCareerDurationMs = retirementDate.getTime() - hireDate.getTime();
    const elapsedMs = now.getTime() - hireDate.getTime();

    let completionPercent = 0;
    if (totalCareerDurationMs > 0) {
        completionPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalCareerDurationMs) * 100)));
    }
    if (isRetired) {
        completionPercent = 100;
    }

    return {
        retirementDate,
        retirementYear: retirementDate.getFullYear(),
        formattedRetirementDate: retirementDate.toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
        }),
        isRetired,
        remainingYears,
        remainingMonths,
        remainingText: isRetired
            ? "Âge légal atteint"
            : remainingYears === 0
            ? `${remainingMonths} mois restants`
            : `${remainingYears} an${remainingYears > 1 ? "s" : ""}${remainingMonths > 0 ? ` et ${remainingMonths} mois` : ""} restants`,
        completionPercent,
        hasExactBirthDate,
    };
}

function formatShortDate(dateStr: string): string {
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, (month || 1) - 1, day || 1);
        return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    } catch {
        return dateStr;
    }
}

function formatFullDate(dateStr: string): string {
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, (month || 1) - 1, day || 1);
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return dateStr;
    }
}

export default function CareerChart({ employee, history }: CareerChartProps) {
    const [projectionMode, setProjectionMode] = useState<ProjectionMode>("dynamic");

    // Calculs de l'ancienneté et de la retraite
    const tenure = useMemo(() => calculateTenureDetails(employee.date_embauche), [employee.date_embauche]);
    const retirement = useMemo(
        () => calculateRetirementDetails(employee.date_naissance, employee.date_embauche),
        [employee.date_naissance, employee.date_embauche]
    );

    // Construction de la trajectoire complète : Embauche -> Jalons réels -> Présent -> Horizon Retraite (60 ans)
    const {
        chartData,
        initialSalary,
        currentSalary,
        projectedRetirementSalary,
        totalGrowth,
        totalGrowthPct,
    } = useMemo(() => {
        const sortedHistory = [...history].sort((a, b) => {
            const timeA = new Date(a.change_date).getTime();
            const timeB = new Date(b.change_date).getTime();
            return timeA - timeB;
        });

        const points: TrajectoryPoint[] = [];
        let runningSalary = parseFloat(employee.salaire_de_base || "0");
        let firstSalary = runningSalary;

        // Détection du premier salaire historique si disponible
        const firstSalaryEvent = sortedHistory.find((e) => e.field === "salaire" && parseFloat(e.old_value) > 0);
        if (firstSalaryEvent) {
            firstSalary = parseFloat(firstSalaryEvent.old_value);
        } else {
            const initialSalEvent = sortedHistory.find((e) => e.field === "salaire" && parseFloat(e.new_value) > 0);
            if (initialSalEvent) {
                firstSalary = parseFloat(initialSalEvent.new_value);
            }
        }

        // 1. Point d'Embauche initial
        const hireDateStr = employee.date_embauche || new Date().toISOString().split("T")[0];
        const embaucheHistory = sortedHistory.find((e) => e.field === "embauche");
        const initialContract = (embaucheHistory?.contract_type || embaucheHistory?.new_value || employee.type_contrat || "CDI").toUpperCase();

        points.push({
            chartKey: `hire_${hireDateStr}`,
            date: hireDateStr,
            displayDate: formatShortDate(hireDateStr),
            formattedDate: formatFullDate(hireDateStr),
            realizedSalary: firstSalary,
            projectedSalary: null,
            displaySalary: firstSalary,
            phase: "realized",
            eventTitle: `Embauche : ${embaucheHistory?.new_value || employee.poste}`,
            eventField: "embauche",
            eventReason: embaucheHistory?.reason || `Intégration initiale en contrat ${initialContract}`,
            isMilestone: true,
            dotColor: "#10b981", // Emerald
            badgeLabel: "Embauche",
        });

        runningSalary = firstSalary;

        // 2. Points intermédiaires de l'historique réalisé
        const milestonePoints: TrajectoryPoint[] = [];

        sortedHistory.forEach((item, index) => {
            // Éviter de dupliquer l'embauche si elle correspond à la date initiale
            if (item.field === "embauche" && item.change_date === hireDateStr) {
                return;
            }

            const prevSalary = runningSalary;
            let title = "";
            let dotColor = "#3b82f6"; // Blue default
            let badge = "Jalon";
            let diff: number | undefined;
            let diffPct: string | null = null;

            if (item.field === "salaire") {
                const newSal = parseFloat(item.new_value) || runningSalary;
                // Si c'est l'enregistrement du salaire initial identique au premier salaire, on ne duplique pas
                if (item.change_date === hireDateStr && newSal === firstSalary) {
                    return;
                }
                runningSalary = newSal;
                diff = newSal - prevSalary;
                diffPct = prevSalary > 0 ? ((diff / prevSalary) * 100).toFixed(1) : null;
                title = `Ajustement salarial : ${newSal.toLocaleString()} FCFA`;
                dotColor = "#059669";
                badge = "Salaire";
            } else if (item.field === "promotion") {
                title = `Promotion : ${item.new_value}`;
                dotColor = "#f59e0b"; // Amber
                badge = "Promotion";
            } else if (item.field === "poste") {
                title = `Poste : ${item.new_value}`;
                dotColor = "#6366f1"; // Indigo
                badge = "Poste";
            } else if (item.field === "transfert") {
                title = `Transfert : ${item.new_value}`;
                dotColor = "#8b5cf6"; // Violet
                badge = "Transfert";
            } else if (item.field === "changement_contrat") {
                title = `Contrat : ${item.new_value?.toUpperCase()}`;
                dotColor = "#06b6d4"; // Cyan
                badge = "Contrat";
            } else if (item.field === "recommandation") {
                title = `Recommandation : ${item.new_value || "Proposition RH"}`;
                dotColor = "#d97706"; // Amber
                badge = "Recommandation";
            } else {
                title = `${item.field.toUpperCase()} : ${item.new_value}`;
                dotColor = "#64748b";
                badge = item.field;
            }

            const point: TrajectoryPoint = {
                chartKey: `event_${item.id || index}_${item.change_date}`,
                date: item.change_date,
                displayDate: formatShortDate(item.change_date),
                formattedDate: formatFullDate(item.change_date),
                realizedSalary: runningSalary,
                projectedSalary: null,
                displaySalary: runningSalary,
                phase: "realized",
                eventTitle: title,
                eventField: item.field,
                eventReason: item.reason,
                isMilestone: true,
                diff,
                diffPct,
                dotColor,
                badgeLabel: badge,
            };

            points.push(point);
            milestonePoints.push(point);
        });

        // 3. Point "Aujourd'hui" (Jalon pivot entre le passé certifié et le futur projeté)
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const currSalary = Math.max(runningSalary, parseFloat(employee.salaire_de_base || "0"));

        const presentPoint: TrajectoryPoint = {
            chartKey: `today_${todayStr}`,
            date: todayStr,
            displayDate: "Aujourd'hui",
            formattedDate: `Aujourd'hui (${now.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })})`,
            realizedSalary: currSalary,
            projectedSalary: currSalary, // Connecte la courbe sans cassure
            displaySalary: currSalary,
            phase: "present",
            eventTitle: `Situation actuelle : ${employee.poste}`,
            eventReason: `Rémunération de base actuelle au département ${employee.department_nom || "général"}`,
            isMilestone: true,
            dotColor: "#2563eb",
            badgeLabel: "Actuel",
        };

        // Si le dernier jalon n'est pas aujourd'hui, on ajoute le point présent
        const lastPoint = points[points.length - 1];
        if (!lastPoint || lastPoint.date !== todayStr) {
            points.push(presentPoint);
        } else {
            // Le dernier point est aujourd'hui : on lui assigne projectedSalary pour faire la liaison sans écraser ses propriétés de jalon
            lastPoint.projectedSalary = currSalary;
            if (!lastPoint.isMilestone) {
                lastPoint.phase = "present";
                lastPoint.badgeLabel = "Actuel";
                lastPoint.dotColor = "#2563eb";
            }
        }

        // 4. Projections futures vers la Retraite (60 ans)
        const currentYear = now.getFullYear();
        const retirementYear = retirement.retirementYear;
        const yearsToRetirement = Math.max(0, retirementYear - currentYear);

        let finalProjectedSalary = currSalary;

        if (yearsToRetirement > 0) {
            // On calcule des paliers de projection (tous les 3 à 5 ans selon l'horizon restant)
            const stepYears = yearsToRetirement > 15 ? 4 : yearsToRetirement > 6 ? 3 : 2;
            let currentProjSalary = currSalary;

            for (let year = currentYear + stepYears; year < retirementYear; year += stepYears) {
                // Taux d'évolution prévisionnel selon le mode choisi
                if (projectionMode === "dynamic") {
                    // Simulation d'une valorisation moyenne de carrière (~4% tous les stepYears)
                    currentProjSalary = Math.round(currentProjSalary * (1 + 0.045 * (stepYears / 3)));
                }

                const projDateStr = `${year}-06-30`;
                points.push({
                    chartKey: `proj_${year}`,
                    date: projDateStr,
                    displayDate: `${year}`,
                    formattedDate: `Projection mi-${year}`,
                    realizedSalary: null,
                    projectedSalary: currentProjSalary,
                    displaySalary: currentProjSalary,
                    phase: "projected",
                    eventTitle: `Échelon projeté (${year})`,
                    eventReason: `Projection prévisionnelle de trajectoire professionnelle à l'horizon ${year}`,
                    isMilestone: false,
                    badgeLabel: "Projection",
                });
            }

            // Salaire final prévisionnel à la retraite
            if (projectionMode === "dynamic") {
                finalProjectedSalary = Math.round(currentProjSalary * 1.05);
            } else {
                finalProjectedSalary = currSalary;
            }

            // 5. Point Final : Retraite (60 ans)
            const retirementDateStr = retirement.retirementDate.toISOString().split("T")[0];
            const retirementPoint: TrajectoryPoint = {
                chartKey: `retirement_${retirementYear}`,
                date: retirementDateStr,
                displayDate: `${retirementYear} (60 ans)`,
                formattedDate: `${retirement.formattedRetirementDate} (Départ à 60 ans)`,
                realizedSalary: null,
                projectedSalary: finalProjectedSalary,
                displaySalary: finalProjectedSalary,
                phase: "retirement",
                eventTitle: "🏁 Horizon Retraite (Âge légal 60 ans)",
                eventReason: retirement.hasExactBirthDate
                    ? "Départ légal à la retraite calculé sur la date de naissance (60 ans)"
                    : "Projection estimée sur un horizon indicatif de carrière (60 ans)",
                isMilestone: true,
                dotColor: "#8b5cf6",
                badgeLabel: "Retraite 60 ans",
            };

            points.push(retirementPoint);
            milestonePoints.push(retirementPoint);
        }

        const growth = currSalary - firstSalary;
        const growthPct = firstSalary > 0 ? ((growth / firstSalary) * 100).toFixed(1) : "0.0";

        return {
            chartData: points,
            milestones: milestonePoints,
            initialSalary: firstSalary,
            currentSalary: currSalary,
            projectedRetirementSalary: finalProjectedSalary,
            totalGrowth: growth,
            totalGrowthPct: growthPct,
        };
    }, [employee, history, retirement, projectionMode]);

    const todayPoint = useMemo(() => {
        const todayStr = new Date().toISOString().split("T")[0];
        return chartData.find((pt) => pt.phase === "present") || chartData.find((pt) => pt.date === todayStr);
    }, [chartData]);

    const pointsMap = useMemo(() => {
        const map = new Map<string, TrajectoryPoint>();
        chartData.forEach((pt) => map.set(pt.chartKey, pt));
        return map;
    }, [chartData]);

    return (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm space-y-6">
            {/* Header avec Titre et Sélecteur de Simulation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <Compass size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                Parcours Professionnel & Trajectoire Carrière
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                    Cycle complet jusqu'à 60 ans
                                </span>
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Visualisation continue de l'embauche aux jalons actuels et projections jusqu'à la retraite
                            </p>
                        </div>
                    </div>
                </div>

                {/* Contrôles de simulation */}
                <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/60 self-start md:self-auto">
                    <button
                        type="button"
                        onClick={() => setProjectionMode("dynamic")}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                            projectionMode === "dynamic"
                                ? "bg-card text-foreground shadow-xs border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <TrendingUp size={13} className="text-emerald-500" />
                        <span>Projection dynamique</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setProjectionMode("conservative")}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                            projectionMode === "conservative"
                                ? "bg-card text-foreground shadow-xs border border-border"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <SlidersHorizontal size={13} className="text-muted-foreground" />
                        <span>Statut quo</span>
                    </button>
                </div>
            </div>

            {/* Cartes KPI clés de Carrière */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* KPI 1 : Ancienneté Actuelle */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 hover:border-border transition-colors">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Ancienneté acquise</span>
                        <Clock size={15} className="text-blue-500" />
                    </div>
                    <p className="text-base font-bold text-foreground capitalize">{tenure.text}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <Sparkles size={11} className="text-emerald-500" />
                        Entrée le {formatShortDate(employee.date_embauche || "")} • Contrat : {employee.type_contrat?.toUpperCase() || "CDI"}
                    </p>
                </div>

                {/* KPI 2 : Horizon Retraite (60 ans) */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 hover:border-border transition-colors">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Horizon Retraite (60 ans)</span>
                        <Flag size={15} className="text-purple-500" />
                    </div>
                    <p className="text-base font-bold text-foreground">
                        {retirement.retirementYear}{" "}
                        <span className="text-xs font-normal text-muted-foreground">
                            ({retirement.isRetired ? "Atteint" : `dans ${retirement.remainingYears} ans`})
                        </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1 truncate" title={retirement.remainingText}>
                        {retirement.hasExactBirthDate ? `Date : ${retirement.formattedRetirementDate}` : "Basé sur 60 ans légaux"}
                    </p>
                </div>

                {/* KPI 3 : Jauge d'avancement de carrière globale */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 hover:border-border transition-colors">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Cycle professionnel</span>
                        <span className="text-xs font-bold text-primary">{retirement.completionPercent}%</span>
                    </div>
                    {/* Barre de progression visuelle */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden my-2 border border-border/50">
                        <div
                            className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${retirement.completionPercent}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                        <span>Embauche</span>
                        <span>Retraite</span>
                    </p>
                </div>

                {/* KPI 4 : Dynamique salariale & Jalons */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border/80 hover:border-border transition-colors">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                        <span className="font-medium">Salaire & Évolution</span>
                        <Wallet size={15} className="text-emerald-500" />
                    </div>
                    <p className="text-base font-bold text-foreground">
                        {currentSalary.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] mt-1">
                        <span
                            className={`font-semibold ${
                                totalGrowth >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-600 dark:text-rose-400"
                            }`}
                        >
                            {totalGrowth >= 0 ? `+${totalGrowthPct}%` : `${totalGrowthPct}%`}
                        </span>
                        <span className="text-muted-foreground">
                            (init. {initialSalary.toLocaleString()} F • {history.length} jalon{history.length > 1 ? "s" : ""})
                        </span>
                    </div>
                </div>
            </div>

            {/* Légende explicative de la courbe */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-muted/20 px-3.5 py-2.5 rounded-xl border border-border/50">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-1 bg-blue-600 rounded-full" />
                        <span className="text-foreground font-medium">Parcours réalisé (certifié)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-1 border-t-2 border-dashed border-purple-500" />
                        <span className="text-purple-700 dark:text-purple-300 font-medium">
                            Projection horizon retraite (60 ans)
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span className="text-muted-foreground">Embauche</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span className="text-muted-foreground">Promotions & Postes</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block ring-2 ring-blue-300 dark:ring-blue-800" />
                        <span className="text-muted-foreground">Aujourd'hui</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                        <span className="text-muted-foreground">🏁 Retraite</span>
                    </div>
                </div>

                {projectionMode === "dynamic" && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <ArrowUpRight size={12} className="text-emerald-500" />
                        <span>Projection finale estimée : {projectedRetirementSalary.toLocaleString()} FCFA</span>
                    </div>
                )}
            </div>

            {/* Graphique Recharts Area / ComposedChart */}
            <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 15, right: 25, left: 10, bottom: 0 }}>
                        <defs>
                            {/* Gradient pour la partie réalisée */}
                            <linearGradient id="careerRealizedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                            </linearGradient>
                            {/* Gradient pour la projection future */}
                            <linearGradient id="careerProjectedGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="currentColor"
                            className="text-border/60"
                        />

                        <XAxis
                            dataKey="chartKey"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                            className="text-muted-foreground"
                            tickFormatter={(key) => pointsMap.get(key)?.displayDate ?? key}
                            dy={10}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                            className="text-muted-foreground"
                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            domain={["dataMin - 50000", "dataMax + 80000"]}
                        />

                        {/* Ligne verticale marquant 'Aujourd'hui' */}
                        {todayPoint && (
                            <ReferenceLine
                                x={todayPoint.chartKey}
                                stroke="#2563eb"
                                strokeDasharray="2 2"
                                label={{
                                    value: "Aujourd'hui",
                                    position: "insideTopLeft",
                                    fill: "#2563eb",
                                    fontSize: 10,
                                    fontWeight: 600,
                                }}
                            />
                        )}

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as TrajectoryPoint;
                                    const isRealized = data.phase === "realized" || data.phase === "present";
                                    const isRetirement = data.phase === "retirement";
                                    const isProjected = data.phase === "projected";

                                    return (
                                        <div className="bg-card/95 backdrop-blur-md border border-border p-3.5 rounded-2xl shadow-xl text-xs space-y-2 max-w-[260px] animate-in fade-in-0 zoom-in-95">
                                            {/* Header du tooltip avec badge de statut */}
                                            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-border/60">
                                                <div className="flex items-center gap-1.5 text-muted-foreground font-medium truncate">
                                                    <Calendar size={12} />
                                                    <span>{data.formattedDate}</span>
                                                </div>
                                                {data.badgeLabel && (
                                                    <span
                                                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                            isRetirement
                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                                                                : isProjected
                                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                                                                : data.phase === "present"
                                                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                                        }`}
                                                    >
                                                        {data.badgeLabel}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Rémunération / Échelon */}
                                            <div className="flex items-baseline justify-between gap-3 pt-0.5">
                                                <span className="text-muted-foreground">
                                                    {isRealized ? "Rémunération :" : "Échelon estimé :"}
                                                </span>
                                                <span className="font-bold text-foreground text-sm">
                                                    {data.displaySalary.toLocaleString()} FCFA
                                                </span>
                                            </div>

                                            {data.diff !== undefined && data.diff !== 0 && (
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <span>Évolution :</span>
                                                    <span>
                                                        +{data.diff.toLocaleString()} FCFA ({data.diffPct}%)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Événement & détails */}
                                            {data.eventTitle && (
                                                <div className="pt-1.5 border-t border-border/40 font-semibold text-foreground">
                                                    {data.eventTitle}
                                                </div>
                                            )}

                                            {data.eventReason && (
                                                <p className="text-muted-foreground text-[11px] italic leading-relaxed">
                                                    « {data.eventReason} »
                                                </p>
                                            )}

                                            {isRetirement && (
                                                <div className="pt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                                                    🎯 Point d'aboutissement de la carrière NexHR
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        {/* Aire 1 : Parcours certifié passé et présent (Bleu franc) */}
                        <Area
                            type="monotone"
                            dataKey="realizedSalary"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#careerRealizedGrad)"
                            connectNulls={false}
                        />

                        {/* Aire 2 : Trajectoire projetée jusqu'à la retraite (Violet pointillé) */}
                        <Area
                            type="monotone"
                            dataKey="projectedSalary"
                            stroke="#8b5cf6"
                            strokeWidth={2.2}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#careerProjectedGrad)"
                            connectNulls={true}
                        />

                        {/* Marqueurs visuels pour les jalons clés */}
                        {chartData
                            .filter((pt) => pt.isMilestone)
                            .map((pt) => (
                                <ReferenceDot
                                    key={pt.chartKey}
                                    x={pt.chartKey}
                                    y={pt.displaySalary}
                                    r={pt.phase === "present" ? 6 : pt.phase === "retirement" ? 6 : 5}
                                    fill={pt.dotColor || "#2563eb"}
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                />
                            ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Frise chronologique récapitulative des étapes de vie professionnelle */}
            <div className="pt-3 border-t border-border/70">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            1
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Entrée en fonction</p>
                            <p className="text-[11px] text-muted-foreground">
                                {formatShortDate(employee.date_embauche || "")} • {employee.poste}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                            2
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Étape actuelle</p>
                            <p className="text-[11px] text-muted-foreground">
                                {tenure.text} d'ancienneté validée
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/15">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                            3
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Horizon Retraite (60 ans)</p>
                            <p className="text-[11px] text-muted-foreground">
                                {retirement.isRetired
                                    ? "Éligible au départ"
                                    : `Départ estimé en ${retirement.retirementYear} (~${retirement.remainingYears} ans)`}
                            </p>
                        </div>
                    </div>
                </div>

                {!retirement.hasExactBirthDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg">
                        <Info size={13} className="text-blue-500 shrink-0" />
                        <span>
                            Note : La date de naissance n'étant pas renseignée sur le profil, la retraite à 60 ans est calculée sur un cycle indicatif de 30 ans. Renseignez la date de naissance dans la fiche pour une précision exacte.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
