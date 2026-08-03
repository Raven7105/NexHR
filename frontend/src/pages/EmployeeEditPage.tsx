import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useEmployee, useUpdateEmployee } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import type { UpdateEmployeeInput } from "@/types";

export default function EmployeeEditPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: employee, isLoading } = useEmployee(id ?? "");
    const updateEmployee = useUpdateEmployee();
    const { data: departmentsData } = useDepartments();

    const [formData, setFormData] = useState<UpdateEmployeeInput & { matricule?: string }>({});

    useEffect(() => {
        if (employee) {
            setFormData({
                poste: employee.poste,
                department: employee.department,
                manager: employee.manager,
                type_contrat: employee.type_contrat,
                salaire_de_base: employee.salaire_de_base,
                nombre_personnes_charge: employee.nombre_personnes_charge,
                date_embauche: employee.date_embauche,
                date_naissance: employee.date_naissance,
                phone_number: employee.phone_number,
                date_fin_contrat: employee.date_fin_contrat,
                statut: employee.statut,
                matricule: employee.matricule,
            });
        }
    }, [employee]);

    function handleChange(field: keyof UpdateEmployeeInput | "matricule", value: string | number | null) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!id) return;
        updateEmployee.mutate(
            { id, data: formData },
            { onSuccess: () => navigate(`/employees/${id}`) }
        );
    }

    if (isLoading || !employee) {
        return <div className="text-muted-foreground">Chargement...</div>;
    }

    const inputClass = "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-foreground mb-1.5";

    return (
        <div className="max-w-2xl">
            <Link to={`/employees/${id}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft size={16} /> Retour au profil
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-6">Modifier l’employé</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                    <div>
                        <label className={labelClass}>Poste</label>
                        <input value={formData.poste ?? ""} onChange={(e) => handleChange("poste", e.target.value)} className={inputClass} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Département</label>
                            <select value={formData.department ?? ""} onChange={(e) => handleChange("department", e.target.value || null)} className={inputClass}>
                                <option value="">Aucun</option>
                                {departmentsData?.results.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Manager</label>
                            <input value={formData.manager ?? ""} onChange={(e) => handleChange("manager", e.target.value || null)} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Type de contrat</label>
                            <select value={formData.type_contrat ?? "cdi"} onChange={(e) => handleChange("type_contrat", e.target.value)} className={inputClass}>
                                <option value="cdi">CDI</option>
                                <option value="cdd">CDD</option>
                                <option value="stage">Stage</option>
                                <option value="freelance">Freelance</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Salaire de base</label>
                            <input type="number" value={formData.salaire_de_base ?? ""} onChange={(e) => handleChange("salaire_de_base", e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Date d’embauche</label>
                            <input type="date" value={formData.date_embauche ?? ""} onChange={(e) => handleChange("date_embauche", e.target.value)} className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>Date de naissance</label>
                            <input type="date" value={formData.date_naissance ?? ""} onChange={(e) => handleChange("date_naissance", e.target.value || null)} className={inputClass} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Statut</label>
                            <select value={formData.statut ?? "actif"} onChange={(e) => handleChange("statut", e.target.value)} className={inputClass}>
                                <option value="actif">Actif</option>
                                <option value="inactif">Inactif</option>
                                <option value="en_conge">En congé</option>
                                <option value="suspendu">Suspendu</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Matricule</label>
                            <input value={formData.matricule ?? ""} onChange={(e) => handleChange("matricule", e.target.value)} className={inputClass} />
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Numéro de téléphone</label>
                        <input type="tel" value={formData.phone_number ?? ""} onChange={(e) => handleChange("phone_number", e.target.value)} className={inputClass} placeholder="+221 77 123 45 67" />
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Link to={`/employees/${id}`} className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors">Annuler</Link>
                    <button type="submit" disabled={updateEmployee.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity">
                        {updateEmployee.isPending ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>
            </form>
        </div>
    );
}
