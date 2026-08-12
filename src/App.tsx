import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './hooks/useAuth';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import ExercisesList from './features/exercises/ExercisesList';
import ExerciseForm from './features/exercises/ExerciseForm';
import RoutineBuilder from './features/routines/RoutineBuilder';
import FocusMode from './features/workout/FocusMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/exercises" element={
            <ProtectedRoute>
              <ExercisesList />
            </ProtectedRoute>
          } />
          <Route path="/exercises/new" element={
            <ProtectedRoute>
              <ExerciseForm />
            </ProtectedRoute>
          } />
          <Route path="/routines/new" element={
            <ProtectedRoute>
              <RoutineBuilder />
            </ProtectedRoute>
          } />
          <Route path="/workout/:routineId" element={
            <ProtectedRoute>
              <FocusMode />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
