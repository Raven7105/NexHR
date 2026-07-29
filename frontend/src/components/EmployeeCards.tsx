import { Link } from "react-router-dom";
import type { Employee } from "@/types";

const STATUT_STYLES: Record<string, string> = {
    actif: "bg-green-100 text-green-700",
    inactif: "bg-slate-100 text-slate-700",
    suspendu: "bg-red-100 text-red-700",
};

export default function EmployeeCards({ employees }: { employees: Employee[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((employee) => (
                <Link
                    key={employee.id}
                    to={`/employees/${employee.id}`}
                    className="bg-card border border-border rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                            {employee.nom_complet.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{employee.nom_complet}</p>
                            <p className="text-sm text-muted-foreground truncate">{employee.poste}</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{employee.matricule}</span>
                        <span
                            className={`px-2 py-1 rounded-full font-medium ${STATUT_STYLES[employee.statut]}`}
                        >
                            {employee.statut}
                        </span>
                    </div>
                </Link>
            ))}
        </div>
    );
}