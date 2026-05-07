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
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
