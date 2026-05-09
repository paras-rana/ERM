import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import './App.css';
import { useAuth } from './auth/useAuth';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RiskRegisterPage from './pages/RiskRegisterPage';
import RiskDetailPage from './pages/RiskDetailPage';
import UserManagementPage from './pages/UserManagementPage';

function RequireAuth({ children }) {
  const { authReady, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return <div className="app-loading">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const { authReady, isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return <div className="app-loading">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/risks"
          element={(
            <RequireAuth>
              <RiskRegisterPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/risks/:riskId"
          element={(
            <RequireAuth>
              <RiskDetailPage />
            </RequireAuth>
          )}
        />
        <Route
          path="/users"
          element={(
            <RequireAdmin>
              <UserManagementPage />
            </RequireAdmin>
          )}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
