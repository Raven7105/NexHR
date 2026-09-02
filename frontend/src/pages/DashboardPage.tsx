import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import CeoDashboard from "./CeoDashboard";

export default function DashboardPage() {
    const { user } = useAuth();

    if (user?.role === "pdg") {
        return <CeoDashboard />;
    }

    if (user?.role === "responsable_rh" || user?.role === "admin_rh" || user?.role === "superadmin") {
        return <AdminDashboard />;
    }

    if (user?.role === "manager") {
        return <ManagerDashboard />;
    }

    return <EmployeeDashboard />;
}