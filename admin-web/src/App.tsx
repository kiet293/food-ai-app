import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './lib/toast';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { RecipesPage } from './pages/RecipesPage';
import { ReelsPage } from './pages/ReelsPage';
import { TaxonomyPage } from './pages/TaxonomyPage';
import { CommentsPage } from './pages/CommentsPage';
import { SystemPage } from './pages/SystemPage';

function ProtectedRoutes() {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/reels" element={<ReelsPage />} />
              <Route path="/taxonomy" element={<TaxonomyPage />} />
              <Route path="/comments" element={<CommentsPage />} />
              <Route path="/system" element={<SystemPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
