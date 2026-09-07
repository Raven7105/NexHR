import { useState, useEffect } from "react";
import {
    Building2,
    CreditCard,
    Save,
    ShieldCheck,
    Check,
    Clock,
    Phone,
    MapPin,
    Hash,
    Coins,
    Sparkles,
    CheckCircle2,
    FileText,
    Lock,
    Globe,
    AlertCircle,
    Upload,
    Image as ImageIcon,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useCompanies, useUpdateCompany } from "@/hooks/useCompany";
import { useEmployees } from "@/hooks/useEmployees";

export default function SettingsPage() {
    const { user } = useAuth();
    // Le PDG, les Responsables RH et les Superadmins ont le droit de modifier les paramètres
    const isAdmin =
        user?.role === "superadmin" ||
        user?.role === "pdg" ||
        user?.role === "responsable_rh" ||
        user?.role === "admin_rh";

    const { data: companiesData, isLoading } = useCompanies();
    const { data: employeesData } = useEmployees();
    const updateCompany = useUpdateCompany();

    const companyList = Array.isArray(companiesData)
        ? companiesData
        : (companiesData as any)?.results ?? [];
    const currentCompany = companyList[0];

    const employeeCount = Array.isArray(employeesData?.results)
        ? employeesData.results.length
        : Array.isArray(employeesData)
            ? employeesData.length
            : 0;

    const [activeTab, setActiveTab] = useState<
        "identity" | "matricule" | "schedule" | "governance" | "billing"
    >("identity");

    const [formData, setFormData] = useState({
        nom: "",
        email_contact: "",
        telephone: "",
        adresse: "",
        ville: "",
        pays: "Bénin",
        numero_ifu: "",
        devise: "FCFA",
        format_matricule: "entreprise" as "departement" | "entreprise",
        prefixe_matricule: "EMP",
        plan_abonnement: "starter" as "gratuit" | "starter" | "pro",
        heure_debut_journee: "08:00",
        heure_fin_journee: "17:30",
        tolerance_retard_minutes: 15,
        delai_prevenance_conge_jours: 2,
        logo: "",
    });

    useEffect(() => {
        if (currentCompany) {
            setFormData({
                nom: currentCompany.nom ?? "",
                email_contact: currentCompany.email_contact ?? "",
                telephone: currentCompany.telephone ?? "",
                adresse: currentCompany.adresse ?? "",
                ville: currentCompany.ville ?? "",
                pays: currentCompany.pays ?? "Bénin",
                numero_ifu: currentCompany.numero_ifu ?? "",
                devise: currentCompany.devise ?? "FCFA",
                format_matricule: currentCompany.format_matricule ?? "entreprise",
                prefixe_matricule: currentCompany.prefixe_matricule ?? "EMP",
                plan_abonnement: (currentCompany.plan_abonnement as any) ?? "starter",
                heure_debut_journee: currentCompany.heure_debut_journee
                    ? currentCompany.heure_debut_journee.slice(0, 5)
                    : "08:00",
                heure_fin_journee: currentCompany.heure_fin_journee
                    ? currentCompany.heure_fin_journee.slice(0, 5)
                    : "17:30",
                tolerance_retard_minutes: currentCompany.tolerance_retard_minutes ?? 15,
                delai_prevenance_conge_jours: currentCompany.delai_prevenance_conge_jours ?? 2,
                logo: currentCompany.logo ?? "",
            });
        }
    }, [currentCompany]);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("L'image est trop volumineuse (maximum 2 Mo).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setFormData((p) => ({ ...p, logo: base64 }));
            toast.success("Logo sélectionné. Cliquez sur 'Enregistrer' pour sauvegarder.");
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveLogo = () => {
        setFormData((p) => ({ ...p, logo: "" }));
        toast.info("Logo retiré. Cliquez sur 'Enregistrer' pour valider la suppression.");
    };

    function handleSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!currentCompany) return;

        updateCompany.mutate({
            id: currentCompany.id,
            data: {
                ...formData,
                heure_debut_journee: formData.heure_debut_journee.length === 5 ? `${formData.heure_debut_journee}:00` : formData.heure_debut_journee,
                heure_fin_journee: formData.heure_fin_journee.length === 5 ? `${formData.heure_fin_journee}:00` : formData.heure_fin_journee,
            },
        });
    }

    const inputClass =
        "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
    const labelClass =
        "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

    // Exemple de matricule généré en direct
    const previewMatricule =
        formData.format_matricule === "entreprise"
            ? `${formData.prefixe_matricule.trim().toUpperCase() || "EMP"}-0042`
            : "TECH-0042";

    // Quotas d'abonnements
    const maxEmployees =
        formData.plan_abonnement === "pro"
            ? 9999
            : formData.plan_abonnement === "starter"
                ? 50
                : 10;
    const usagePercent =
        formData.plan_abonnement === "pro"
            ? 15
            : Math.min(Math.round((employeeCount / maxEmployees) * 100), 100);

    return (
        <div className="space-y-6">
            {/* Header avec action de sauvegarde globale */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        Paramètres de l'Entreprise
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Configurez l'identité légale, la numérotation des matricules, les horaires de travail et votre abonnement
                    </p>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={updateCompany.isPending}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-auto"
                    >
                        <Save size={16} />
                        {updateCompany.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                    </button>
                )}
            </div>

            {!isAdmin && (
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-600 shrink-0" />
                    <span>
                        Mode consultation : Seule la Direction Générale et les Administrateurs RH peuvent modifier les paramètres institutionnels.
                    </span>
                </div>
            )}

            {/* Barre d'Onglets Moderne */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-1">
                {[
                    { id: "identity", label: "Identité Légale", icon: Building2 },
                    { id: "matricule", label: "Matricules & Convention", icon: Hash },
                    { id: "schedule", label: "Horaires & Pointage", icon: Clock },
                    { id: "governance", label: "Workflow & Gouvernance", icon: ShieldCheck },
                    { id: "billing", label: "Formule & Abonnement", icon: CreditCard },
                ].map(({ id, label, icon: Icon }) => {
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${isActive
                                ? "bg-card text-foreground font-semibold shadow-sm border border-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <Icon size={16} className={isActive ? "text-primary" : "text-muted-foreground"} />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div className="py-16 text-center text-muted-foreground bg-card rounded-xl border border-border">
                    <Building2 className="mx-auto text-muted-foreground/50 mb-3 animate-pulse" size={36} />
                    <p className="text-sm">Chargement des paramètres de l'entreprise...</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ONGLET 1 : IDENTITÉ LÉGALE & COORDONNÉES */}
                    {activeTab === "identity" && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <Building2 className="text-primary" size={18} />
                                        Informations Institutionnelles
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Renseignements légaux figurant sur les attestations officielles et bulletins de paie.
                                    </p>
                                </div>

                                {/* Logo Officiel de l'Entreprise */}
                                <div className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-xl border border-border bg-card flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1.5">
                                            {formData.logo ? (
                                                <img
                                                    src={formData.logo}
                                                    alt="Logo entreprise"
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <ImageIcon className="text-muted-foreground/40" size={28} />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">
                                                Logo de l'Entreprise
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Affiché en haut du menu latéral (Sidebar) à la place du logo par défaut. (PNG, SVG, JPG, WebP)
                                            </p>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <div className="flex items-center gap-2">
                                            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm">
                                                <Upload size={14} />
                                                <span>{formData.logo ? "Changer le logo" : "Importer un logo"}</span>
                                                <input
                                                    type="file"
                                                    accept="image/png, image/jpeg, image/svg+xml, image/webp"
                                                    onChange={handleLogoUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            {formData.logo && (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveLogo}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                    <span>Supprimer</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Nom de la Société / Organisation *</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!isAdmin}
                                            value={formData.nom}
                                            onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                                            className={inputClass}
                                            placeholder="Ex: Entreprise Test SAS"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Email Officiel RH / Direction *</label>
                                        <input
                                            type="email"
                                            required
                                            disabled={!isAdmin}
                                            value={formData.email_contact}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, email_contact: e.target.value }))
                                            }
                                            className={inputClass}
                                            placeholder="rh@entreprise-test.com"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Numéro de Téléphone Standard</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-3 text-muted-foreground" size={15} />
                                            <input
                                                type="tel"
                                                disabled={!isAdmin}
                                                value={formData.telephone}
                                                onChange={(e) =>
                                                    setFormData((p) => ({ ...p, telephone: e.target.value }))
                                                }
                                                className={`${inputClass} pl-9`}
                                                placeholder="+229 01 23 45 67"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Identifiant Fiscal / Numéro IFU / SIRET</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-3 text-muted-foreground" size={15} />
                                            <input
                                                type="text"
                                                disabled={!isAdmin}
                                                value={formData.numero_ifu}
                                                onChange={(e) =>
                                                    setFormData((p) => ({ ...p, numero_ifu: e.target.value }))
                                                }
                                                className={`${inputClass} pl-9 font-mono`}
                                                placeholder="Ex: 3201910283719"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className={labelClass}>Adresse du Siège Social</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 text-muted-foreground" size={15} />
                                            <input
                                                type="text"
                                                disabled={!isAdmin}
                                                value={formData.adresse}
                                                onChange={(e) =>
                                                    setFormData((p) => ({ ...p, adresse: e.target.value }))
                                                }
                                                className={`${inputClass} pl-9`}
                                                placeholder="Boulevard de la Marina, Immeuble Horizon"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Ville</label>
                                        <input
                                            type="text"
                                            disabled={!isAdmin}
                                            value={formData.ville}
                                            onChange={(e) => setFormData((p) => ({ ...p, ville: e.target.value }))}
                                            className={inputClass}
                                            placeholder="Cotonou"
                                        />
                                    </div>

                                    <div>
                                        <label className={labelClass}>Pays</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 text-muted-foreground" size={15} />
                                            <input
                                                type="text"
                                                disabled={!isAdmin}
                                                value={formData.pays}
                                                onChange={(e) => setFormData((p) => ({ ...p, pays: e.target.value }))}
                                                className={`${inputClass} pl-9`}
                                                placeholder="Bénin"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Devise Monétaire Principale</label>
                                        <div className="relative">
                                            <Coins className="absolute left-3 top-3 text-muted-foreground" size={15} />
                                            <select
                                                disabled={!isAdmin}
                                                value={formData.devise}
                                                onChange={(e) =>
                                                    setFormData((p) => ({ ...p, devise: e.target.value }))
                                                }
                                                className={`${inputClass} pl-9 font-medium`}
                                            >
                                                <option value="FCFA">Franc CFA (FCFA / XOF)</option>
                                                <option value="EUR">Euro (€ / EUR)</option>
                                                <option value="USD">Dollar Américain ($ / USD)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 2 : MATRICULES & CONVENTIONS */}
                    {activeTab === "matricule" && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <Hash className="text-primary" size={18} />
                                        Convention de Numérotation des Matricules
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Règles de génération automatique attribuées aux nouveaux collaborateurs recrutés.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>Logique de Numérotation</label>
                                            <select
                                                disabled={!isAdmin}
                                                value={formData.format_matricule}
                                                onChange={(e) =>
                                                    setFormData((p) => ({
                                                        ...p,
                                                        format_matricule: e.target.value as any,
                                                    }))
                                                }
                                                className={inputClass}
                                            >
                                                <option value="entreprise">
                                                    Préfixe d'Entreprise + Numéro incrémental (EX: EMP-001)
                                                </option>
                                                <option value="departement">
                                                    Code Département + Numéro incrémental (EX: RH-001, IT-001)
                                                </option>
                                            </select>
                                        </div>

                                        {formData.format_matricule === "entreprise" && (
                                            <div>
                                                <label className={labelClass}>
                                                    Préfixe d'Entreprise (2 à 5 caractères)
                                                </label>
                                                <input
                                                    type="text"
                                                    disabled={!isAdmin}
                                                    value={formData.prefixe_matricule}
                                                    onChange={(e) =>
                                                        setFormData((p) => ({
                                                            ...p,
                                                            prefixe_matricule: e.target.value.toUpperCase(),
                                                        }))
                                                    }
                                                    className={`${inputClass} font-mono tracking-widest font-bold uppercase`}
                                                    maxLength={6}
                                                    placeholder="EX: NEX"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Aperçu en direct du matricule généré */}
                                    <div className="bg-muted/40 rounded-xl p-5 border border-border flex flex-col justify-between">
                                        <div>
                                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                                <Sparkles size={14} className="text-primary" />
                                                Simulation en Direct
                                            </span>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Exemple de matricule attribué au prochain collaborateur créé :
                                            </p>

                                            <div className="mt-4 p-4 rounded-xl bg-card border border-border flex items-center justify-between shadow-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Matricule Attribué</p>
                                                    <p className="text-xl font-mono font-extrabold text-primary tracking-wider mt-0.5">
                                                        {previewMatricule}
                                                    </p>
                                                </div>
                                                <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-semibold flex items-center gap-1">
                                                    <Check size={12} /> Valide
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-[11px] text-muted-foreground mt-4 italic">
                                            Le système garantit l'unicité stricte de chaque matricule au sein de votre entreprise.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 3 : HORAIRES & POINTAGE */}
                    {activeTab === "schedule" && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <Clock className="text-primary" size={18} />
                                        Régime Horaire & Politiques de Présence
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Paramètres appliqués au calcul des retards, heures supplémentaires et plannings d'assiduité.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Heure Standard d'Arrivée (Pointage)</label>
                                        <input
                                            type="time"
                                            disabled={!isAdmin}
                                            value={formData.heure_debut_journee}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, heure_debut_journee: e.target.value }))
                                            }
                                            className={inputClass}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Heure de début officielle de la journée de travail.
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Heure Standard de Départ</label>
                                        <input
                                            type="time"
                                            disabled={!isAdmin}
                                            value={formData.heure_fin_journee}
                                            onChange={(e) =>
                                                setFormData((p) => ({ ...p, heure_fin_journee: e.target.value }))
                                            }
                                            className={inputClass}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Heure de fin de service contractuelle.
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Tolérance de Retard (Minutes)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min={0}
                                                max={60}
                                                disabled={!isAdmin}
                                                value={formData.tolerance_retard_minutes}
                                                onChange={(e) =>
                                                    setFormData((p) => ({
                                                        ...p,
                                                        tolerance_retard_minutes: parseInt(e.target.value) || 0,
                                                    }))
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Délai de grâce avant de marquer le collaborateur en retard (ex: 15 min).
                                        </p>
                                    </div>

                                    <div>
                                        <label className={labelClass}>
                                            Délai de Préavis pour Demande de Congé (Jours)
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            max={30}
                                            disabled={!isAdmin}
                                            value={formData.delai_prevenance_conge_jours}
                                            onChange={(e) =>
                                                setFormData((p) => ({
                                                    ...p,
                                                    delai_prevenance_conge_jours: parseInt(e.target.value) || 0,
                                                }))
                                            }
                                            className={inputClass}
                                        />
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Nombre de jours ouvrés minimum requis avant la date de début du congé.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 4 : GOUVERNANCE & WORKFLOW */}
                    {activeTab === "governance" && (
                        <div className="space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
                                <div>
                                    <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <ShieldCheck className="text-primary" size={18} />
                                        Workflow Hiérarchique & Rôles Actifs
                                    </h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Architecture de sécurité et chaîne de validation appliquée à l'ensemble de votre structure.
                                    </p>
                                </div>

                                {/* Schéma du workflow */}
                                <div className="p-5 rounded-xl bg-muted/40 border border-border space-y-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Chaîne de Validation Hiérarchique Active
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                        <div className="p-3 rounded-lg bg-card border border-border text-center">
                                            <p className="font-bold text-foreground">1. Employé</p>
                                            <p className="text-muted-foreground mt-0.5">Dépôt de la demande</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card border border-border text-center">
                                            <p className="font-bold text-foreground">2. Manager</p>
                                            <p className="text-muted-foreground mt-0.5">Avis hiérarchique direct</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card border border-border text-center">
                                            <p className="font-bold text-foreground">3. Responsable RH</p>
                                            <p className="text-muted-foreground mt-0.5">Vérification de conformité</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-card border border-border text-center">
                                            <p className="font-bold text-primary">4. Direction Générale</p>
                                            <p className="text-muted-foreground mt-0.5">Visa final & signature PDF</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                                            <Lock size={14} className="text-primary" /> Sécurité des Données & Tokens
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Authentification JWT sécurisée, isolation multi-tenant par entreprise et horodatage certifié de chaque visa numérique.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                                        <p className="font-semibold text-foreground flex items-center gap-1.5">
                                            <FileText size={14} className="text-green-600" /> Attestations avec QR Code
                                        </p>
                                        <p className="text-muted-foreground leading-relaxed">
                                            Chaque autorisation de congé signée par le PDG comporte un QR code infalsifiable pour vérification instantanée en ligne.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 5 : FORMULE & ABONNEMENT */}
                    {activeTab === "billing" && (
                        <div className="space-y-6">
                            {/* Jauge d'utilisation */}
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                                            <CreditCard className="text-primary" size={18} />
                                            Consommation des Quotas de la Formule
                                        </h2>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Suivi en temps réel de votre effectif par rapport à la capacité souscrite.
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 self-start sm:self-auto">
                                        Formule {formData.plan_abonnement.toUpperCase()}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Collaborateurs enregistrés :</span>
                                        <span className="font-bold text-foreground">
                                            {employeeCount} / {formData.plan_abonnement === "pro" ? "Illimité" : maxEmployees}
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-primary h-2.5 rounded-full transition-all duration-500"
                                            style={{ width: `${usagePercent}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Choix des formules */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    {
                                        id: "gratuit",
                                        label: "Gratuit / Essai",
                                        tag: "Découverte",
                                        price: "0 FCFA",
                                        period: "/ mois",
                                        limit: "Jusqu'à 10 employés",
                                        features: [
                                            "Gestion des employés",
                                            "Pointage & Présences basique",
                                            "Workflow congés standard",
                                        ],
                                    },
                                    {
                                        id: "starter",
                                        label: "Starter",
                                        tag: "Recommandé PME",
                                        price: "25 000 FCFA",
                                        period: "/ mois",
                                        limit: "Jusqu'à 50 employés",
                                        features: [
                                            "Tous les modules inclus",
                                            "Workflow d'arbitrage PDG",
                                            "Attestations PDF avec QR Code",
                                            "Organigramme dynamique",
                                        ],
                                    },
                                    {
                                        id: "pro",
                                        label: "Pro / Enterprise",
                                        tag: "Illimité",
                                        price: "75 000 FCFA",
                                        period: "/ mois",
                                        limit: "Employés illimités",
                                        features: [
                                            "Masse salariale & Paie avancée",
                                            "Multi-filiales & Pôles",
                                            "Support prioritaire 24/7",
                                            "Sauvegardes automatisées",
                                        ],
                                    },
                                ].map((plan) => {
                                    const isSelected = formData.plan_abonnement === plan.id;
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() =>
                                                isAdmin &&
                                                setFormData((p) => ({ ...p, plan_abonnement: plan.id as any }))
                                            }
                                            className={`border rounded-xl p-5 flex flex-col justify-between transition-all ${isSelected
                                                ? "border-primary bg-card ring-2 ring-primary/20 shadow-sm"
                                                : "border-border bg-card/60 hover:bg-card"
                                                } ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                        {plan.tag}
                                                    </span>
                                                    {isSelected && (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-primary">
                                                            <CheckCircle2 size={15} /> Actif
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-base font-bold text-foreground mb-1">
                                                    {plan.label}
                                                </h3>
                                                <div className="flex items-baseline gap-1 mb-2">
                                                    <span className="text-xl font-extrabold text-foreground font-mono">
                                                        {plan.price}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {plan.period}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-medium text-primary mb-4">
                                                    {plan.limit}
                                                </p>

                                                <div className="space-y-2 border-t border-border/60 pt-3">
                                                    {plan.features.map((feat, idx) => (
                                                        <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                                            <Check size={13} className="text-green-600 mt-0.5 shrink-0" />
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    className={`w-full mt-5 py-2 rounded-lg text-xs font-semibold transition-colors ${isSelected
                                                        ? "bg-primary text-white"
                                                        : "bg-muted hover:bg-muted/80 text-foreground"
                                                        }`}
                                                >
                                                    {isSelected ? "Formule Sélectionnée" : "Sélectionner cette formule"}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bouton d'enregistrement bas de page */}
                    {isAdmin && (
                        <div className="pt-4 border-t border-border flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={updateCompany.isPending}
                                className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm disabled:opacity-50"
                            >
                                <Save size={16} />
                                {updateCompany.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
                            </button>
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}
