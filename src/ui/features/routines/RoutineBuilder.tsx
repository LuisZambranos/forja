import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '@ui/hooks/useAuth';
import { Button } from '@ui/components/ui/Button';
import { Modal } from '@ui/components/ui/Modal';
import { ExerciseModal } from '../exercises/components/ExerciseModal';
import { ChevronLeft, Plus, X, Search, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useMyExercises, useGlobalExercises } from '@ui/hooks/useExercises';
import { useRoutine, useCreateRoutine, useUpdateRoutine, useDeleteRoutine } from '@ui/hooks/useRoutines';
import type { Exercise, RoutineExercise } from '@core/models';

export default function RoutineBuilder() {
  const { user, loading: loadingAuth } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [scheduledDays, setScheduledDays] = useState<number[]>([]);
  const [restBetweenSets, setRestBetweenSets] = useState(90);
  const [restBetweenExercises, setRestBetweenExercises] = useState(180);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Pecho': true
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Estados para nuevo ejercicio inline
  const [isCreateExerciseModalOpen, setIsCreateExerciseModalOpen] = useState(false);

  const { data: routineData, isLoading: loadingRoutine } = useRoutine(isEditing ? id : undefined);
  const { mutateAsync: createRoutine, isPending: isCreating } = useCreateRoutine();
  const { mutateAsync: updateRoutine, isPending: isUpdating } = useUpdateRoutine();
  const { mutateAsync: deleteRoutine, isPending: isDeleting } = useDeleteRoutine();

  useEffect(() => {
    if (isEditing && routineData && !loadingAuth) {
      if (!user?.uid || routineData.owner_id !== user.uid) {
        alert('Rutina no encontrada o no tienes permiso.');
        navigate('/');
        return;
      }
      setName(routineData.name);
      setRoutineExercises(routineData.exercises || []);
      setScheduledDays(routineData.scheduled_days || []);
      setRestBetweenSets(routineData.rest_between_sets || 90);
      setRestBetweenExercises(routineData.rest_between_exercises || 180);
      setLoadingInitial(false);
    }
  }, [isEditing, routineData, user, loadingAuth, navigate]);

  const { data: exercises = [] } = useMyExercises(user?.uid);
  const { data: globalExercises = [] } = useGlobalExercises();

  const allExercises = [...exercises, ...globalExercises];

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredExercises = allExercises.filter(ex => 
    normalize(ex.name).includes(normalize(searchTerm.trim()))
  );

  const groupedExercises = filteredExercises.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const categoryOrder = [
    'Pecho', 'Espalda', 'Piernas', 'Hombros', 
    'Bíceps', 'Tríceps', 'Core', 'Glúteos'
  ];

  const sortedGroups = Object.keys(groupedExercises).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const toggleDay = (val: number) => {
    setScheduledDays(prev => 
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val].sort()
    );
  };

  const addExercise = (exerciseId: string) => {
    setRoutineExercises(prev => [...prev, {
      exercise_id: exerciseId,
      target_sets: 3,
      target_reps: 10
    }]);
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: number) => {
    const updated = [...routineExercises];
    updated[index] = { ...updated[index], [field]: value };
    setRoutineExercises(updated);
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routineExercises.length - 1) return;
    
    const newExercises = [...routineExercises];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = newExercises[index];
    newExercises[index] = newExercises[swapIndex];
    newExercises[swapIndex] = temp;
    
    setRoutineExercises(newExercises);
  };

  const removeExercise = (index: number) => {
    setRoutineExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || routineExercises.length === 0) return;
    
    try {
      const payload = {
        name,
        owner_id: user.uid,
        is_public: false,
        exercises: routineExercises,
        scheduled_days: scheduledDays,
        rest_between_sets: restBetweenSets,
        rest_between_exercises: restBetweenExercises
      };

      if (isEditing && id) {
        await updateRoutine({ id, data: payload });
      } else {
        await createRoutine(payload);
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error al guardar rutina');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteRoutine(id);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error al eliminar rutina');
    }
  };

  const DAYS = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'X', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 0 },
  ];

  if (loadingInitial || loadingRoutine) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <span className="text-primary font-bold animate-pulse">Cargando...</span>
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto pb-32 relative">
      <header className="px-4 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-bg/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <Link to="/routines" className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-black text-text tracking-wide">
            {isEditing ? 'Editar Rutina' : 'Nueva Rutina'}
          </h1>
        </div>
      </header>

      <div className="px-4 flex-1">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-3">Nombre de la Rutina</label>
            <input 
              type="text"
              placeholder="Ej. Empuje Pesado"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-14 bg-bg text-text text-xl font-bold rounded-xl px-4 border border-border outline-none transition-colors"
              required
            />
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-3">Días de Entrenamiento</label>
            <div className="flex justify-between gap-1">
              {DAYS.map(day => {
                const isSelected = scheduledDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex-1 aspect-square rounded-xl font-bold flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-primary text-white shadow-md shadow-primary/30' 
                        : 'bg-bg text-text-muted border border-border/50 hover:bg-surface-alt'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
            <label className="text-xs text-text-muted font-bold uppercase tracking-widest block mb-3">Descansos Predeterminados</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Entre series</label>
                <select 
                  value={restBetweenSets}
                  onChange={e => setRestBetweenSets(Number(e.target.value))}
                  className="w-full h-12 bg-bg text-text text-sm font-bold rounded-xl px-3 border border-border outline-none transition-colors appearance-none"
                >
                  <option value={60}>1:00 min</option>
                  <option value={90}>1:30 min</option>
                  <option value={120}>2:00 min</option>
                  <option value={180}>3:00 min</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block mb-1">Entre ejercicios</label>
                <select 
                  value={restBetweenExercises}
                  onChange={e => setRestBetweenExercises(Number(e.target.value))}
                  className="w-full h-12 bg-bg text-text text-sm font-bold rounded-xl px-3 border border-border outline-none transition-colors appearance-none"
                >
                  <option value={90}>1:30 min</option>
                  <option value={120}>2:00 min</option>
                  <option value={180}>3:00 min</option>
                  <option value={240}>4:00 min</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest">Ejercicios Seleccionados</h2>
              <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                {routineExercises.length}
              </span>
            </div>
            
            {routineExercises.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center bg-surface-alt/30">
                <p className="text-text-muted text-sm font-medium">Aún no hay ejercicios. Agrega algunos desde el catálogo abajo.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {routineExercises.map((re, i) => {
                  const ex = allExercises.find(e => e.id === re.exercise_id);
                  return (
                    <div key={i} className="relative bg-surface border border-border rounded-2xl p-5 shadow-sm">
                      {/* Controles Reordenar/Eliminar */}
                      <div className="absolute top-4 right-4 flex gap-1">
                        <button 
                          type="button" 
                          onClick={() => moveExercise(i, 'up')}
                          disabled={i === 0}
                          className="w-8 h-8 rounded-full bg-surface-alt text-text flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => moveExercise(i, 'down')}
                          disabled={i === routineExercises.length - 1}
                          className="w-8 h-8 rounded-full bg-surface-alt text-text flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeExercise(i)}
                          className="w-8 h-8 rounded-full bg-danger/10 text-danger flex items-center justify-center ml-1 active:scale-95 transition-transform hover:bg-danger/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="pr-28 mb-5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">
                          {ex?.muscle_group || 'Otro'}
                        </span>
                        <h3 className="font-bold text-lg text-text leading-tight">{ex?.name || 'Cargando...'}</h3>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-bg rounded-xl p-2 border border-border/50 flex flex-col items-center justify-center">
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block text-center mb-1">Series</label>
                          <input 
                            type="number" 
                            value={re.target_sets}
                            onChange={e => updateExercise(i, 'target_sets', Number(e.target.value))}
                            className="w-full bg-transparent text-center font-black text-xl text-text outline-none"
                            min={1}
                          />
                        </div>
                        <div className="bg-bg rounded-xl p-2 border border-border/50 flex flex-col items-center justify-center">
                          <label className="text-[10px] text-text-muted font-bold uppercase tracking-widest block text-center mb-1">Reps</label>
                          <input 
                            type="number" 
                            value={re.target_reps}
                            onChange={e => updateExercise(i, 'target_reps', Number(e.target.value))}
                            className="w-full bg-transparent text-center font-black text-xl text-text outline-none"
                            min={1}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Catálogo de ejercicios */}
          <div className="pt-6 mt-2 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest">Catálogo de Ejercicios</h2>
              <button 
                type="button"
                onClick={() => setIsCreateExerciseModalOpen(true)}
                className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                + Crear Nuevo
              </button>
            </div>
            
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-text-muted" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar para agregar..."
                className="w-full h-14 bg-surface border border-border rounded-2xl pl-12 pr-4 text-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-3">
              {sortedGroups.map((group) => {
                const exs = groupedExercises[group];
                const isOpen = searchTerm.length > 0 ? true : expandedGroups[group];
                
                return (
                  <div key={group} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                    <button 
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="w-full px-5 py-4 flex items-center justify-between bg-surface hover:bg-surface-alt transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <h4 className="text-sm text-primary font-bold uppercase tracking-widest">{group}</h4>
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{exs.length}</span>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="w-5 h-5 text-text-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-text-muted" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="flex flex-col divide-y divide-border/50 border-t">
                        {exs.map(ex => (
                          <div key={ex.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-alt/30 transition-colors">
                            <span className="text-sm text-text font-semibold">{ex.name}</span>
                            <button
                              type="button"
                              onClick={() => addExercise(ex.id)}
                              className="w-10 h-10 rounded-xl bg-highlight/10 text-highlight flex items-center justify-center hover:bg-highlight hover:text-white transition-colors border border-highlight/20 hover:border-highlight active:scale-95"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {allExercises.length > 0 && sortedGroups.length === 0 && (
              <div className="text-center py-8 opacity-60">
                <span className="text-4xl mb-3 block">🤷‍♂️</span>
                <p className="text-sm text-text-muted font-medium">No hay resultados para "{searchTerm}".</p>
              </div>
            )}
          </div>
          
          {isEditing && (
            <div className="flex justify-center border-t border-border pt-8 pb-4">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 text-danger font-bold uppercase tracking-widest text-sm hover:opacity-80 transition-opacity active:scale-95 p-2 rounded-lg"
              >
                <Trash2 className="w-5 h-5" /> Eliminar Rutina
              </button>
            </div>
          )}

          {/* Botón flotante al final */}
          <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 max-w-lg mx-auto z-20">
            <Button 
              type="submit" 
              fullWidth 
              variant="highlight"
              className="h-16 text-xl font-black rounded-3xl glow-highlight shadow-xl"
              disabled={isSaving || routineExercises.length === 0 || !name}
            >
              {isSaving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Guardar Rutina')}
            </Button>
          </div>
        </form>
      </div>

      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Eliminar Rutina"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <button
              type="button"
              className="flex-1 rounded-xl font-bold bg-danger/10 text-danger border border-danger/20 hover:bg-danger hover:text-white transition-colors active:scale-95"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Sí, Eliminar
            </button>
          </>
        }
      >
        <p className="text-text-muted text-sm leading-relaxed">
          ¿Estás seguro de que deseas eliminar la rutina <span className="text-text font-bold">"{name}"</span>? Esta acción no se puede deshacer y ya no podrás seleccionarla para entrenar.
        </p>
      </Modal>

      <ExerciseModal
        isOpen={isCreateExerciseModalOpen}
        onClose={() => setIsCreateExerciseModalOpen(false)}
        mode="create"
        onSuccess={(exerciseId) => {
          addExercise(exerciseId);
          setIsCreateExerciseModalOpen(false);
        }}
      />
    </div>
  );
}


