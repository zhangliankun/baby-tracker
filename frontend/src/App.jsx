import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { BabyProvider } from './contexts/BabyContext';
import Layout from './components/Layout';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TimelinePage from './pages/TimelinePage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-secondary-light border-t-brand-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text-secondary">加载中...</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <BabyProvider>{children}</BabyProvider>;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toast />
      <Routes>
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/" element={<ProtectedRoute><Layout><TimelinePage /></Layout></ProtectedRoute>} />
        <Route path="/stats" element={<ProtectedRoute><Layout><StatsPage /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
