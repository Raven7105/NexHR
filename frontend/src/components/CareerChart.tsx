import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceDot,
} from "recharts";
import { TrendingUp, Clock, Award, Wallet, Calendar } from "lucide-react";
import type { Employee, EmployeeHistory } from "@/types";

interface CareerChartProps {
    employee: Employee;
    history: EmployeeHistory[];
}

interface ChartDataPoint {
    date: string;
    formattedDate: string;
    displayDate: string;
    salary: number;
    eventLabel?: string;
    eventField?: string;
    eventReason?: string;
    isMilestone?: boolean;
    diff?: number;
    diffPct?: string | null;
}

function calculateTenure(dateEmbauche: string): string {
    if (!dateEmbauche) return "—";
    try {
        const start = new Date(dateEmbauche);
        const now = new Date();
        const diffMs = now.getTime() - start.getTime();
        if (diffMs < 0) return "Récent";

        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years = Math.floor(totalDays / 365.25);
        const remainingDays = totalDays % 365.25;
        const months = Math.floor(remainingDays / 30.4375);

        if (years === 0 && months === 0) {
            return `${totalDays} jour${totalDays > 1 ? "s" : ""}`;
        }
        if (years === 0) {
            return `${months} mois`;
        }
        if (months === 0) {
            return `${years} an${years > 1 ? "s" : ""}`;
        }
        return `${years} an${years > 1 ? "s" : ""} et ${months} mois`;
    } catch {
        return "—";
    }
}

function formatShortDate(dateStr: string): string {
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    } catch {
        return dateStr;
    }
}

function formatFullDate(dateStr: string): string {
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    } catch {
        return dateStr;
    }
}

export default function CareerChart({ employee, history }: CareerChartProps) {
    // Calcul de la trajectoire salariale et des jalons dans le temps
    const { chartData, milestones, initialSalary, currentSalary, totalGrowth, totalGrowthPct } = useMemo(() => {
        const sortedHistory = [...history].sort((a, b) => {
            const timeA = new Date(a.change_date).getTime();
            const timeB = new Date(b.change_date).getTime();
            return timeA - timeB;
        });

        const points: ChartDataPoint[] = [];
        let runningSalary = parseFloat(employee.salaire_de_base || "0");
        let firstSalary = runningSalary;

        // Si des événements de salaire existent, chercher le premier salaire
        const firstSalaryEvent = sortedHistory.find((e) => e.field === "salaire" && parseFloat(e.old_value) > 0);
        if (firstSalaryEvent) {
            firstSalary = parseFloat(firstSalaryEvent.old_value);
        }

        // Point 1: Embauche
        const hireDate = employee.date_embauche || new Date().toISOString().split("T")[0];
        points.push({
            date: hireDate,
            formattedDate: formatFullDate(hireDate),
            displayDate: formatShortDate(hireDate),
            salary: firstSalary,
            eventLabel: `Embauche : ${employee.poste}`,
            eventField: "embauche",
            isMilestone: true,
        });

        runningSalary = firstSalary;

        // Points intermédiaires de l'historique
        const milestonePoints: ChartDataPoint[] = [];

        sortedHistory.forEach((item) => {
            const prevSalary = runningSalary;
            let label = "";

            if (item.field === "salaire") {
                const newSal = parseFloat(item.new_value) || runningSalary;
                runningSalary = newSal;
                const diff = newSal - prevSalary;
                const diffPct = prevSalary > 0 ? ((diff / prevSalary) * 100).toFixed(1) : null;
                label = `Ajustement : ${newSal.toLocaleString()} FCFA`;

                const point: ChartDataPoint = {
                    date: item.change_date,
                    formattedDate: formatFullDate(item.change_date),
                    displayDate: formatShortDate(item.change_date),
                    salary: runningSalary,
                    eventLabel: label,
                    eventField: item.field,
                    eventReason: item.reason,
                    isMilestone: true,
                    diff,
                    diffPct,
                };
                points.push(point);
                milestonePoints.push(point);
            } else if (item.field === "promotion" || item.field === "poste") {
                label = item.field === "promotion" ? `Promotion : ${item.new_value}` : `Poste : ${item.new_value}`;
                const point: ChartDataPoint = {
                    date: item.change_date,
                    formattedDate: formatFullDate(item.change_date),
                    displayDate: formatShortDate(item.change_date),
                    salary: runningSalary,
                    eventLabel: label,
                    eventField: item.field,
                    eventReason: item.reason,
                    isMilestone: true,
                };
                points.push(point);
                milestonePoints.push(point);
            } else if (item.field === "transfert") {
                label = `Transfert : ${item.new_value}`;
                const point: ChartDataPoint = {
                    date: item.change_date,
                    formattedDate: formatFullDate(item.change_date),
                    displayDate: formatShortDate(item.change_date),
                    salary: runningSalary,
                    eventLabel: label,
                    eventField: item.field,
                    eventReason: item.reason,
                    isMilestone: true,
                };
                points.push(point);
                milestonePoints.push(point);
            }
        });

        // Point final : Aujourd'hui (si la dernière date est antérieure à aujourd'hui)
        const todayStr = new Date().toISOString().split("T")[0];
        const lastPoint = points[points.length - 1];
        if (!lastPoint || lastPoint.date < todayStr) {
            points.push({
                date: todayStr,
                formattedDate: "Aujourd'hui",
                displayDate: "Aujourd'hui",
                salary: parseFloat(employee.salaire_de_base || String(runningSalary)),
                eventLabel: `Actuel (${employee.poste})`,
                isMilestone: false,
            });
        }

        const currSal = parseFloat(employee.salaire_de_base || String(runningSalary));
        const growth = currSal - firstSalary;
        const growthPct = firstSalary > 0 ? ((growth / firstSalary) * 100).toFixed(1) : "0.0";

        return {
            chartData: points,
            milestones: milestonePoints,
            initialSalary: firstSalary,
            currentSalary: currSal,
            totalGrowth: growth,
            totalGrowthPct: growthPct,
        };
    }, [employee, history]);

    const tenureStr = calculateTenure(employee.date_embauche);

    return (
        <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm">
            {/* Titre & Sous-titre */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <TrendingUp size={18} className="text-primary" />
                        Trajectoire & Analytics de carrière
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Évolution salariale et jalons professionnels depuis l'embauche
                    </p>
                </div>
            </div>

            {/* Cartes KPI clés */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {/* KPI 1 : Ancienneté */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Clock size={13} className="text-blue-500" />
                        <span>Ancienneté</span>
                    </div>
                    <p className="text-sm font-bold text-foreground capitalize">{tenureStr}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Depuis le {formatShortDate(employee.date_embauche)}
                    </p>
                </div>

                {/* KPI 2 : Salaire de base actuel */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Wallet size={13} className="text-purple-500" />
                        <span>Salaire de base</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                        {currentSalary.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        Initial : {initialSalary.toLocaleString()} FCFA
                    </p>
                </div>

                {/* KPI 3 : Croissance cumulée */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <TrendingUp size={13} className="text-emerald-500" />
                        <span>Progression globale</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className={`text-sm font-bold ${totalGrowth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {totalGrowth >= 0 ? `+${totalGrowthPct}%` : `${totalGrowthPct}%`}
                        </span>
                        {totalGrowth !== 0 && (
                            <span className="text-[11px] text-muted-foreground">
                                ({totalGrowth >= 0 ? "+" : ""}{totalGrowth.toLocaleString()} F)
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Depuis l'entrée</p>
                </div>

                {/* KPI 4 : Jalons franchis */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                        <Award size={13} className="text-amber-500" />
                        <span>Jalons de parcours</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">
                        {history.length} {history.length > 1 ? "événements" : "événement"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {history.filter((e) => e.field === "promotion").length} promotion(s)
                    </p>
                </div>
            </div>

            {/* Graphique Recharts AreaChart */}
            <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="careerSalaryGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/60" />

                        <XAxis
                            dataKey="displayDate"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                            className="text-muted-foreground"
                            dy={8}
                        />

                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: "currentColor" }}
                            className="text-muted-foreground"
                            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                            domain={["dataMin - 50000", "dataMax + 50000"]}
                        />

                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload as ChartDataPoint;
                                    return (
                                        <div className="bg-card/95 backdrop-blur-md border border-border p-3 rounded-xl shadow-lg text-xs space-y-1.5 max-w-[240px]">
                                            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                                                <Calendar size={12} />
                                                <span>{data.formattedDate}</span>
                                            </div>
                                            <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-border/60">
                                                <span className="text-muted-foreground">Salaire brut :</span>
                                                <span className="font-bold text-foreground text-sm">
                                                    {data.salary.toLocaleString()} FCFA
                                                </span>
                                            </div>
                                            {data.diff && data.diff !== 0 && (
                                                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <span>Écart :</span>
                                                    <span>+{data.diff.toLocaleString()} FCFA ({data.diffPct}%)</span>
                                                </div>
                                            )}
                                            {data.eventLabel && (
                                                <div className="mt-1 pt-1 border-t border-border/40 font-medium text-foreground">
                                                    {data.eventLabel}
                                                </div>
                                            )}
                                            {data.eventReason && (
                                                <p className="italic text-muted-foreground text-[11px]">
                                                    « {data.eventReason} »
                                                </p>
                                            )}
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Area
                            type="monotone"
                            dataKey="salary"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#careerSalaryGradient)"
                        />

                        {/* Points de repère pour les jalons */}
                        {milestones.map((m, idx) => (
                            <ReferenceDot
                                key={idx}
                                x={m.displayDate}
                                y={m.salary}
                                r={5}
                                fill="#2563eb"
                                stroke="#ffffff"
                                strokeWidth={2}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
