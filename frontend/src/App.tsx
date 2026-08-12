import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Construction } from "lucide-react";
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

function ComingSoonPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-[60vh] rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Construction className="h-7 w-7" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
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
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

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
          <Route
            path="/attendance"
            element={<ComingSoonPage title="Présences" description="Cette vue sera bientôt enrichie avec les statuts, absences et suivi en temps réel." />}
          />
          <Route
            path="/calendar"
            element={<ComingSoonPage title="Calendrier" description="Un planning clair et partagé sera disponible prochainement pour les équipes." />}
          />
          <Route path="/leaves" element={<LeavesPage />} />
          <Route
            path="/payroll"
            element={<ComingSoonPage title="Paie" description="Le suivi des salaires et bulletins sera bientôt accessible directement depuis ici." />}
          />
          <Route
            path="/organization-chart"
            element={<ComingSoonPage title="Organigramme" description="La vue hiérarchique et les rapports d’équipe seront ajoutés prochainement." />}
          />
          <Route
            path="/settings"
            element={<ComingSoonPage title="Paramètres" description="Les préférences et réglages du système seront disponibles bientôt." />}
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;