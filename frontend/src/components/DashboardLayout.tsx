import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, Building2 } from "lucide-react";
import Sidebar from "./Sidebar";
import NotificationsPopover from "./NotificationsPopover";
import { useAuth } from "@/context/AuthContext";

const roleLabels: Record<string, string> = {
    superadmin: "Super Admin",
    pdg: "PDG / Direction",
    responsable_rh: "Responsable RH",
    admin_rh: "Responsable RH",
    manager: "Manager",
    employe: "Employé",
};

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user } = useAuth();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Header Bar with Notifications in TOP RIGHT */}
                <header className="sticky top-0 z-30 bg-card/90 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden text-foreground p-1.5 hover:bg-muted rounded-lg transition-colors"
                        >
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-2">
                            <Building2 className="text-primary hidden sm:block" size={20} />
                            <span className="font-bold text-foreground text-base tracking-tight">NexHR</span>
                            <span className="text-xs text-muted-foreground hidden md:inline">| Plateforme de Gestion RH</span>
                        </div>
                    </div>

                    {/* Top Right Header Controls */}
                    <div className="flex items-center gap-3">
                        {/* Notifications Popover at TOP RIGHT */}
                        <NotificationsPopover />

                        <div className="h-5 w-px bg-border hidden sm:block" />

                        {/* User Profile Badge */}
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs">
                                {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div className="hidden sm:block text-left">
                                <p className="text-xs font-semibold text-foreground leading-none">{user?.email}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                                    {user?.role ? (roleLabels[user.role] ?? user.role) : ""}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 sm:p-6 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}