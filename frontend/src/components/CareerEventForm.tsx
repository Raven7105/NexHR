import { useState, useEffect } from "react";
import { X, Calendar, DollarSign, Briefcase, Building2, FileText, ArrowRight } from "lucide-react";
import { useCreateEmployeeHistory } from "@/hooks/useEmployeeHistory";
import { useDepartments } from "@/hooks/useDepartments";
import type { Employee, CareerEventType, CreateEmployeeHistoryInput } from "@/types";

interface CareerEventFormProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee;
}

const EVENT_TYPE_OPTIONS: { value: CareerEventType; label: string; desc: string }[] = [
    { value: "embauche", label: "Embauche", desc: "Recrutement ou entrée officielle" },
    { value: "stage", label: "Début de stage", desc: "Arrivée d'un stagiaire" },
    { value: "changement_contrat", label: "Changement de contrat", desc: "Évolution du type de contrat (CDD → CDI, etc.)" },
    { value: "promotion", label: "Promotion", desc: "Montée en grade ou prise de responsabilités" },
    { value: "poste", label: "Changement de poste", desc: "Évolution ou redéfinition de fonction" },
    { value: "salaire", label: "Ajustement salarial", desc: "Augmentation ou révision de salaire" },
    { value: "transfert", label: "Transfert de département", desc: "Mutation ou changement de service" },
    { value: "depart", label: "Départ / Fin de contrat", desc: "Démission, fin de mission ou départ" },
    { value: "autre", label: "Autre événement", desc: "Autre jalon professionnel remarquable" },
];

export default function CareerEventForm({ isOpen, onClose, employee }: CareerEventFormProps) {
    const createHistory = useCreateEmployeeHistory();
    const { data: departmentsData } = useDepartments();
    const departments = departmentsData?.results ?? [];

    const today = new Date().toISOString().split("T")[0];

    const [field, setField] = useState<CareerEventType>("promotion");
    const [changeDate, setChangeDate] = useState(today);
    const [reason, setReason] = useState("");
    const [oldValue, setOldValue] = useState("");
    const [newValue, setNewValue] = useState("");
    const [contractType, setContractType] = useState<string>("cdi");
    const [departmentId, setDepartmentId] = useState<string>("");

    // Initialiser les valeurs par défaut selon le type d'événement
    useEffect(() => {
        if (!isOpen) return;

        setChangeDate(today);
        setReason("");

        if (field === "salaire") {
            setOldValue(employee.salaire_de_base ? String(employee.salaire_de_base) : "0");
            setNewValue("");
        } else if (field === "poste" || field === "promotion") {
            setOldValue(employee.poste || "");
            setNewValue("");
        } else if (field === "transfert") {
            setOldValue(employee.department_nom || "Aucun");
            setDepartmentId("");
            setNewValue("");
        } else if (field === "changement_contrat" || field === "embauche" || field === "stage") {
            setContractType(field === "stage" ? "stage" : employee.type_contrat || "cdi");
            setOldValue(employee.type_contrat || "");
            setNewValue("");
        } else if (field === "depart") {
            setOldValue(employee.statut || "actif");
            setNewValue("inactif");
        } else {
            setOldValue("");
            setNewValue("");
        }
    }, [field, isOpen, employee]);

    if (!isOpen) return null;

    const isContractEvent = field === "embauche" || field === "stage" || field === "changement_contrat";
    const isDepartmentTransfer = field === "transfert";
    const isSalary = field === "salaire";
    const isRoleOrPromotion = field === "poste" || field === "promotion";

    // Calcul de l'écart salarial pour l'aperçu en direct
    const numOldSal = parseFloat(oldValue) || 0;
    const numNewSal = parseFloat(newValue) || 0;
    const salaryDiff = numNewSal - numOldSal;
    const salaryDiffPct = numOldSal > 0 ? ((salaryDiff / numOldSal) * 100).toFixed(1) : null;

    function handleDepartmentChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const id = e.target.value;
        setDepartmentId(id);
        const found = departments.find((d) => d.id === id);
        setNewValue(found ? found.nom : "");
    }

    function handleContractChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const val = e.target.value;
        setContractType(val);
        setNewValue(val.toUpperCase());
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        let finalOldValue = oldValue;
        let finalNewValue = newValue;

        if (isContractEvent) {
            finalOldValue = oldValue || employee.type_contrat;
            finalNewValue = contractType;
        } else if (isDepartmentTransfer) {
            const selectedDept = departments.find((d) => d.id === departmentId);
            finalNewValue = selectedDept ? selectedDept.nom : newValue;
        }

        const payload: CreateEmployeeHistoryInput = {
            employee: employee.id,
            field,
            old_value: finalOldValue,
            new_value: finalNewValue,
            contract_type: isContractEvent ? contractType : undefined,
            department: isDepartmentTransfer ? (departmentId || null) : undefined,
            change_date: changeDate,
            reason: reason.trim() || undefined,
        };

        createHistory.mutate(payload, {
            onSuccess: () => {
                onClose();
            },
        });
    }

    const inputClass =
        "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-colors";
    const labelClass = "block text-sm font-medium text-foreground mb-1.5";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
                {/* En-tête */}
                <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">
                            Ajouter un événement de carrière
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Employé : <span className="font-semibold text-foreground">{employee.nom_complet}</span> ({employee.matricule})
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Formulaire */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type d'événement */}
                    <div>
                        <label className={labelClass}>Type d'événement</label>
                        <select
                            value={field}
                            onChange={(e) => setField(e.target.value as CareerEventType)}
                            className={inputClass}
                            required
                        >
                            {EVENT_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label} — {opt.desc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Cas 1: Embauche / Stage / Changement de contrat -> Sélecteur de type de contrat */}
                    {isContractEvent && (
                        <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                <FileText size={14} />
                                Détails du contrat
                            </div>
                            <div>
                                <label className={labelClass}>Nouveau type de contrat</label>
                                <select
                                    value={contractType}
                                    onChange={handleContractChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="cdi">CDI (Contrat à Durée Indéterminée)</option>
                                    <option value="cdd">CDD (Contrat à Durée Déterminée)</option>
                                    <option value="stage">Stage</option>
                                    <option value="freelance">Freelance / Prestataire</option>
                                </select>
                            </div>
                            {oldValue && field === "changement_contrat" && (
                                <p className="text-xs text-muted-foreground">
                                    Ancien contrat : <span className="font-medium text-foreground uppercase">{oldValue}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Cas 2: Transfert de département -> Sélecteur de département */}
                    {isDepartmentTransfer && (
                        <div className="p-4 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 dark:text-sky-300">
                                <Building2 size={14} />
                                Transfert de département
                            </div>
                            <div>
                                <label className={labelClass}>Département d'origine</label>
                                <input
                                    type="text"
                                    value={oldValue}
                                    onChange={(e) => setOldValue(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ex: Informatique"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Nouveau département</label>
                                <select
                                    value={departmentId}
                                    onChange={handleDepartmentChange}
                                    className={inputClass}
                                    required
                                >
                                    <option value="">Sélectionner un département...</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.nom} {dept.code ? `(${dept.code})` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Cas 3: Salaire -> Ancienne valeur -> Nouvelle valeur (numérique) avec indicateur de tendance */}
                    {isSalary && (
                        <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 dark:text-purple-300">
                                <DollarSign size={14} />
                                Révision salariale (FCFA)
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Ancien salaire brut</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={oldValue}
                                        onChange={(e) => setOldValue(e.target.value)}
                                        className={inputClass}
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nouveau salaire brut</label>
                                    <input
                                        type="number"
                                        step="1"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className={inputClass}
                                        placeholder="Ex: 650000"
                                        required
                                    />
                                </div>
                            </div>

                            {numNewSal > 0 && (
                                <div className="mt-2 text-xs flex items-center gap-2 p-2 rounded-lg bg-background/80 border border-border">
                                    <span className="text-muted-foreground">Écart calculé :</span>
                                    {salaryDiff > 0 ? (
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            ↑ +{salaryDiff.toLocaleString()} FCFA {salaryDiffPct && `(+${salaryDiffPct}%)`}
                                        </span>
                                    ) : salaryDiff < 0 ? (
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            ↓ {salaryDiff.toLocaleString()} FCFA {salaryDiffPct && `(${salaryDiffPct}%)`}
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-muted-foreground">— Inchangé</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Cas 4: Poste / Promotion -> Ancienne valeur -> Nouvelle valeur (texte) */}
                    {isRoleOrPromotion && (
                        <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                <Briefcase size={14} />
                                {field === "promotion" ? "Évolution de grade / Promotion" : "Changement de fonction"}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={labelClass}>Ancien intitulé</label>
                                    <input
                                        type="text"
                                        value={oldValue}
                                        onChange={(e) => setOldValue(e.target.value)}
                                        className={inputClass}
                                        placeholder="Ex: Développeur Junior"
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nouveau poste / grade</label>
                                    <input
                                        type="text"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        className={inputClass}
                                        placeholder="Ex: Lead Developer"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cas 5: Autre / Départ */}
                    {(field === "autre" || field === "depart") && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelClass}>Valeur précédente (optionnel)</label>
                                <input
                                    type="text"
                                    value={oldValue}
                                    onChange={(e) => setOldValue(e.target.value)}
                                    className={inputClass}
                                    placeholder="Ex: Actif"
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Nouvelle valeur</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    className={inputClass}
                                    placeholder={field === "depart" ? "Départ / Fin de contrat" : "Préciser la valeur"}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Date de l'événement */}
                    <div>
                        <label className={labelClass}>
                            <span className="flex items-center gap-1.5">
                                <Calendar size={14} className="text-muted-foreground" />
                                Date de l'événement
                            </span>
                        </label>
                        <input
                            type="date"
                            value={changeDate}
                            onChange={(e) => setChangeDate(e.target.value)}
                            className={inputClass}
                            required
                        />
                    </div>

                    {/* Motif / Note libre */}
                    <div>
                        <label className={labelClass}>
                            Motif ou commentaire <span className="text-muted-foreground text-xs font-normal">(optionnel)</span>
                        </label>
                        <textarea
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className={inputClass}
                            placeholder="Ex: Promotion suite à l'évaluation annuelle, augmentation générale, décision de direction..."
                        />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={createHistory.isPending}
                            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {createHistory.isPending ? "Enregistrement..." : "Enregistrer l'événement"}
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
