import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useCreateEmployeeWithUser } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import type { CreateEmployeeWithUserInput } from "@/types";

export default function EmployeeFormPage() {
    const navigate = useNavigate();
    const createEmployee = useCreateEmployeeWithUser();
    const { data: departmentsData } = useDepartments();
    const { data: employeesData } = useEmployees();

    const [formData, setFormData] = useState<CreateEmployeeWithUserInput>({
        email: "",
        password: "",
        role: "employe",
        first_name: "",
        last_name: "",
        poste: "",
        department: null,
        manager: null,
        type_contrat: "cdi",
        date_embauche: new Date().toISOString().split("T")[0],
        date_naissance: null,
        date_fin_contrat: null,
        salaire_de_base: "0",
        nombre_personnes_charge: 0,
    });

    function handleChange(
        field: keyof CreateEmployeeWithUserInput,
        value: string | number | null
    ) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        createEmployee.mutate(formData, {
            onSuccess: (employee) => {
                navigate(`/employees/${employee.id}`);
            },
        });
    }

    const inputClass =
        "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-foreground mb-1.5";

    return (
        <div className="max-w-2xl">
            <Link
                to="/employees"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Retour à la liste
            </Link>

            <h1 className="text-2xl font-bold text-foreground mb-6">Ajouter un employé</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <h2 className="font-semibold text-foreground">Compte de connexion</h2>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Prénom</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => handleChange("first_name", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Nom</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => handleChange("last_name", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Mot de passe *</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Rôle *</label>
                            <select
                                value={formData.role}
                                onChange={(e) => handleChange("role", e.target.value)}
                                className={inputClass}
                            >
                                <option value="employe">Employé</option>
                                <option value="manager">Manager</option>
                                <option value="admin_rh">Admin RH</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <h2 className="font-semibold text-foreground">Informations professionnelles</h2>

                    <div>
                        <label className={labelClass}>Poste *</label>
                        <input
                            type="text"
                            required
                            value={formData.poste}
                            onChange={(e) => handleChange("poste", e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Département</label>
                            <select
                                value={formData.department ?? ""}
                                onChange={(e) => handleChange("department", e.target.value || null)}
                                className={inputClass}
                            >
                                <option value="">Aucun</option>
                                {departmentsData?.results.map((dept) => (
                                    <option key={dept.id} value={dept.id}>
                                        {dept.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Manager</label>
                            <select
                                value={formData.manager ?? ""}
                                onChange={(e) => handleChange("manager", e.target.value || null)}
                                className={inputClass}
                            >
                                <option value="">Aucun</option>
                                {employeesData?.results.map((emp) => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.nom_complet}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Type de contrat *</label>
                            <select
                                value={formData.type_contrat}
                                onChange={(e) => handleChange("type_contrat", e.target.value)}
                                className={inputClass}
                            >
                                <option value="cdi">CDI</option>
                                <option value="cdd">CDD</option>
                                <option value="stage">Stage</option>
                                <option value="freelance">Freelance</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Salaire de base (FCFA)</label>
                            <input
                                type="number"
                                min="0"
                                value={formData.salaire_de_base}
                                onChange={(e) => handleChange("salaire_de_base", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Date d'embauche *</label>
                            <input
                                type="date"
                                required
                                value={formData.date_embauche}
                                onChange={(e) => handleChange("date_embauche", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Date de naissance</label>
                            <input
                                type="date"
                                value={formData.date_naissance ?? ""}
                                onChange={(e) => handleChange("date_naissance", e.target.value || null)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Personnes à charge</label>
                        <input
                            type="number"
                            min="0"
                            value={formData.nombre_personnes_charge}
                            onChange={(e) => handleChange("nombre_personnes_charge", Number(e.target.value))}
                            className={inputClass}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Link
                        to="/employees"
                        className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                    >
                        Annuler
                    </Link>
                    <button
                        type="submit"
                        disabled={createEmployee.isPending}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {createEmployee.isPending ? "Création..." : "Créer l'employé"}
                    </button>
                </div>
            </form>
        </div>
    );
}