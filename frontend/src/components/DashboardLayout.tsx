import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Calendar, LogOut } from "lucide-react";
import Sidebar from "./Sidebar";
import NotificationsPopover from "./NotificationsPopover";
import { useAuth } from "@/context/AuthContext";

const roleLabels: Record<string, string> = {
    superadmin: "Super Admin",
    super_admin: "Super Admin",
    pdg: "PDG / Direction",
    responsable_rh: "Responsable RH",
    admin_rh: "Responsable RH",
    manager: "Manager",
    employe: "Employé",
};

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuth();

    const todayFormatted = new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0">
                {/* Barre Supérieure du Dashboard */}
                <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
                    {/* Partie Gauche : Date du jour & Organisation (sans NexHR) */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-foreground p-2 hover:bg-muted rounded-xl transition-colors"
                            title="Ouvrir le menu"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider capitalize flex items-center gap-1.5">
                                <Calendar size={13} className="text-primary" />
                                {todayFormatted}
                            </span>
                            <p className="text-sm font-bold text-foreground leading-tight mt-0.5">
                                {user?.company_nom || "Espace Entreprise"}
                            </p>
                        </div>
                    </div>

                    {/* Partie Droite : Notifications, Profil Connecté & Déconnexion */}
                    <div className="flex items-center gap-3">
                        {/* Cloche de Notifications */}
                        <NotificationsPopover />

                        <div className="h-6 w-px bg-border/80 hidden sm:block" />

                        {/* Badge Profil Utilisateur */}
                        <div className="flex items-center gap-2.5 bg-muted/30 border border-border/60 rounded-xl px-2.5 py-1.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shadow-sm shrink-0">
                                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="hidden sm:flex flex-col text-left min-w-0">
                                <span className="text-xs font-semibold text-foreground truncate max-w-[170px] leading-tight">
                                    {user?.email}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                    {user?.role ? (roleLabels[user.role] ?? user.role) : "Connecté"}
                                </span>
                            </div>
                        </div>

                        {/* Action de Déconnexion */}
                        <button
                            onClick={logout}
                            title="Se déconnecter"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-border/80 hover:border-rose-200 dark:hover:border-rose-900 transition-all shadow-sm"
                        >
                            <LogOut size={15} />
                            <span className="hidden md:inline">Déconnexion</span>
                        </button>
                    </div>
                </header>

                <div className="flex-1 p-4 sm:p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}