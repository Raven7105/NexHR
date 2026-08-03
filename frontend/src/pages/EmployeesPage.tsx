import { useMemo, useState } from "react";
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
    const [sortBy, setSortBy] = useState<"date_creation" | "nom_complet" | "poste">("date_creation");
    const [page, setPage] = useState(1);

    const { data: employeesData, isLoading } = useEmployees({ search: search || undefined, ordering: sortBy, page });

    const canManageEmployees = user?.role === "admin_rh" || user?.role === "superadmin";

    const employees = employeesData?.results ?? [];

    const visibleEmployees =
        user?.role === "manager"
            ? employees.filter((e) => e.manager === user.employee_profile?.id)
            : user?.role === "employe"
                ? employees.filter((e) => e.id === user.employee_profile?.id)
                : employees;

    const sortedEmployees = useMemo(() => [...visibleEmployees].sort((a, b) => {
        if (sortBy === "nom_complet") {
            return a.nom_complet.localeCompare(b.nom_complet);
        }
        if (sortBy === "poste") {
            return a.poste.localeCompare(b.poste);
        }
        return new Date(b.date_embauche).getTime() - new Date(a.date_embauche).getTime();
    }), [sortBy, visibleEmployees]);

    const totalPages = Math.max(1, Math.ceil((employeesData?.count ?? 0) / 20));

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

                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as "date_creation" | "nom_complet" | "poste")}
                            className="border border-border rounded-lg px-3 py-2 text-sm bg-background"
                        >
                            <option value="date_creation">Date d’embauche</option>
                            <option value="nom_complet">Nom</option>
                            <option value="poste">Poste</option>
                        </select>
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
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Chargement...</p>
                </div>
            ) : sortedEmployees.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Aucun employé trouvé.</p>
                </div>
            ) : viewMode === "table" ? (
                <>
                    <EmployeeTable employees={sortedEmployees} />
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50">Précédent</button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50">Suivant</button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <EmployeeCards employees={sortedEmployees} />
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">Page {page} sur {totalPages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50">Précédent</button>
                            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50">Suivant</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}