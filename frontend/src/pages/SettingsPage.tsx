import { useState, useEffect } from "react";
import { Settings, Building, CreditCard, Save, ShieldCheck, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompanies, useUpdateCompany } from "@/hooks/useCompany";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "superadmin" || user?.role === "responsable_rh" || user?.role === "admin_rh";

  const { data: companiesData, isLoading } = useCompanies();
  const updateCompany = useUpdateCompany();

  const companyList = Array.isArray(companiesData) ? companiesData : (companiesData as any)?.results ?? [];
  const currentCompany = companyList[0];

  const [formData, setFormData] = useState({
    nom: "",
    email_contact: "",
    format_matricule: "entreprise" as "departement" | "entreprise",
    prefixe_matricule: "EMP",
    plan_abonnement: "starter" as "gratuit" | "starter" | "pro",
  });

  useEffect(() => {
    if (currentCompany) {
      setFormData({
        nom: currentCompany.nom ?? "",
        email_contact: currentCompany.email_contact ?? "",
        format_matricule: currentCompany.format_matricule ?? "entreprise",
        prefixe_matricule: currentCompany.prefixe_matricule ?? "EMP",
        plan_abonnement: currentCompany.plan_abonnement ?? "starter",
      });
    }
  }, [currentCompany]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentCompany) return;

    updateCompany.mutate({
      id: currentCompany.id,
      data: formData,
    });
  }

  const inputClass =
    "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary";
  const labelClass = "block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="text-primary h-7 w-7" />
          Paramètres de l'Entreprise
        </h1>
        <p className="text-sm text-muted-foreground">
          Gérez les informations générales de la société, le format des matricules et l'abonnement.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Chargement des paramètres...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Informations Générales */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Building className="text-primary h-5 w-5" />
              Informations Générales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom de la Société *</label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={formData.nom}
                  onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Email de Contact RH *</label>
                <input
                  type="email"
                  required
                  disabled={!isAdmin}
                  value={formData.email_contact}
                  onChange={(e) => setFormData((p) => ({ ...p, email_contact: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Format des Matricules */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="text-primary h-5 w-5" />
              Format des Matricules d'Employés
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Format de Génération</label>
                <select
                  disabled={!isAdmin}
                  value={formData.format_matricule}
                  onChange={(e) => setFormData((p) => ({ ...p, format_matricule: e.target.value as any }))}
                  className={inputClass}
                >
                  <option value="entreprise">Préfixe Entreprise + Numéro (EX: NEX-001)</option>
                  <option value="departement">Préfixe Département + Numéro (EX: IT-001)</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>Préfixe d'Entreprise</label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.prefixe_matricule}
                  onChange={(e) => setFormData((p) => ({ ...p, prefixe_matricule: e.target.value }))}
                  className={inputClass}
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Abonnement & Formule */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2 border-b border-border pb-3">
              <CreditCard className="text-primary h-5 w-5" />
              Formule d'Abonnement NexHR
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: "gratuit", label: "Gratuit / Essai", desc: "Jusqu'à 10 employés" },
                { id: "starter", label: "Starter", desc: "Jusqu'à 50 employés" },
                { id: "pro", label: "Pro / Enterprise", desc: "Employés illimités + Paie avancée" },
              ].map((plan) => {
                const isSelected = formData.plan_abonnement === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => isAdmin && setFormData((p) => ({ ...p, plan_abonnement: plan.id as any }))}
                    className={`border rounded-2xl p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border bg-background hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground text-sm">{plan.label}</span>
                      {isSelected && <Check size={16} className="text-primary font-bold" />}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bouton d'enregistrement */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateCompany.isPending}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:opacity-90 px-6 py-2.5 rounded-xl font-medium text-sm transition-opacity shadow-sm"
              >
                <Save size={16} />
                Enregistrer les paramètres
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
