import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChevronLeft, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';

export default function ExerciseForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // Fetch para obtener las categorías existentes
  const { data: exercises = [] } = useFirestoreQuery<any>(
    ['exercises'],
    'exercises',
    [],
    1000 * 60 * 60
  );
  
  const uniqueGroups = Array.from(new Set(exercises.map((ex: any) => ex.muscle_group || 'Otros')));
  const categoryOrder = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos'];
  
  const sortedGroups = uniqueGroups.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a as string);
    const idxB = categoryOrder.indexOf(b as string);
    if (idxA === -1 && idxB === -1) return (a as string).localeCompare(b as string);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'exercises'), {
        name,
        muscle_group: muscleGroup,
        equipment,
        owner_id: user.uid,
        is_global: false
      });
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      navigate('/exercises');
    } catch (err) {
      console.error(err);
      alert('Error al crear ejercicio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto">
      <header className="px-4 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-bg/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Link to="/exercises" className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-black text-text tracking-wide">Nuevo Ejercicio</h1>
        </div>
      </header>

      <div className="px-4 flex-1">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 mt-4">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm flex flex-col gap-5">
            <Input 
              label="Nombre del Ejercicio" 
              placeholder="Ej. Press de Banca Inclinado" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-text">Grupo Muscular</label>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsNewCategory(!isNewCategory);
                    setMuscleGroup('');
                  }}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {isNewCategory ? 'Elegir existente' : '+ Crear categoría'}
                </button>
              </div>
              
              {isNewCategory ? (
                <Input 
                  placeholder="Nombre de la nueva categoría..." 
                  value={muscleGroup} 
                  onChange={e => setMuscleGroup(e.target.value)} 
                  required 
                  autoFocus
                />
              ) : (
                <select
                  required
                  value={muscleGroup}
                  onChange={e => setMuscleGroup(e.target.value)}
                  className="w-full h-14 bg-surface-alt border-2 border-border rounded-xl px-4 text-text outline-none appearance-none transition-colors"
                >
                  <option value="" disabled>Selecciona una categoría...</option>
                  {sortedGroups.map(group => (
                    <option key={group as string} value={group as string}>{group as string}</option>
                  ))}
                </select>
              )}
            </div>
            <Input 
              label="Equipamiento (Opcional)" 
              placeholder="Ej. Mancuernas, Barra, Máquina..." 
              value={equipment} 
              onChange={e => setEquipment(e.target.value)} 
            />
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            variant="highlight"
            className="mt-4 h-14 rounded-2xl text-lg font-black glow-highlight" 
            disabled={loading || !name || !muscleGroup}
          >
            <Plus className="mr-2 w-5 h-5" />
            {loading ? 'Guardando...' : 'Crear Ejercicio'}
          </Button>
        </form>
      </div>
    </div>
  );
}
