import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise } from '@core/models';
import { useAuth } from '@ui/hooks/useAuth';
import { useMyExercises, useGlobalExercises, useDeleteExercise } from '@ui/hooks/useExercises';
import { Button } from '@ui/components/ui/Button';
import { ChevronLeft, Plus, Search, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import { Modal } from '@ui/components/ui/Modal';
import { ExerciseModal } from './components/ExerciseModal';

export default function ExercisesList() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Pecho': true // Expandir el primero por defecto
  });

  const [editingEx, setEditingEx] = useState<Exercise | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [deletingEx, setDeletingEx] = useState<Exercise | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { data: myExercises = [], isLoading: loadingMy } = useMyExercises(user?.uid);
  const { data: globalExercises = [], isLoading: loadingGlobal } = useGlobalExercises();
  const { mutateAsync: deleteExercise, isPending: isDeleting } = useDeleteExercise();

  const allExercises = [...myExercises, ...globalExercises];
  const isLoading = loadingMy || loadingGlobal;

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filtered = allExercises.filter(ex => 
    normalize(ex.name).includes(normalize(searchTerm.trim()))
  );

  const grouped = filtered.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Otros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);

  // Orden sugerido + comunes
  const categoryOrder = [
    'Pecho', 'Espalda', 'Piernas', 'Hombros', 
    'Bíceps', 'Tríceps', 'Core', 'Glúteos'
  ];

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const idxA = categoryOrder.indexOf(a);
    const idxB = categoryOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const toggleGroup = (g: string) => {
    setExpandedGroups(p => ({ ...p, [g]: !p[g] }));
  };

  const openEdit = (ex: Exercise) => {
    setEditingEx(ex);
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEx) return;
    try {
      await deleteExercise(deletingEx.id);
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto pb-24">
      <header className="px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-4 flex items-center justify-between sticky top-0 bg-bg/95 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-text-muted hover:text-text hover:bg-surface-alt transition-colors active:scale-95">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-black text-text tracking-wide">Ejercicios</h1>
        </div>
        <Button 
          variant="highlight" 
          size="sm" 
          className="rounded-xl font-bold px-4 h-10 glow-highlight"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="w-5 h-5 mr-1" /> Nuevo
        </Button>
      </header>

      <div className="px-4 pb-6 flex-1 flex flex-col">
        {/* Buscador responsivo y grande para mobile */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full h-14 bg-surface border border-border rounded-2xl pl-12 pr-4 text-text focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
          />
        </div>

        {/* Lista de categorías */}
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-10 opacity-60">
            <span className="text-5xl mb-4">🔍</span>
            <p className="text-text-muted font-medium">No encontramos "{searchTerm}"</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedGroups.map(group => {
              // Si hay texto de búsqueda, abrimos automáticamente todos los grupos que tengan coincidencias
              const isOpen = searchTerm.length > 0 ? true : expandedGroups[group];
              const count = grouped[group].length;
              
              return (
                <div key={group} className="bg-surface border border-border rounded-2xl overflow-hidden shadow-sm transition-all duration-300">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full px-5 py-4 flex items-center justify-between bg-surface hover:bg-surface-alt transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-sm font-bold text-primary uppercase tracking-widest">{group}</h2>
                      <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">{count}</span>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-text-muted" />
                    )}
                  </button>
                  
                  {isOpen && (
                    <div className="flex flex-col divide-y divide-border/50 border-t">
                      {grouped[group].map(ex => (
                        <div key={ex.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-surface-alt/30 transition-colors">
                          <div className="flex-1 pr-2">
                            <p className="font-semibold text-text text-sm">{ex.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">{ex.equipment || 'Peso corporal'}</p>
                          </div>
                          {ex.owner_id === user?.uid && (
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openEdit(ex); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-alt border border-border text-text-muted hover:text-text active:scale-95 transition-all"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeletingEx(ex); setIsDeleteModalOpen(true); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-danger/10 border border-danger/20 text-danger hover:bg-danger/20 active:scale-95 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Crear */}
      <ExerciseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />

      {/* Modal Editar */}
      <ExerciseModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        mode="edit"
        initialData={editingEx}
      />

      {/* Modal Eliminar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        title="Eliminar Ejercicio"
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
          ¿Estás seguro de que deseas eliminar <span className="text-text font-bold">"{deletingEx?.name}"</span>? Si lo usas en una rutina, podría dejar de mostrarse correctamente. Esta acción no se puede deshacer.
        </p>
      </Modal>

    </div>
  );
}

