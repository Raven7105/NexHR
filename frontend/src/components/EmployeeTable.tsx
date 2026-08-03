import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useDeleteEmployee } from "@/hooks/useEmployees";
import type { Employee } from "@/types";

const STATUT_STYLES: Record<string, string> = {
    actif: "bg-green-100 text-green-700",
    inactif: "bg-slate-100 text-slate-700",
    suspendu: "bg-red-100 text-red-700",
};

export default function EmployeeTable({ employees }: { employees: Employee[] }) {
    const deleteEmployee = useDeleteEmployee();

    const handleDelete = (employee: Employee) => {
        toast("Supprimer définitivement cet employé ?", {
            action: {
                label: "Confirmer",
                onClick: () => deleteEmployee.mutate(employee.id),
            },
            cancel: {
                label: "Annuler",
                onClick: () => undefined,
            },
        });
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/50">
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Employé</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Département</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Matricule</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Poste</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Contrat</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Statut</th>
                        <th className="text-left font-medium text-muted-foreground px-4 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((employee) => (
                        <tr
                            key={employee.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                            <td className="px-4 py-3">
                                <Link to={`/employees/${employee.id}`} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-semibold shrink-0">
                                        {employee.nom_complet.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-medium text-foreground hover:text-blue-600 transition-colors">
                                        {employee.nom_complet}
                                    </span>
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{employee.department_nom ?? "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{employee.matricule}</td>
                            <td className="px-4 py-3 text-muted-foreground">{employee.poste}</td>
                            <td className="px-4 py-3 text-muted-foreground uppercase text-xs">
                                {employee.type_contrat}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium ${STATUT_STYLES[employee.statut]}`}
                                >
                                    {employee.statut}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDelete(employee);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                    title="Supprimer"
                                >
                                    <Trash2 size={14} />
                                    Supprimer
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}