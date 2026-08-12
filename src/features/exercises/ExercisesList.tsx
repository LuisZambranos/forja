import { Link } from 'react-router-dom';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import type { Exercise } from '../../shared/types';
import { useAuth } from '../../hooks/useAuth';
import { where } from 'firebase/firestore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ChevronLeft, Plus } from 'lucide-react';

export default function ExercisesList() {
  const { user } = useAuth();
  
  const { data: exercises = [], isLoading } = useFirestoreQuery<Exercise>(
    ['exercises', user?.uid],
    'exercises',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 60 // 1 hour stale time
  );

  return (
    <div className="p-4 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-6 pt-4">
        <Link to="/" className="text-text-muted hover:text-text transition-colors p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Ejercicios</h1>
        <Link to="/exercises/new">
          <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      </header>

      {isLoading ? (
        <p className="text-text-muted">Cargando ejercicios...</p>
      ) : exercises.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted mb-4">No tienes ejercicios personalizados.</p>
          <Link to="/exercises/new">
            <Button>Crear Ejercicio</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {exercises.map(ex => (
            <Card key={ex.id} className="p-4">
              <div className="font-medium text-lg">{ex.name}</div>
              <div className="text-sm text-text-muted mt-1 flex gap-2">
                <span className="bg-surface-alt px-2 py-0.5 rounded-md">{ex.muscle_group}</span>
                <span className="bg-surface-alt px-2 py-0.5 rounded-md">{ex.equipment}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
