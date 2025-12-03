import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Home } from "./pages/Home";
import { CreateBill } from "./pages/CreateBill";
import { PaymentPage } from "./pages/PaymentPage";
import { EditBillValuePage } from "./pages/EditBillValuePage";
import { CreditsPage } from "./pages/CreditsPage";
import { CreditDetailPage } from "./pages/CreditDetailPage";
import { DebtsPage } from "./pages/DebtsPage";
import { DebtDetailPage } from "./pages/DebtDetailPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-bill"
        element={
          <ProtectedRoute>
            <CreateBill />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-bill-value"
        element={
          <ProtectedRoute>
            <EditBillValuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credits"
        element={
          <ProtectedRoute>
            <CreditsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/credits/:debtorId"
        element={
          <ProtectedRoute>
            <CreditDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debts"
        element={
          <ProtectedRoute>
            <DebtsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debts/:creditorId"
        element={
          <ProtectedRoute>
            <DebtDetailPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
