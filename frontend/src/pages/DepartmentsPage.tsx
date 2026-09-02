import { useState } from "react";
import { Plus, Building2, Pencil, Trash2, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    useDepartments,
    useCreateDepartment,
    useUpdateDepartment,
    useDeleteDepartment,
} from "@/hooks/useDepartments";
import { useEmployees } from "@/hooks/useEmployees";
import type { Department } from "@/types";

export default function DepartmentsPage() {
    const { user } = useAuth();
    const { data: departmentsData, isLoading } = useDepartments();
    const { data: employeesData } = useEmployees();
    const createDepartment = useCreateDepartment();
    const updateDepartment = useUpdateDepartment();
    const deleteDepartment = useDeleteDepartment();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
    const [formData, setFormData] = useState({ nom: "", code: "", description: "", manager: "" });

    const canManage = user?.role === "responsable_rh" || user?.role === "admin_rh" || user?.role === "superadmin";
    const departments = departmentsData?.results ?? [];
    const employees = employeesData?.results ?? [];
    const departmentsWithManager = departments.filter((dept) => dept.manager).length;
    const totalEmployeesInDepartments = employees.filter((emp) => emp.department).length;

    function openCreateModal() {
        setEditingDepartment(null);
        setFormData({ nom: "", code: "", description: "", manager: "" });
        setIsModalOpen(true);
    }

    function openEditModal(dept: Department) {
        setEditingDepartment(dept);
        setFormData({
            nom: dept.nom,
            code: dept.code,
            description: dept.description,
            manager: dept.manager ?? "",
        });
        setIsModalOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            nom: formData.nom,
            code: formData.code,
            description: formData.description,
            manager: formData.manager || null,
            company: user!.company!,
        };

        if (editingDepartment) {
            updateDepartment.mutate(
                { id: editingDepartment.id, data: payload },
                { onSuccess: () => setIsModalOpen(false) }
            );
        } else {
            createDepartment.mutate(payload, { onSuccess: () => setIsModalOpen(false) });
        }
    }

    function handleDelete(id: string) {
        if (confirm("Supprimer ce département ? Cette action est irréversible.")) {
            deleteDepartment.mutate(id);
        }
    }

    const inputClass =
        "w-full border border-border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-foreground mb-1.5";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Départements</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {departments.length} département{departments.length > 1 ? "s" : ""} · {totalEmployeesInDepartments} employé{totalEmployeesInDepartments > 1 ? "s" : ""} rattachés
                    </p>
                </div>
                {canManage && (
                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Ajouter un département
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Building2 size={16} />
                        <span className="text-sm">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{departments.length}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users size={16} />
                        <span className="text-sm">Responsables</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{departmentsWithManager}</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Briefcase size={16} />
                        <span className="text-sm">Employés rattachés</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{totalEmployeesInDepartments}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            ) : departments.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Aucun département créé.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {departments.map((dept) => {
                        const manager = employees.find((e) => e.id === dept.manager);
                        const employeeCount = employees.filter((e) => e.department === dept.id).length;

                        return (
                            <div key={dept.id} className="bg-card border border-border rounded-xl p-5 hover:border-blue-300 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <Building2 className="text-purple-600" size={20} />
                                    </div>
                                    {canManage && (
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(dept)}
                                                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(dept.id)}
                                                className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-semibold text-foreground">{dept.nom}</h3>
                                <p className="text-xs text-muted-foreground mb-3">Code : {dept.code || "—"}</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {dept.description || "Aucune description pour ce département."}
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Employés</span>
                                        <span className="font-medium text-foreground">{employeeCount}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Responsable</span>
                                        <span className="font-medium text-foreground">{manager ? manager.nom_complet : "Aucun"}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold text-foreground mb-4">
                            {editingDepartment ? "Modifier le département" : "Nouveau département"}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className={labelClass}>Nom *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nom}
                                    onChange={(e) => setFormData((p) => ({ ...p, nom: e.target.value }))}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Code</label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                                    placeholder="Ex: RH, IT, FIN"
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                    rows={3}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Responsable</label>
                                <select
                                    value={formData.manager}
                                    onChange={(e) => setFormData((p) => ({ ...p, manager: e.target.value }))}
                                    className={inputClass}
                                >
                                    <option value="">Aucun</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.nom_complet}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-border text-foreground hover:bg-muted transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={createDepartment.isPending || updateDepartment.isPending}
                                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    {editingDepartment ? "Enregistrer" : "Créer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}