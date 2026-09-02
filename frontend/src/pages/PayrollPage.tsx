import { useState } from "react";
import {
  Banknote,
  DollarSign,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Eye,
  SlidersHorizontal,
  TrendingUp,
  FileText,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import {
  usePayslips,
  useGeneratePayslip,
  useUpdatePayslip,
  useDeletePayslip,
  useSalaryComponents,
  useCreateSalaryComponent,
  useDeleteSalaryComponent,
} from "@/hooks/usePayroll";
import type { Payslip } from "@/types";
import type { SalaryComponent } from "@/api/payroll";

const STATUT_CONFIG: Record<string, { label: string; bg: string }> = {
  brouillon: { label: "Brouillon", bg: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  valide: { label: "Validé", bg: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" },
  paye: { label: "Payé", bg: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300" },
};

const MOIS_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function PayrollPage() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employe";
  const myEmployeeId = user?.employee_profile?.id;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedMois, setSelectedMois] = useState<number | "tous">("tous");
  const [selectedAnnee, setSelectedAnnee] = useState<number>(currentYear);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isComponentsModalOpen, setIsComponentsModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  const { data: employeesData } = useEmployees();
  const { data: payslipsData, isLoading } = usePayslips(
    isEmployee && myEmployeeId ? { employee: myEmployeeId } : {}
  );
  const { data: componentsData } = useSalaryComponents();

  const generatePayslip = useGeneratePayslip();
  const updatePayslip = useUpdatePayslip();
  const deletePayslip = useDeletePayslip();
  const createSalaryComponent = useCreateSalaryComponent();
  const deleteSalaryComponent = useDeleteSalaryComponent();

  const employees = employeesData?.results ?? [];
  const payslips = Array.isArray(payslipsData) ? payslipsData : (payslipsData as any)?.results ?? [];
  const components = Array.isArray(componentsData) ? componentsData : (componentsData as any)?.results ?? [];

  // Form states
  const [generateForm, setGenerateForm] = useState({
    employee: "",
    mois: currentMonth,
    annee: currentYear,
  });

  const [componentForm, setComponentForm] = useState({
    nom: "",
    type_composant: "gain" as "gain" | "retenue",
    imposable: true,
    soumis_cnss: true,
  });

  const filteredPayslips = payslips.filter((ps: Payslip) => {
    if (selectedMois !== "tous" && ps.mois !== selectedMois) return false;
    if (selectedAnnee && ps.annee !== selectedAnnee) return false;
    if (searchQuery.trim()) {
      const emp = employees.find((e) => e.id === ps.employee);
      const name = emp?.nom_complet?.toLowerCase() ?? "";
      return name.includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Financial Stats
  const totalBrut = filteredPayslips.reduce((sum: number, p: Payslip) => sum + parseFloat(p.salaire_brut || "0"), 0);
  const totalNet = filteredPayslips.reduce((sum: number, p: Payslip) => sum + parseFloat(p.salaire_net || "0"), 0);
  const totalCotisations = filteredPayslips.reduce((sum: number, p: Payslip) => {
    const cnss = parseFloat((p as any).cotisation_cnss_salariale || "0") + parseFloat((p as any).cotisation_cnss_patronale || "0");
    const inam = parseFloat((p as any).cotisation_inam_salariale || "0") + parseFloat((p as any).cotisation_inam_patronale || "0");
    return sum + cnss + inam;
  }, 0);

  function handleGenerateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!generateForm.employee) return;
    generatePayslip.mutate(generateForm, {
      onSuccess: () => {
        setIsGenerateModalOpen(false);
      },
    });
  }

  function handleCreateComponentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!componentForm.nom.trim()) return;
    createSalaryComponent.mutate(componentForm, {
      onSuccess: () => {
        setComponentForm({ nom: "", type_composant: "gain", imposable: true, soumis_cnss: true });
      },
    });
  }

  function handleStatusChange(id: string, newStatut: "brouillon" | "valide" | "paye") {
    updatePayslip.mutate({ id, data: { statut: newStatut } });
  }

  const inputClass =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const labelClass = "block text-sm font-medium text-foreground mb-1.5";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Banknote className="text-primary h-7 w-7" />
            Gestion de la Paie & Bulletins
          </h1>
          <p className="text-sm text-muted-foreground">
            Génération automatique des bulletins de paie, calcul des cotisations et suivi des règlements.
          </p>
        </div>

        {!isEmployee && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsComponentsModalOpen(true)}
              className="flex items-center gap-2 border border-border bg-card hover:bg-accent px-3.5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <SlidersHorizontal size={16} />
              Éléments de paie
            </button>
            <button
              onClick={() => setIsGenerateModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-4 py-2 rounded-xl text-sm font-medium transition-opacity"
            >
              <Plus size={16} />
              Générer un bulletin
            </button>
          </div>
        )}
      </div>

      {/* Cartes financières de synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Masse Salariale Brute</span>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-2">
            {totalBrut.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-green-500" /> Total des salaires bruts du filtre
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Net à Payer</span>
            <Banknote className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
            {totalNet.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Montant net versé aux employés</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Cotisations Sociales</span>
            <FileSpreadsheet className="h-5 w-5 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
            {totalCotisations.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Total CNSS + INAM (Salariale et Patronale)</p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par employé..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <select
            value={selectedMois}
            onChange={(e) => setSelectedMois(e.target.value === "tous" ? "tous" : Number(e.target.value))}
            className="border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="tous">Tous les mois</option>
            {MOIS_LABELS.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={selectedAnnee}
            onChange={(e) => setSelectedAnnee(Number(e.target.value))}
            className="w-24 border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Tableau des Bulletins de Paie */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Période</th>
                <th className="px-4 py-3">Salaire Brut</th>
                <th className="px-4 py-3">IRPP</th>
                <th className="px-4 py-3">Salaire Net</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Chargement des bulletins de paie...
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground italic">
                    Aucun bulletin de paie ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((ps: Payslip) => {
                  const emp = employees.find((e) => e.id === ps.employee);
                  const conf = STATUT_CONFIG[ps.statut] ?? STATUT_CONFIG.brouillon;

                  return (
                    <tr key={ps.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">
                        {emp?.nom_complet ?? "Employé inconnu"}
                        {emp?.matricule && <span className="ml-1.5 text-muted-foreground text-[10px]">({emp.matricule})</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-medium">
                        {MOIS_LABELS[ps.mois - 1]} {ps.annee}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-foreground">
                        {parseFloat(ps.salaire_brut).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {parseFloat((ps as any).irpp || "0").toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {parseFloat(ps.salaire_net).toLocaleString("fr-FR")} FCFA
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${conf.bg}`}>
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedPayslip(ps)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Voir la fiche détaillée"
                          >
                            <Eye size={14} />
                          </button>

                          {!isEmployee && (
                            <>
                              {ps.statut === "brouillon" && (
                                <button
                                  onClick={() => handleStatusChange(ps.id, "valide")}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium"
                                >
                                  Valider
                                </button>
                              )}
                              {ps.statut === "valide" && (
                                <button
                                  onClick={() => handleStatusChange(ps.id, "paye")}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-medium"
                                >
                                  Marquer Payé
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm("Voulez-vous vraiment supprimer ce bulletin ?")) {
                                    deletePayslip.mutate(ps.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 dark:hover:bg-red-950/50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Génération de Bulletin */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="text-primary h-5 w-5" />
              Générer un bulletin de paie
            </h2>

            <form onSubmit={handleGenerateSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>Employé *</label>
                <select
                  required
                  value={generateForm.employee}
                  onChange={(e) => setGenerateForm((p) => ({ ...p, employee: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Sélectionner un employé...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nom_complet} — {emp.poste}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Mois *</label>
                  <select
                    value={generateForm.mois}
                    onChange={(e) => setGenerateForm((p) => ({ ...p, mois: Number(e.target.value) }))}
                    className={inputClass}
                  >
                    {MOIS_LABELS.map((m, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Année *</label>
                  <input
                    type="number"
                    required
                    value={generateForm.annee}
                    onChange={(e) => setGenerateForm((p) => ({ ...p, annee: Number(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={generatePayslip.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
                >
                  Générer le bulletin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail du Bulletin */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Bulletin de paie — {MOIS_LABELS[selectedPayslip.mois - 1]} {selectedPayslip.annee}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {employees.find((e) => e.id === selectedPayslip.employee)?.nom_complet ?? "Employé"}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUT_CONFIG[selectedPayslip.statut]?.bg}`}>
                {STATUT_CONFIG[selectedPayslip.statut]?.label}
              </span>
            </div>

            <div className="bg-muted/40 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between font-semibold border-b border-border pb-1 text-foreground">
                <span>Description</span>
                <span>Montant</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Salaire de Base Brut</span>
                <span className="font-mono text-foreground font-medium">{parseFloat(selectedPayslip.salaire_brut).toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>CNSS Salariale (4%)</span>
                <span className="font-mono">-{parseFloat((selectedPayslip as any).cotisation_cnss_salariale || "0").toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>INAM Salariale (5%)</span>
                <span className="font-mono">-{parseFloat((selectedPayslip as any).cotisation_inam_salariale || "0").toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>IRPP (Impôt sur le revenu)</span>
                <span className="font-mono">-{parseFloat((selectedPayslip as any).irpp || "0").toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-emerald-600 dark:text-emerald-400 border-t border-border pt-2">
                <span>NET À PAYER</span>
                <span className="font-mono">{parseFloat(selectedPayslip.salaire_net).toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Éléments de Salaire (Primes/Retenues) */}
      {isComponentsModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="text-primary h-5 w-5" />
              Primes & Cotisations configurées
            </h2>

            <form onSubmit={handleCreateComponentSubmit} className="bg-muted/40 border border-border rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Créer une prime / retenue</h3>
              <div>
                <label className={labelClass}>Nom de la prime ou retenue *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prime de transport, Prime de risque"
                  value={componentForm.nom}
                  onChange={(e) => setComponentForm((p) => ({ ...p, nom: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Type *</label>
                <select
                  value={componentForm.type_composant}
                  onChange={(e) => setComponentForm((p) => ({ ...p, type_composant: e.target.value as any }))}
                  className={inputClass}
                >
                  <option value="gain">Gain / Prime (Ajouté au brut)</option>
                  <option value="retenue">Retenue (Déduite du net)</option>
                </select>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={createSalaryComponent.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90"
                >
                  Ajouter l'élément
                </button>
              </div>
            </form>

            <div className="max-h-48 overflow-y-auto space-y-2">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">Composants configurés</h3>
              {components.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">Aucun composant configuré.</p>
              ) : (
                components.map((c: SalaryComponent) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-background text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{c.nom}</p>
                      <p className="text-muted-foreground capitalize">{c.type_composant === "gain" ? "Prime / Gain" : "Retenue"}</p>
                    </div>
                    <button
                      onClick={() => deleteSalaryComponent.mutate(c.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-950/50"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsComponentsModalOpen(false)}
                className="px-4 py-2 border border-border rounded-xl text-xs hover:bg-muted font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
