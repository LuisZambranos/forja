import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@ui/hooks/useAuth';
import logoNoBg from './assets/logo-removebg.png';
import { BottomNav } from '@ui/components/layout/BottomNav';
import Login from '@ui/features/auth/Login';
import Dashboard from '@ui/features/dashboard/Dashboard';
import ExercisesList from '@ui/features/exercises/ExercisesList';
import RoutineBuilder from '@ui/features/routines/RoutineBuilder';
import RoutinesHome from '@ui/features/routines/RoutinesHome';
import FocusMode from '@ui/features/workout/FocusMode';
import Profile from '@ui/features/profile/Profile';
import ProgressHub from '@ui/features/progress/ProgressHub';

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
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg relative overflow-hidden">
        {/* Glow de fondo pulsante */}
        <div className="absolute w-96 h-96 rounded-full bg-primary/15 blur-3xl animate-pulse" />
        <div className="absolute w-64 h-64 rounded-full bg-highlight/10 blur-3xl animate-pulse" style={{ animationDelay: '0.8s' }} />

        {/* Contenido central */}
        <div className="relative z-10 flex flex-col items-center gap-7">
          {/* Logo con respiración y glow doble */}
          <img
            src={logoNoBg}
            alt="Forja"
            className="w-32 h-32 object-contain"
            style={{
              filter: 'drop-shadow(0 0 28px rgba(139,92,246,0.75)) drop-shadow(0 0 10px rgba(249,115,22,0.35))',
              animation: 'forjaBreath 2.4s ease-in-out infinite',
            }}
          />

          {/* Nombre */}
          <span className="text-3xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-linear-to-r from-primary via-text to-primary uppercase">
            FORJA
          </span>

          {/* Barra shimmer */}
          <div className="w-28 h-0.5 bg-surface-alt rounded-full overflow-hidden">
            <div
              className="h-full w-1/2 bg-linear-to-r from-transparent via-primary to-transparent rounded-full"
              style={{ animation: 'forjaShimmer 1.5s ease-in-out infinite' }}
            />
          </div>
        </div>

        <style>{`
          @keyframes forjaBreath {
            0%, 100% { transform: scale(1);    opacity: 1;    }
            50%       { transform: scale(1.1);  opacity: 0.82; }
          }
          @keyframes forjaShimmer {
            0%   { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
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
            <Route path="/routines" element={
              <ProtectedRoute><RoutinesHome /></ProtectedRoute>
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
            <Route path="/progress" element={
              <ProtectedRoute><ProgressHub /></ProtectedRoute>
            } />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
