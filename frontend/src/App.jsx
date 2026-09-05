import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import BottomNav from './components/BottomNav';
import DesktopNav from './components/DesktopNav';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cattle from './pages/Cattle';
import CattleDetail from './pages/CattleDetail';
import Predict from './pages/Predict';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Knowledge from './pages/Knowledge';
import Settings from './pages/Settings';

function ProtectedRoute({ children }) {
  const { isAuth } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedLayout({ children }) {
  const { isAuth } = useAuthStore();
  if (!isAuth) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-bg dark:bg-[#091310] flex flex-col lg:flex-row text-slate-900 dark:text-slate-100">
      <DesktopNav />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <main className="flex-1 min-w-0 pb-24 lg:pb-12">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function RootRedirect() {
  const { isAuth } = useAuthStore();
  return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  const { initTheme } = useThemeStore();
  const location = useLocation();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  useEffect(() => {
    const lang = localStorage.getItem('mastitrack_lang') || 'en';
    if (lang !== 'en') {
      const select = document.querySelector('.goog-te-combo');
      if (select) {
        select.value = lang;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={<ProtectedLayout><Dashboard /></ProtectedLayout>}
      />
      <Route
        path="/cattle"
        element={<ProtectedLayout><Cattle /></ProtectedLayout>}
      />
      <Route
        path="/cattle/:id"
        element={<ProtectedLayout><CattleDetail /></ProtectedLayout>}
      />
      <Route
        path="/predict"
        element={<ProtectedLayout><Predict /></ProtectedLayout>}
      />
      <Route
        path="/alerts"
        element={<ProtectedLayout><Alerts /></ProtectedLayout>}
      />
      <Route
        path="/analytics"
        element={<ProtectedLayout><Analytics /></ProtectedLayout>}
      />
      <Route
        path="/knowledge"
        element={<ProtectedLayout><Knowledge /></ProtectedLayout>}
      />
      <Route
        path="/settings"
        element={<ProtectedLayout><Settings /></ProtectedLayout>}
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
