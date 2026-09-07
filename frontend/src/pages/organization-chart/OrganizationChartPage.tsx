import { useState } from "react";
import { Network, Users, Building2, Search } from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useDepartments } from "@/hooks/useDepartments";
import type { Employee } from "@/types";

export default function OrganizationChartPage() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("tous");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: employeesData, isLoading } = useEmployees();
  const { data: departmentsData } = useDepartments();

  const employees = employeesData?.results ?? [];
  const departments = departmentsData?.results ?? [];

  // Filter employees
  const filteredEmployees = employees.filter((emp) => {
    if (selectedDepartment !== "tous" && emp.department !== selectedDepartment) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return emp.nom_complet.toLowerCase().includes(q) || emp.poste.toLowerCase().includes(q);
    }
    return true;
  });

  // Top level managers (employees with no manager or managers)
  const topLevelEmployees = filteredEmployees.filter(
    (e) => !e.manager || !employees.some((other) => other.id === e.manager)
  );

  function getSubordinates(managerId: string) {
    return employees.filter((e) => e.manager === managerId);
  }

  function EmployeeCard({ employee }: { employee: Employee }) {
    const subordinates = getSubordinates(employee.id);
    const dept = departments.find((d) => d.id === employee.department);

    return (
      <div className="flex flex-col items-center">
        <div className="w-64 bg-card border border-border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
              {employee.nom_complet.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-foreground truncate">{employee.nom_complet}</h4>
              <p className="text-xs text-muted-foreground truncate">{employee.poste}</p>
            </div>
          </div>

          {dept && (
            <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <Building2 size={12} /> {dept.nom}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[10px]">
                {employee.type_contrat.toUpperCase()}
              </span>
            </div>
          )}

          {subordinates.length > 0 && (
            <div className="mt-2 text-center text-[10px] text-muted-foreground font-medium flex items-center justify-center gap-1">
              <Users size={12} /> {subordinates.length} subordonné(s) direct(s)
            </div>
          )}
        </div>

        {subordinates.length > 0 && (
          <div className="flex flex-col items-center mt-3 w-full">
            <div className="w-0.5 h-4 bg-border" />
            <div className="flex gap-6 relative pt-4 border-t-2 border-border">
              {subordinates.map((sub) => (
                <EmployeeCard key={sub.id} employee={sub} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Network className="text-primary h-7 w-7" />
            Organigramme de l'Entreprise
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue synthétique et hiérarchique de l'arbre d'encadrement des équipes.
          </p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un employé ou poste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border rounded-xl pl-9 pr-4 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Building2 size={14} className="text-muted-foreground hidden sm:block" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-border rounded-xl px-3 py-2 text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="tous">Tous les départements</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rendu Graphique Organigramme */}
      <div className="bg-card border border-border rounded-2xl p-8 shadow-sm overflow-x-auto min-h-[500px] flex justify-center">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Chargement de l'organigramme...</div>
        ) : topLevelEmployees.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground italic">
            Aucun employé trouvé pour les filtres sélectionnés.
          </div>
        ) : (
          <div className="flex gap-12 items-start pt-4">
            {topLevelEmployees.map((emp) => (
              <EmployeeCard key={emp.id} employee={emp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
