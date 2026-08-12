import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ChevronLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ExerciseForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [loading, setLoading] = useState(false);

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
    <div className="p-4 max-w-lg mx-auto">
      <header className="flex items-center gap-4 mb-8 pt-4">
        <Link to="/exercises" className="text-text-muted hover:text-text transition-colors p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Nuevo Ejercicio</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input 
          label="Nombre del Ejercicio" 
          placeholder="Ej. Press de Banca" 
          value={name} 
          onChange={e => setName(e.target.value)} 
          required 
        />
        <Input 
          label="Grupo Muscular" 
          placeholder="Ej. Pecho" 
          value={muscleGroup} 
          onChange={e => setMuscleGroup(e.target.value)} 
          required 
        />
        <Input 
          label="Equipamiento" 
          placeholder="Ej. Barra" 
          value={equipment} 
          onChange={e => setEquipment(e.target.value)} 
          required 
        />
        
        <Button type="submit" fullWidth className="mt-4" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear Ejercicio'}
        </Button>
      </form>
    </div>
  );
}
