import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import EmployeeDashboard from "./EmployeeDashboard";

export default function DashboardPage() {
    const { user } = useAuth();

    if (user?.role === "admin_rh" || user?.role === "super_admin") {
        return <AdminDashboard />;
    }

    if (user?.role === "manager") {
        return <ManagerDashboard />;
    }

    return <EmployeeDashboard />;
}