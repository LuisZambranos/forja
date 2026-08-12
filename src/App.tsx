import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import { BottomNav } from './components/layout/BottomNav';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import ExercisesList from './features/exercises/ExercisesList';
import ExerciseForm from './features/exercises/ExerciseForm';
import RoutineBuilder from './features/routines/RoutineBuilder';
import FocusMode from './features/workout/FocusMode';
import Profile from './features/profile/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Rutas donde la BottomNav NO debe mostrarse
const HIDDEN_NAV_ROUTES = ['/login', '/workout'];

function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideNav = HIDDEN_NAV_ROUTES.some(route => location.pathname.startsWith(route));

  return (
    <>
      {/* Contenido principal — pb-16 para que no quede tapado por la nav */}
      <main className={!hideNav ? 'pb-16' : ''}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <span className="text-primary text-2xl font-bold tracking-widest animate-pulse">
          💪 FORJA
        </span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/exercises" element={
              <ProtectedRoute><ExercisesList /></ProtectedRoute>
            } />
            <Route path="/exercises/new" element={
              <ProtectedRoute><ExerciseForm /></ProtectedRoute>
            } />
            <Route path="/routines/new" element={
              <ProtectedRoute><RoutineBuilder /></ProtectedRoute>
            } />
            <Route path="/routines/:id/edit" element={
              <ProtectedRoute><RoutineBuilder /></ProtectedRoute>
            } />
            <Route path="/workout/:routineId" element={
              <ProtectedRoute><FocusMode /></ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute><Profile /></ProtectedRoute>
            } />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
