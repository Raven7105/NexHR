import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 overflow-x-hidden">
                <div className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="text-foreground p-1"
                    >
                        <Menu size={22} />
                    </button>
                    <span className="font-bold text-foreground">NexHR</span>
                </div>

                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}