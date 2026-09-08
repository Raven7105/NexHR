import { useState, useEffect } from "react";
import {
    X,
    Sparkles,
    Award,
    TrendingUp,
    FileSignature,
    Building2,
    Send,
    UserCheck,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { useRecommendEvolution } from "@/hooks/useEmployees";
import type { SubordinateBrief } from "@/types";

interface RecommendEvolutionModalProps {
    isOpen: boolean;
    onClose: () => void;
    subordinates?: SubordinateBrief[];
    selectedSubordinateId?: string;
    singleEmployee?: {
        id: string;
        nom_complet: string;
        poste: string;
        department_nom?: string | null;
        type_contrat?: string;
    };
    onSuccess?: () => void;
}

type EvolutionType = "promotion" | "salaire" | "changement_contrat" | "transfert" | "autre";

interface EvolutionOption {
    type: EvolutionType;
    label: string;
    badge: string;
    icon: typeof Award;
    color: string;
    placeholder: string;
    inputLabel: string;
    description: string;
}

const EVOLUTION_OPTIONS: EvolutionOption[] = [
    {
        type: "promotion",
        label: "Promotion de poste",
        badge: "Carrière",
        icon: Award,
        color: "text-amber-500 bg-amber-500/10 border-amber-500/30",
        inputLabel: "Nouveau poste proposé",
        placeholder: "ex: Senior Software Engineer, Lead RH...",
        description: "Évolution vers un rôle supérieur, nouveau titre ou élargissement des responsabilités.",
    },
    {
        type: "salaire",
        label: "Revalorisation salariale",
        badge: "Rémunération",
        icon: TrendingUp,
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
        inputLabel: "Montant brut mensuel proposé (FCFA)",
        placeholder: "ex: 450 000",
        description: "Augmentation au mérite, révision annuelle ou prime structurelle.",
    },
    {
        type: "changement_contrat",
        label: "Pérennisation contractuelle",
        badge: "Contrat",
        icon: FileSignature,
        color: "text-blue-500 bg-blue-500/10 border-blue-500/30",
        inputLabel: "Nouveau type de contrat",
        placeholder: "ex: CDI, Prolongation CDD...",
        description: "Transformation de CDD ou Stage en CDI, renouvellement ou sécurisation contractuelle.",
    },
    {
        type: "transfert",
        label: "Mobilité / Transfert",
        badge: "Organisation",
        icon: Building2,
        color: "text-purple-500 bg-purple-500/10 border-purple-500/30",
        inputLabel: "Département ou pôle d'affectation",
        placeholder: "ex: Pôle Digital, Direction Financière...",
        description: "Mutation vers un autre département ou mission transverse.",
    },
    {
        type: "autre",
        label: "Autre évolution managériale",
        badge: "Spécial",
        icon: Sparkles,
        color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30",
        inputLabel: "Détail de la proposition",
        placeholder: "ex: Référent projet, Programme de formation certifiante...",
        description: "Recommandation spécifique ou jalon professionnel personnalisé.",
    },
];

export default function RecommendEvolutionModal({
    isOpen,
    onClose,
    subordinates = [],
    selectedSubordinateId,
    singleEmployee,
    onSuccess,
}: RecommendEvolutionModalProps) {
    const recommendMutation = useRecommendEvolution();

    const [subordinateId, setSubordinateId] = useState<string>(
        selectedSubordinateId || singleEmployee?.id || subordinates[0]?.id || ""
    );
    const [evolutionType, setEvolutionType] = useState<EvolutionType>("promotion");
    const [proposedValue, setProposedValue] = useState("");
    const [justification, setJustification] = useState("");

    // Synchroniser la sélection si les props changent
    useEffect(() => {
        if (selectedSubordinateId) {
            setSubordinateId(selectedSubordinateId);
        } else if (singleEmployee?.id) {
            setSubordinateId(singleEmployee.id);
        } else if (subordinates.length > 0 && !subordinateId) {
            setSubordinateId(subordinates[0].id);
        }
    }, [selectedSubordinateId, singleEmployee, subordinates]);

    if (!isOpen) return null;

    const currentOption = EVOLUTION_OPTIONS.find((opt) => opt.type === evolutionType) || EVOLUTION_OPTIONS[0];

    // Trouver le collaborateur sélectionné
    const activeSubordinate = singleEmployee
        ? singleEmployee
        : subordinates.find((s) => s.id === subordinateId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subordinateId) return;

        try {
            await recommendMutation.mutateAsync({
                id: subordinateId,
                data: {
                    evolution_type: evolutionType,
                    proposed_value: proposedValue.trim(),
                    justification: justification.trim(),
                },
            });
            setProposedValue("");
            setJustification("");
            onSuccess?.();
            onClose();
        } catch {
            // L'erreur est gérée par le toast dans le hook
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden my-8">
                {/* En-tête Gradient & Titre */}
                <div className="relative bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 border-b border-border">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold text-foreground">
                                        Recommander une Évolution RH
                                    </h2>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                        Espace Manager
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Soumettez une proposition managériale officielle directement transmise à la direction RH.
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Sélection du collaborateur */}
                    {singleEmployee ? (
                        <div className="bg-muted/40 border border-border rounded-xl p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
                                    {singleEmployee.nom_complet.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground">
                                        {singleEmployee.nom_complet}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {singleEmployee.poste} • {singleEmployee.department_nom || "Équipe"}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <UserCheck size={13} />
                                Votre collaborateur direct
                            </span>
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                Collaborateur supervisé <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={subordinateId}
                                onChange={(e) => setSubordinateId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                                required
                            >
                                {subordinates.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.nom_complet} — {sub.poste} ({sub.department_nom || "Équipe"})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Type d'évolution */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                            Type d'évolution recommandée <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {EVOLUTION_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = evolutionType === opt.type;
                                return (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        onClick={() => setEvolutionType(opt.type)}
                                        className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                                            isSelected
                                                ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                                                : "border-border bg-card hover:bg-muted/40 hover:border-border/80"
                                        }`}
                                    >
                                        <div className={`p-2 rounded-lg shrink-0 border ${opt.color}`}>
                                            <Icon size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                    {opt.label}
                                                </p>
                                                {isSelected && (
                                                    <CheckCircle2 size={14} className="text-primary shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
                                                {opt.description}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Valeur proposée */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>{currentOption.inputLabel}</span>
                            <span className="text-[11px] text-muted-foreground font-normal">
                                Valeur cible souhaitée
                            </span>
                        </label>
                        <input
                            type="text"
                            value={proposedValue}
                            onChange={(e) => setProposedValue(e.target.value)}
                            placeholder={currentOption.placeholder}
                            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/60"
                        />
                    </div>

                    {/* Argumentaire / Justification managériale */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                Argumentaire & Justification Managériale <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[11px] text-muted-foreground">
                                {justification.length} caractères
                            </span>
                        </div>
                        <textarea
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            placeholder="Exposez les accomplissements clés du collaborateur, son impact dans l'équipe, les résultats atteints ou les responsabilités additionnelles justifiant cette proposition auprès des RH..."
                            rows={4}
                            required
                            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-muted-foreground/60 leading-relaxed resize-none"
                        />
                    </div>

                    {/* Bandeau d'information & Traçabilité */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                        <AlertCircle size={16} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <p className="leading-relaxed">
                            Cette recommandation sera inscrite dans le parcours professionnel de{" "}
                            <span className="font-semibold text-foreground">
                                {activeSubordinate?.nom_complet || "ce collaborateur"}
                            </span>{" "}
                            et déclenchera une notification immédiate au Responsable RH et à la Direction.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={recommendMutation.isPending}
                            className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={recommendMutation.isPending || !justification.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={15} />
                            {recommendMutation.isPending ? "Transmission en cours..." : "Transmettre la recommandation RH"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
