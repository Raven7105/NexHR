import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Users,
    Building2,
    Clock,
    Calendar,
    FileText,
    Wallet,
    Network,
    Settings,
    X,
    TrendingUp,
    FileCheck2,
    Milestone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLeaveRequests } from "../hooks/useLeaves";
import { useCompany, useCompanies } from "../hooks/useCompany";

const roleLabels: Record<string, string> = {
    superadmin: "Super Admin",
    super_admin: "Super Admin",
    pdg: "Président Directeur Général",
    responsable_rh: "Responsable RH",
    admin_rh: "Responsable RH",
    manager: "Manager",
    employe: "Employé",
};

// Navigation Exécutive C-Level dédiée au PDG
const ceoNavItems = [
    { to: "/dashboard", label: "Cockpit Stratégique", icon: TrendingUp },
    { to: "/leaves", label: "Signatures & Arbitrages", icon: FileCheck2, hasBadge: true },
    { to: "/employees", label: "Effectifs & Directeurs", icon: Users },
    { to: "/departments", label: "Pôles & Départements", icon: Building2 },
    { to: "/payroll", label: "Masse Salariale & Paie", icon: Wallet },
];

const ceoConfigItems = [
    { to: "/organization-chart", label: "Organigramme Exécutif", icon: Network },
    { to: "/settings", label: "Paramètres & Conformité", icon: Settings },
];

// Navigation Standard pour les autres rôles
const navItems = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/employees", label: "Employés", icon: Users, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/departments", label: "Départements", icon: Building2, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh"] },
    { to: "/attendance", label: "Présences", icon: Clock, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/calendar", label: "Calendrier", icon: Calendar, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/leaves", label: "Congés", icon: FileText, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/payroll", label: "Paie", icon: Wallet, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh"] },
];

const configItems = [
    { to: "/organization-chart", label: "Organigramme", icon: Network, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager", "employe"] },
    { to: "/settings", label: "Paramètres", icon: Settings, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh"] },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user } = useAuth();
    const isCeo = user?.role === "pdg";

    // Récupération de l'entreprise pour afficher exclusivement son logo
    const { data: directCompany } = useCompany(user?.company ?? undefined);
    const { data: companiesData } = useCompanies();
    const company = directCompany || (Array.isArray(companiesData) ? companiesData[0] : (companiesData as any)?.results?.[0]);

    // Pour le badge des signatures en attente du PDG
    const { data: leavesData } = useLeaveRequests();
    const pendingCeoCount = leavesData?.results?.filter((r) => r.statut === "PENDING_CEO").length ?? 0;

    const userProfileId = user?.employee_profile?.id;
    const computedNavItems = navItems.map((item) => {
        if (item.to === "/employees" && user?.role === "employe") {
            return {
                ...item,
                to: userProfileId ? `/employees/${userProfileId}` : "/employees",
                label: "Mon parcours",
                icon: Milestone,
            };
        }
        return item;
    });

    const visibleNavItems = isCeo ? ceoNavItems : computedNavItems.filter((item) => user && item.roles.includes(user.role));
    const visibleConfigItems = isCeo ? ceoConfigItems : configItems.filter((item) => user && item.roles.includes(user.role));

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                />
            )}

            <aside
                className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <button
                    onClick={onClose}
                    className="lg:hidden absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                {/* En-tête Sidebar : Logo d'entreprise circulaire occupant le haut */}
                <div className="py-6 px-4 flex flex-col items-center justify-center border-b border-sidebar-border/30">
                    <div className="relative group">
                        <div className="w-28 h-28 rounded-full bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-lg p-2.5 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-primary">
                            {company?.logo ? (
                                <img
                                    src={company.logo}
                                    alt={company.nom || user?.company_nom || "Logo Entreprise"}
                                    className="w-full h-full object-contain rounded-full"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <Building2 size={40} className="text-primary" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 text-center max-w-[210px]">
                        <p className="text-white font-bold text-sm leading-tight truncate">
                            {company?.nom || user?.company_nom || "Mon Entreprise"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {user ? roleLabels[user.role] ?? "Espace Entreprise" : "Espace Organisation"}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 px-3.5 py-6 flex flex-col justify-between overflow-y-auto">
                    <div>
                        <p className="px-3 text-[11px] font-bold text-slate-400/90 uppercase tracking-wider mb-3">
                            {isCeo ? "Direction & Pilotage" : "Menu principal"}
                        </p>
                        <div className="space-y-2.5">
                            {visibleNavItems.map(({ to, label, icon: Icon, ...rest }) => {
                                const hasBadge = "hasBadge" in rest && rest.hasBadge && pendingCeoCount > 0;
                                return (
                                    <NavLink
                                        key={to}
                                        to={to}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            `flex items-center justify-between px-4 py-6 rounded-xl text-sm font-medium transition-colors ${isActive
                                                ? "bg-sidebar-accent text-white font-semibold shadow-sm"
                                                : "text-slate-400 hover:bg-sidebar-accent/50 hover:text-white"
                                            }`
                                        }
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <Icon size={30} />
                                            <span>{label}</span>
                                        </div>
                                        {hasBadge && (
                                            <span className="bg-primary text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                {pendingCeoCount}
                                            </span>
                                        )}
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 mt-6 border-t border-sidebar-border/40">
                        <p className="px-3 text-[11px] font-bold text-slate-400/90 uppercase tracking-wider mb-3">
                            {isCeo ? "Gouvernance" : "Configuration"}
                        </p>
                        <div className="space-y-2.5">
                            {visibleConfigItems.map(({ to, label, icon: Icon }) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                            ? "bg-sidebar-accent text-white font-semibold shadow-sm"
                                            : "text-slate-400 hover:bg-sidebar-accent/50 hover:text-white"
                                        }`
                                    }
                                >
                                    <Icon size={30} />
                                    <span>{label}</span>
                                </NavLink>
                            ))}
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
}