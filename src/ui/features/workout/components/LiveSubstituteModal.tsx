import { useState, useMemo } from 'react';
import { Search, X, Plus, Dumbbell, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { Exercise } from '@core/models';

interface LiveSubstituteModalProps {
  currentExerciseId: string;
  allExercises: Exercise[];
  onClose: () => void;
  onSubstitute: (newExerciseId: string) => void;
  onCreateNew: () => void;
}

export function LiveSubstituteModal({ currentExerciseId, allExercises, onClose, onSubstitute, onCreateNew }: LiveSubstituteModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => 
      ex.id !== currentExerciseId && 
      normalize(ex.name).includes(normalize(searchTerm.trim()))
    );
  }, [allExercises, currentExerciseId, searchTerm]);

  const { groupedExercises, sortedGroups } = useMemo(() => {
    const grouped = filteredExercises.reduce((acc, ex) => {
      const group = ex.muscle_group || 'Otros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(ex);
      return acc;
    }, {} as Record<string, Exercise[]>);

    const categoryOrder = [
      'Pecho', 'Espalda', 'Piernas', 'Hombros', 
      'Bíceps', 'Tríceps', 'Core', 'Glúteos'
    ];

    const sorted = Object.keys(grouped).sort((a, b) => {
      const idxA = categoryOrder.indexOf(a);
      const idxB = categoryOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return { groupedExercises: grouped, sortedGroups: sorted };
  }, [filteredExercises]);

  return (
    <div className="fixed inset-0 z-100 flex flex-col bg-bg/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <header className="flex items-center gap-3 p-4 border-b border-border/50 bg-surface/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar para sustituir..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-sm font-medium placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            autoFocus
          />
        </div>
        <button onClick={onClose} className="p-3 bg-surface-alt rounded-xl text-text-muted hover:text-text active:scale-95 transition-all">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Crear Nuevo CTA */}
        <button 
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/40 rounded-2xl text-primary hover:bg-primary/5 active:scale-[0.98] transition-all mb-6"
        >
          <Plus className="w-5 h-5" />
          <span className="font-bold text-sm">Crear Nuevo Ejercicio</span>
        </button>

        {filteredExercises.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <p className="text-sm text-text-muted">No se encontraron ejercicios con "{searchTerm}".</p>
          </div>
        ) : (
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
                        <button
                          key={ex.id}
                          onClick={() => onSubstitute(ex.id)}
                          className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-surface-alt/30 transition-colors text-left"
                        >
                          <div>
                            <p className="text-sm text-text font-bold mb-0.5">{ex.name}</p>
                            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold flex items-center gap-1">
                              <Dumbbell className="w-3 h-3" /> {ex.equipment || 'Sin equipo'}
                            </p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <RefreshCw className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
