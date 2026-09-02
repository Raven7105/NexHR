import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import EmployeesPage from "./pages/EmployeesPage";
import EmployeeDetailPage from "./pages/EmployeeDetailPage";
import EmployeeFormPage from "./pages/EmployeeFormPage";
import EmployeeEditPage from "./pages/EmployeeEditPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import LeavesPage from "./pages/LeavesPage";
import AttendancePage from "./pages/AttendancePage";
import PayrollPage from "./pages/PayrollPage";
import OrganizationChartPage from "./pages/OrganizationChartPage";
import CalendarPage from "./pages/CalendarPage";
import SettingsPage from "./pages/SettingsPage";
import VerifyLeavePage from "./pages/VerifyLeavePage";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <div>
          <p className="text-lg font-semibold text-foreground">Chargement...</p>
          <p className="text-sm text-muted-foreground">Initialisation de l’espace RH</p>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors duration={8000} closeButton expand visibleToasts={5} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify/:token" element={<VerifyLeavePage />} />

        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/employees/:id/edit" element={<EmployeeEditPage />} />
          <Route path="/employees/new" element={<EmployeeFormPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/organization-chart" element={<OrganizationChartPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;