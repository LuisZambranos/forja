import { useState, useEffect } from 'react';
import { useAuth } from '@ui/hooks/useAuth';
import { Modal } from '@ui/components/ui/Modal';
import { Button } from '@ui/components/ui/Button';
import type { Exercise } from '@core/models';
import { useMyExercises, useCreateExercise, useUpdateExercise } from '@ui/hooks/useExercises';
import { SearchableSelect } from '@ui/components/ui/SearchableSelect';
import { ChevronDown } from 'lucide-react';

interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: Exercise | null;
  onSuccess?: (exerciseId: string) => void;
}

export function ExerciseModal({ isOpen, onClose, mode, initialData, onSuccess }: ExerciseModalProps) {
  const { user } = useAuth();
  
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewEquipment, setIsNewEquipment] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [isEquipmentSelectorOpen, setIsEquipmentSelectorOpen] = useState(false);
  
  const { data: exercises = [] } = useMyExercises(user?.uid);
  const { mutateAsync: createExercise, isPending: isCreating } = useCreateExercise();
  const { mutateAsync: updateExercise, isPending: isUpdating } = useUpdateExercise();

  const saving = isCreating || isUpdating;

  // Set initial data when opening in edit mode
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setName(initialData.name);
        setMuscleGroup(initialData.muscle_group || '');
        setEquipment(initialData.equipment || '');
      } else {
        setName('');
        setMuscleGroup('');
        setEquipment('');
      }
      setIsNewCategory(false);
      setIsNewEquipment(false);
    }
  }, [isOpen, mode, initialData]);

  // Categorías
  const defaultCategories = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Glúteos'];
  const uniqueGroups = Array.from(new Set([...defaultCategories, ...exercises.map(ex => ex.muscle_group).filter(Boolean)]));
  
  const sortedGroups = uniqueGroups.sort((a, b) => {
    const idxA = defaultCategories.indexOf(a as string);
    const idxB = defaultCategories.indexOf(b as string);
    if (idxA === -1 && idxB === -1) return (a as string).localeCompare(b as string);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Equipamientos
  const defaultEquipments = ['Peso corporal', 'Mancuernas', 'Barra', 'Máquina', 'Polea', 'Banda elástica'];
  const uniqueEquipments = Array.from(new Set([...defaultEquipments, ...exercises.map(ex => ex.equipment).filter(Boolean)]));
  
  const sortedEquipments = uniqueEquipments.sort((a, b) => {
    const idxA = defaultEquipments.indexOf(a as string);
    const idxB = defaultEquipments.indexOf(b as string);
    if (idxA === -1 && idxB === -1) return (a as string).localeCompare(b as string);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !muscleGroup) return;
    
    try {
      if (mode === 'create') {
        const id = await createExercise({
          name,
          muscle_group: muscleGroup,
          equipment,
          owner_id: user.uid,
          is_global: false
        });
        onSuccess?.(id);
      } else if (mode === 'edit' && initialData) {
        await updateExercise({
          id: initialData.id,
          data: {
            name,
            muscle_group: muscleGroup,
            equipment
          }
        });
        onSuccess?.(initialData.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al guardar el ejercicio');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !saving && onClose()}
      title={mode === 'create' ? 'Nuevo Ejercicio' : 'Editar Ejercicio'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1 block">Nombre</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-text outline-none transition-colors"
            placeholder="Ej. Press Inclinado"
          />
        </div>
        
        {/* Selector de Categoría */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted block">Grupo Muscular</label>
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
            <input 
              type="text" 
              required
              value={muscleGroup}
              onChange={e => setMuscleGroup(e.target.value)}
              className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-text outline-none transition-colors"
              placeholder="Nombre de la nueva categoría..."
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsCategorySelectorOpen(true)}
              className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-text outline-none transition-colors flex items-center justify-between focus:ring-1 focus:ring-primary shadow-sm"
            >
              <span className={muscleGroup ? 'text-text' : 'text-text-muted'}>
                {muscleGroup || 'Selecciona una categoría...'}
              </span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>

        {/* Selector de Equipamiento */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-widest text-text-muted block">Equipamiento (Opcional)</label>
            <button 
              type="button" 
              onClick={() => {
                setIsNewEquipment(!isNewEquipment);
                setEquipment('');
              }}
              className="text-xs text-primary font-bold hover:underline"
            >
              {isNewEquipment ? 'Elegir existente' : '+ Crear nuevo'}
            </button>
          </div>
          
          {isNewEquipment ? (
            <input 
              type="text" 
              value={equipment}
              onChange={e => setEquipment(e.target.value)}
              className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-text outline-none transition-colors"
              placeholder="Nombre del equipamiento..."
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEquipmentSelectorOpen(true)}
              className="w-full h-12 bg-bg border border-border rounded-xl px-4 text-text outline-none transition-colors flex items-center justify-between focus:ring-1 focus:ring-primary shadow-sm"
            >
              <span className={equipment ? 'text-text' : 'text-text-muted'}>
                {equipment || 'Ninguno / Peso corporal'}
              </span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>
          )}
        </div>

        <Button 
          type="submit" 
          variant={mode === 'create' ? 'highlight' : 'primary'} 
          fullWidth 
          className="mt-2 h-12"
          disabled={saving || !name || !muscleGroup}
        >
          {saving ? 'Guardando...' : (mode === 'create' ? 'Crear Ejercicio' : 'Guardar Cambios')}
        </Button>
      </form>

      <SearchableSelect
        isOpen={isCategorySelectorOpen}
        onClose={() => setIsCategorySelectorOpen(false)}
        title="Seleccionar Categoría"
        items={sortedGroups.map(g => ({ id: g as string, name: g as string }))}
        selectedId={muscleGroup}
        onSelect={setMuscleGroup}
        searchPlaceholder="Buscar categoría..."
      />

      <SearchableSelect
        isOpen={isEquipmentSelectorOpen}
        onClose={() => setIsEquipmentSelectorOpen(false)}
        title="Seleccionar Equipamiento"
        items={sortedEquipments.map(eq => ({ id: eq as string, name: eq as string }))}
        selectedId={equipment}
        onSelect={setEquipment}
        searchPlaceholder="Buscar equipamiento..."
      />
    </Modal>
  );
}
