import { useState } from "react";
import { LayoutGrid, List, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEmployees } from "@/hooks/useEmployees";
import EmployeeTable from "@/components/EmployeeTable";
import EmployeeCards from "@/components/EmployeeCards";

export default function EmployeesPage() {
    const { user } = useAuth();
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");
    const [search, setSearch] = useState("");

    const { data: employeesData, isLoading } = useEmployees({ search: search || undefined });

    const canManageEmployees = user?.role === "admin_rh" || user?.role === "superadmin";

    const employees = employeesData?.results ?? [];

    const visibleEmployees =
        user?.role === "manager"
            ? employees.filter((e) => e.manager === user.employee_profile?.id)
            : user?.role === "employe"
                ? employees.filter((e) => e.id === user.employee_profile?.id)
                : employees;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {user?.role === "employe" ? "Mon profil" : "Employés"}
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {visibleEmployees.length} employé{visibleEmployees.length > 1 ? "s" : ""}
                    </p>
                </div>

                {canManageEmployees && (
                    <Link
                        to="/employees/new"
                        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        <Plus size={16} />
                        Ajouter un employé
                    </Link>
                )}
            </div>

            {user?.role !== "employe" && (
                <div className="flex items-center gap-3 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            size={16}
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un employé..."
                            className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center border border-border rounded-lg overflow-hidden shrink-0">
                        <button
                            onClick={() => setViewMode("table")}
                            className={`p-2 transition-colors ${viewMode === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                }`}
                            title="Vue tableau"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode("cards")}
                            className={`p-2 transition-colors ${viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                                }`}
                            title="Vue cartes"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            ) : visibleEmployees.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Aucun employé trouvé.</p>
                </div>
            ) : viewMode === "table" ? (
                <EmployeeTable employees={visibleEmployees} />
            ) : (
                <EmployeeCards employees={visibleEmployees} />
            )}
        </div>
    );
}