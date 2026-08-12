import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { ChevronLeft, Plus, X } from 'lucide-react';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import type { Exercise, RoutineExercise } from '../../shared/types';
import { useQueryClient } from '@tanstack/react-query';
import { where } from 'firebase/firestore';

export default function RoutineBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch exercises to select
  const { data: exercises = [] } = useFirestoreQuery<Exercise>(
    ['exercises', user?.uid],
    'exercises',
    [where('owner_id', '==', user?.uid)],
    1000 * 60 * 60
  );

  const addExercise = (exerciseId: string) => {
    setRoutineExercises(prev => [...prev, {
      exercise_id: exerciseId,
      target_sets: 3,
      target_reps: 10,
      rest_seconds: 90
    }]);
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: number) => {
    const updated = [...routineExercises];
    updated[index] = { ...updated[index], [field]: value };
    setRoutineExercises(updated);
  };

  const removeExercise = (index: number) => {
    setRoutineExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || routineExercises.length === 0) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'routines'), {
        name,
        owner_id: user.uid,
        is_public: false,
        exercises: routineExercises
      });
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error al crear rutina');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <Link to="/" className="text-text-muted hover:text-text transition-colors p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Nueva Rutina</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input 
          label="Nombre de la Rutina" 
          placeholder="Ej. Empuje Pesado" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
        />

        <div>
          <h2 className="font-bold mb-4">Ejercicios</h2>
          
          <div className="flex flex-col gap-4 mb-6">
            {routineExercises.map((re, i) => {
              const ex = exercises.find(e => e.id === re.exercise_id);
              return (
                <Card key={i} className="relative p-4 pt-8">
                  <button 
                    type="button" 
                    onClick={() => removeExercise(i)}
                    className="absolute top-2 right-2 text-text-muted hover:text-danger p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="font-medium text-lg mb-4">{ex?.name || 'Cargando...'}</div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Series</label>
                      <input 
                        type="number" 
                        value={re.target_sets}
                        onChange={e => updateExercise(i, 'target_sets', Number(e.target.value))}
                        className="w-full bg-surface-alt rounded-lg h-10 px-2 text-center"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Reps</label>
                      <input 
                        type="number" 
                        value={re.target_reps}
                        onChange={e => updateExercise(i, 'target_reps', Number(e.target.value))}
                        className="w-full bg-surface-alt rounded-lg h-10 px-2 text-center"
                        min={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-text-muted block mb-1">Desc. (s)</label>
                      <input 
                        type="number" 
                        value={re.rest_seconds}
                        onChange={e => updateExercise(i, 'rest_seconds', Number(e.target.value))}
                        className="w-full bg-surface-alt rounded-lg h-10 px-2 text-center"
                        step={15}
                        min={0}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-muted mb-2">Agregar Ejercicio</h3>
            <div className="flex flex-wrap gap-2">
              {exercises.map(ex => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex.id)}
                  className="bg-surface-alt text-sm px-3 py-2 rounded-lg hover:bg-primary/20 hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> {ex.name}
                </button>
              ))}
            </div>
            {exercises.length === 0 && (
              <p className="text-sm text-text-muted italic">Crea un ejercicio primero.</p>
            )}
          </div>
        </div>
        
        <Button 
          type="submit" 
          fullWidth 
          disabled={loading || routineExercises.length === 0}
        >
          {loading ? 'Guardando...' : 'Guardar Rutina'}
        </Button>
      </form>
    </div>
  );
}
