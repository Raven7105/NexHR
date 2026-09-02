import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    Building2,
    Calendar,
    User,
    FileText,
    ArrowLeft,
    Loader2,
    Copy,
    Check,
    Award,
    Printer,
    BadgeCheck,
    Clock,
    Lock,
} from "lucide-react";
import { getPublicLeaveVerification } from "@/api/leaves";

export default function VerifyLeavePage() {
    const { token } = useParams<{ token: string }>();
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        getPublicLeaveVerification(token)
            .then((res) => {
                setData(res);
                setIsLoading(false);
            })
            .catch((err) => {
                setError(err?.response?.data?.message || "Autorisation non trouvée ou jeton de sécurité invalide.");
                setIsLoading(false);
            });
    }, [token]);

    const handleCopyRef = () => {
        if (data?.authorization_number) {
            navigator.clipboard.writeText(data.authorization_number);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl space-y-6 relative z-10">
                {/* Brand Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                                NexHR <span className="text-blue-400 font-medium text-xs px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">Vérification Sécurisée</span>
                            </h1>
                            <p className="text-xs text-slate-400">Registre officiel des autorisations de congés signées</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                        <Lock size={12} className="text-emerald-400" /> SSL Secured
                    </div>
                </div>

                {isLoading ? (
                    <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-4">
                        <Loader2 className="animate-spin text-blue-400" size={40} />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-white">Vérification d'authenticité du document...</p>
                            <p className="text-xs text-slate-400 mt-1">Interrogation du registre central de signature numérique</p>
                        </div>
                    </div>
                ) : error || !data ? (
                    <div className="py-12 text-center space-y-4">
                        <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <ShieldAlert size={36} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Autorisation Invalide ou Non Trouvée</h2>
                            <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">{error}</p>
                        </div>
                        <p className="text-[11px] text-slate-500">
                            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le service Ressources Humaines de l'entreprise.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Certificate Main Status Banner */}
                        <div
                            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${data.valid
                                    ? "bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-emerald-950/50 shadow-lg"
                                    : "bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 border-amber-500/40 text-amber-300"
                                }`}
                        >
                            <div className="flex items-center gap-3.5 text-center sm:text-left">
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${data.valid
                                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                        }`}
                                >
                                    {data.valid ? <ShieldCheck size={28} /> : <ShieldAlert size={28} />}
                                </div>
                                <div>
                                    <div className="flex items-center justify-center sm:justify-start gap-2">
                                        <h2 className="font-bold text-base text-white">{data.statut}</h2>
                                        <BadgeCheck size={18} className="text-emerald-400" />
                                    </div>
                                    <p className="text-xs text-slate-300 mt-0.5 flex items-center justify-center sm:justify-start gap-1 font-mono">
                                        Réf : <span className="font-bold text-white">{data.authorization_number}</span>
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={handleCopyRef}
                                className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                            >
                                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                {copied ? "Copié !" : "Copier la réf"}
                            </button>
                        </div>

                        {/* Details Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Card Employé */}
                            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <User size={14} className="text-blue-400" /> Bénéficiaire
                                </span>
                                <p className="text-sm font-bold text-white">{data.employee_name}</p>
                                <p className="text-xs text-slate-400 font-mono">Matricule : {data.matricule}</p>
                            </div>

                            {/* Card Type de congé */}
                            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <FileText size={14} className="text-purple-400" /> Type de Congé
                                </span>
                                <p className="text-sm font-bold text-white">{data.leave_type}</p>
                                <p className="text-xs text-slate-400">Congé payé réglementaire</p>
                            </div>

                            {/* Card Période */}
                            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2 sm:col-span-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Calendar size={14} className="text-emerald-400" /> Période d'absence autorisée
                                </span>
                                <div className="flex items-center justify-between pt-1">
                                    <p className="text-sm font-bold text-white font-mono">
                                        Du {data.date_debut} au {data.date_fin}
                                    </p>
                                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-xs">
                                        {data.nombre_jours} jours accordés
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Hierarchical Validations Timeline */}
                        <div className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl space-y-3">
                            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 mb-3">
                                <Award size={16} className="text-amber-400" /> Chîne de validation officielle (3 Niveaux)
                            </h3>

                            <div className="space-y-2.5">
                                {/* Niveau 1 */}
                                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                                            1
                                        </div>
                                        <span className="font-semibold text-slate-200">Validation Manager Hiérarchique</span>
                                    </div>
                                    {data.validations?.manager?.approved ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                                            <CheckCircle2 size={15} /> Validé le {data.validations.manager.date}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 font-medium">Non validé</span>
                                    )}
                                </div>

                                {/* Niveau 2 */}
                                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                                            2
                                        </div>
                                        <span className="font-semibold text-slate-200">Validation Responsable RH</span>
                                    </div>
                                    {data.validations?.hr?.approved ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                                            <CheckCircle2 size={15} /> Validé le {data.validations.hr.date}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 font-medium">Non validé</span>
                                    )}
                                </div>

                                {/* Niveau 3 */}
                                <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                                            3
                                        </div>
                                        <span className="font-semibold text-slate-200">Signature PDG / Direction Générale</span>
                                    </div>
                                    {data.validations?.ceo?.approved ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-mono text-[11px]">
                                            <CheckCircle2 size={15} /> Signé le {data.validations.ceo.date}
                                        </span>
                                    ) : (
                                        <span className="text-slate-500 font-medium">Non validé</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions & Print */}
                        <div className="flex items-center justify-between pt-2">
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <Printer size={15} /> Imprimer l'attestation de vérification
                            </button>

                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <ArrowLeft size={15} /> Espace NexHR
                            </Link>
                        </div>
                    </div>
                )}

                {/* Footer Timestamp */}
                <div className="pt-4 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Document vérifié numériquement par NexHR Vault</span>
                    <span className="flex items-center gap-1">
                        <Clock size={11} /> {new Date().toLocaleDateString("fr-FR")}
                    </span>
                </div>
            </div>
        </div>
    );
}
