import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import { BuilderProvider } from '@/hooks/useBuilder';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Mfa from '@/pages/Mfa';
import Builder from '@/pages/Builder';
import Products from '@/pages/Products';
import CompletedBuilds from '@/pages/CompletedBuilds';
import MyBuilds from '@/pages/MyBuilds';
import SharedBuild from '@/pages/SharedBuild';
import Compare from '@/pages/Compare';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/mfa" element={<Mfa />} />
      <Route path="/b/:id" element={<SharedBuild />} />
      <Route element={<BuilderProvider><AppShell /></BuilderProvider>}>
        <Route path="/" element={<Builder />} />
        <Route path="/build/:id" element={<Builder />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/products" replace />} />}>
          <Route path="/products" element={<Products />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/builds" replace />} />}>
          <Route path="/builds" element={<CompletedBuilds />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/compare" replace />} />}>
          <Route path="/compare" element={<Compare />} />
        </Route>
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login?returnTo=/my-builds" replace />} />}>
          <Route path="/my-builds" element={<MyBuilds />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App