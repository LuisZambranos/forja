import { Link, useNavigate } from 'react-router-dom';
import { useFirestoreQuery } from '../../hooks/useFirebaseQuery';
import { where } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import type { Routine } from '../../shared/types';
import { Plus, Dumbbell, Calendar, Zap, Pencil, Activity } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function RoutinesHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: routines = [], isLoading } = useFirestoreQuery<Routine>(
    ['routines', user?.uid],
    'routines',
    user?.uid ? [where('owner_id', '==', user.uid)] : []
  );

  const activeDaysCount = new Set(routines.flatMap(r => r.scheduled_days || [])).size;
  const globalAssignedDays = Array.from(new Set(routines.flatMap(r => r.scheduled_days || [])));
  const DAYS_LABEL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto pb-24">
      <header className="px-4 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-bg/95 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black text-text tracking-wide">Mis Rutinas</h1>
      </header>

      <div className="px-4 flex-1 flex flex-col gap-6 mt-2">
        {/* Estadísticas de la semana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
              <Dumbbell className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-text">{routines.length}</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Rutinas</span>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full bg-highlight/10 text-highlight flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-text">{activeDaysCount}/7</span>
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">Días Asignados</span>
          </div>
        </div>

        {/* Resumen semanal visual */}
        <div className="bg-surface border border-border rounded-2xl p-4 flex justify-between items-center">
          {DAYS_LABEL.map((label, idx) => {
            const isAssigned = globalAssignedDays.includes(idx);
            return (
              <div 
                key={idx} 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isAssigned 
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm shadow-primary/10' 
                    : 'bg-surface-alt text-text-muted border border-border/50'
                }`}
              >
                {label[0]}
              </div>
            );
          })}
        </div>

        {/* Lista de rutinas */}
        <div>
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Catálogo</h2>
          
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
            </div>
          ) : routines.length === 0 ? (
            <div className="text-center py-10 bg-surface/50 border border-border border-dashed rounded-2xl">
              <span className="text-5xl block mb-4 opacity-50">📋</span>
              <p className="text-text-muted font-medium mb-4">No tienes ninguna rutina creada.</p>
              <Link to="/routines/new">
                <Button variant="highlight" size="sm">Crear mi primera rutina</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {routines.map(routine => {
                const daysStr = (routine.scheduled_days || [])
                  .sort()
                  .map(d => DAYS_LABEL[d])
                  .join(', ');

                return (
                  <div key={routine.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-black text-text">{routine.name}</h3>
                        {daysStr && (
                          <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-highlight bg-highlight/10 px-2 py-0.5 rounded-md border border-highlight/20">
                            <Calendar className="w-3 h-3" />
                            <span>{daysStr}</span>
                          </div>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center border border-border">
                        <Activity className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    
                    <p className="text-sm text-text-muted mb-4 font-medium">
                      {routine.exercises?.length || 0} ejercicios
                    </p>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        className="flex-1"
                        onClick={() => navigate(`/routines/${routine.id}/edit`)}
                      >
                        <Pencil className="w-4 h-4 mr-2" /> Editar
                      </Button>
                      <Button 
                        variant="highlight" 
                        className="flex-1 glow-highlight"
                        onClick={() => navigate(`/workout/${routine.id}`)}
                      >
                        <Zap className="w-4 h-4 mr-2" /> Entrenar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante para nueva rutina */}
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-4 right-4 max-w-lg mx-auto z-20">
        <Button 
          variant="highlight" 
          fullWidth 
          className="h-14 shadow-lg shadow-highlight/20"
          onClick={() => navigate('/routines/new')}
        >
          <Plus className="w-5 h-5 mr-2" /> Crear Nueva Rutina
        </Button>
      </div>
    </div>
  );
}
