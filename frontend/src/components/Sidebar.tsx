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
    LogOut,
    X,
    TrendingUp,
    FileCheck2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLeaveRequests } from "../hooks/useLeaves";
import nLogo from "../assets/n_logo.svg";

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
    { to: "/employees", label: "Employés", icon: Users, roles: ["superadmin", "super_admin", "responsable_rh", "admin_rh", "manager"] },
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
    const { user, logout } = useAuth();
    const isCeo = user?.role === "pdg";

    // Pour le badge des signatures en attente du PDG
    const { data: leavesData } = useLeaveRequests();
    const pendingCeoCount = leavesData?.results?.filter((r) => r.statut === "PENDING_CEO").length ?? 0;

    const visibleNavItems = isCeo ? ceoNavItems : navItems.filter((item) => user && item.roles.includes(user.role));
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

                <div className="p-4 flex items-center gap-3">
                    <img src={nLogo} alt="NexHR" className="w-10 h-10 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-white font-bold text-sm leading-tight">NexHR</p>
                        <p className="text-xs text-slate-400 truncate">
                            {user?.company_nom ?? "Plateforme RH"}
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

                <div className="p-4 border-t border-sidebar-border flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {user?.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                        <p className="text-xs text-slate-400">{user?.role ? (roleLabels[user.role] ?? user.role) : ""}</p>
                    </div>
                    <button
                        onClick={logout}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Se déconnecter"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>
        </>
    );
}