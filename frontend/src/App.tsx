import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/DashboardLayout";
import { useAuth } from "./context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
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
          <Route path="/dashboard" element={<div>Dashboard (à construire)</div>} />
          <Route path="/employees" element={<div>Employés (à construire)</div>} />
          <Route path="/departments" element={<div>Départements (à construire)</div>} />
          <Route path="/attendance" element={<div>Présences (à construire)</div>} />
          <Route path="/calendar" element={<div>Calendrier (à construire)</div>} />
          <Route path="/leaves" element={<div>Congés (à construire)</div>} />
          <Route path="/payroll" element={<div>Paie (à construire)</div>} />
          <Route path="/organization-chart" element={<div>Organigramme (à construire)</div>} />
          <Route path="/settings" element={<div>Paramètres (à construire)</div>} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;