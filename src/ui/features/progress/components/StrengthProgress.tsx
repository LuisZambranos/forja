import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Trophy, ArrowUpRight, Dumbbell, Activity, Info } from 'lucide-react';
import { SearchableSelect } from '@ui/components/ui/SearchableSelect';
import { useAuth } from '@ui/hooks/useAuth';
import { useWorkoutSessions } from '@ui/hooks/useWorkout';
import { useMyExercises, useGlobalExercises } from '@ui/hooks/useExercises';
import { getBestSet, calculate1RMEpley } from '../utils/EpleyCalculator';
import type { WorkoutSet } from '@core/models';

interface ChartDataPoint {
  dateStr: string;
  timestamp: number;
  weight: number;
}

interface PRRecord {
  weight: number;
  reps: number;
  estimated1RM: number;
  dateStr: string;
  timestamp: number;
}

export function StrengthProgress() {
  const { user } = useAuth();
  
  // Optimizamos para leer solo las últimas 8 semanas (8 * 7 * 24 * 60 * 60 * 1000 ms)
  const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;
  const { data: sessions, isLoading: loadingSessions } = useWorkoutSessions(user?.uid, EIGHT_WEEKS_MS);
  
  const { data: myExercises, isLoading: loadingMy } = useMyExercises(user?.uid);
  const { data: globalExercises, isLoading: loadingGlobal } = useGlobalExercises();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const allExercises = useMemo(() => {
    return [...(myExercises || []), ...(globalExercises || [])];
  }, [myExercises, globalExercises]);

  // Extract all sets with dates
  const allSetsWithDates = useMemo(() => {
    if (!sessions) return [];
    
    const sets: (WorkoutSet & { dateStr: string, timestamp: number })[] = [];
    sessions.forEach(session => {
      const date = new Date(session.started_at);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      
      session.sets?.forEach(set => {
        sets.push({ ...set, dateStr, timestamp: session.started_at });
      });
    });
    
    // Sort chronological
    return sets.sort((a, b) => a.timestamp - b.timestamp);
  }, [sessions]);

  // Find exercises actually performed
  const performedExercises = useMemo(() => {
    const ids = new Set<string>();
    allSetsWithDates.forEach(s => ids.add(s.exercise_id));
    
    return Array.from(ids).map(id => {
      const ex = allExercises.find(e => e.id === id);
      return {
        id,
        name: ex?.name || 'Ejercicio Desconocido',
        muscle: ex?.muscle_group || 'Otro'
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSetsWithDates, allExercises]);

  const searchableItems = useMemo(() => {
    return performedExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      subtitle: ex.muscle
    }));
  }, [performedExercises]);

  const selectedExercise = useMemo(() => {
    return performedExercises.find(e => e.id === selectedExerciseId);
  }, [performedExercises, selectedExerciseId]);

  // Auto-seleccionar un ejercicio al azar cuando carguen los datos
  useEffect(() => {
    if (performedExercises.length > 0 && !selectedExerciseId) {
      const randomIndex = Math.floor(Math.random() * performedExercises.length);
      setSelectedExerciseId(performedExercises[randomIndex].id);
    }
  }, [performedExercises, selectedExerciseId]);

  // Compute data for selected exercise
  const { chartData, prList, bestSet } = useMemo(() => {
    if (!selectedExerciseId) return { chartData: [], prList: [], bestSet: null };
    
    const setsForEx = allSetsWithDates.filter(s => s.exercise_id === selectedExerciseId && s.weight > 0 && s.reps > 0);
    
    if (setsForEx.length === 0) return { chartData: [], prList: [], bestSet: null };

    // Group by date to find max weight per day for the chart
    const maxWeightPerDay = new Map<string, ChartDataPoint>();
    setsForEx.forEach(set => {
      const existing = maxWeightPerDay.get(set.dateStr);
      if (!existing || set.weight > existing.weight) {
        maxWeightPerDay.set(set.dateStr, {
          dateStr: set.dateStr,
          timestamp: set.timestamp,
          weight: set.weight
        });
      }
    });

    const chartData = Array.from(maxWeightPerDay.values()).sort((a, b) => a.timestamp - b.timestamp);
    
    const bestSetCore = getBestSet(setsForEx);
    
    const allRecords: PRRecord[] = setsForEx.map(s => ({
      weight: s.weight,
      reps: s.reps,
      estimated1RM: calculate1RMEpley(s.weight, s.reps),
      dateStr: s.dateStr,
      timestamp: s.timestamp
    }));
    
    const uniqueRecordsMap = new Map<string, PRRecord>();
    allRecords.forEach(r => {
      const key = `${r.weight}x${r.reps}`;
      const existing = uniqueRecordsMap.get(key);
      if (!existing || r.estimated1RM > existing.estimated1RM || (r.estimated1RM === existing.estimated1RM && r.timestamp > existing.timestamp)) {
        uniqueRecordsMap.set(key, r);
      }
    });

    const prList = Array.from(uniqueRecordsMap.values())
      .sort((a, b) => b.estimated1RM - a.estimated1RM)
      .slice(0, 5);

    return { chartData, prList, bestSet: bestSetCore };
  }, [selectedExerciseId, allSetsWithDates]);

  // Calcular Mapa Muscular (8 semanas)
  const muscleMapData = useMemo(() => {
    if (!sessions || !sessions.length) return [];
    
    const exMap = new Map<string, string>();
    allExercises.forEach(e => exMap.set(e.id, e.muscle_group));

    const muscleCounts: Record<string, number> = {};
    let totalSets = 0;

    sessions.forEach(session => {
      if (!session.sets) return;
      session.sets.forEach(set => {
        const muscle = exMap.get(set.exercise_id) || 'Otro';
        muscleCounts[muscle] = (muscleCounts[muscle] || 0) + 1;
        totalSets++;
      });
    });

    return Object.entries(muscleCounts).map(([muscle, count]) => ({
      muscle,
      count,
      percentage: totalSets > 0 ? Math.round((count / totalSets) * 100) : 0
    })).sort((a, b) => b.count - a.count); // Ordenado para la leyenda
  }, [sessions, allExercises]);

  if (loadingSessions || loadingMy || loadingGlobal) {
    return (
      <div className="flex justify-center p-8">
        <Activity className="w-6 h-6 text-primary animate-pulse" />
      </div>
    );
  }

  if (performedExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center bg-surface border border-border rounded-2xl animate-in fade-in">
        <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center mb-2">
          <Dumbbell className="w-6 h-6 text-text-muted" />
        </div>
        <h3 className="text-lg font-bold text-text">Aún no hay datos</h3>
        <p className="text-sm text-text-muted">
          Registra al menos un entrenamiento con peso para ver tu progresión y mapa muscular.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-20 px-4 pt-4 relative">
      
      {/* Selector de Ejercicio (Botón Custom) */}
      <div className="flex flex-col gap-1 relative z-10">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
          Analizar Ejercicio
        </label>
        
        <div className="relative group mt-1">
          {/* Efecto Glow en el selector */}
          <div className="absolute -inset-0.5 bg-linear-to-r from-primary to-highlight rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500 pointer-events-none"></div>
          
          <button
            onClick={() => setIsSelectorOpen(true)}
            className="relative w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-left text-text flex items-center justify-between outline-none focus:ring-1 focus:ring-primary transition-all font-medium shadow-sm active:scale-[0.98]"
          >
            <span>{selectedExercise ? selectedExercise.name : 'Selecciona un ejercicio...'}</span>
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        <p className="text-[10px] text-text-muted/70 text-center mt-2">
          Toca para explorar el progreso de otros ejercicios realizados.
        </p>
      </div>

      {selectedExerciseId && (
        <div className="flex flex-col gap-6">
          {/* Calculadora 1RM */}
          {bestSet && (
            <div className="bg-linear-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <div tabIndex={0} className="relative group flex items-center gap-1.5 mb-1 w-max outline-none cursor-help">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    1RM Estimado (Epley)
                  </p>
                  <Info className="w-3.5 h-3.5 text-text-muted transition-colors" />
                  
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl z-20 pointer-events-none tooltip-content">
                    <p className="text-xs leading-relaxed text-text-muted normal-case font-medium">
                      El <strong className="text-text">1RM (Una Repetición Máxima)</strong> es el peso máximo que podrías levantar una sola vez. Epley lo estima usando tu mejor serie para medir tu fuerza sin riesgos.
                    </p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-text">
                    {Math.round(bestSet.estimated1RM)}
                  </span>
                  <span className="text-sm font-medium text-text-muted">kg</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider mb-1">Mejor Serie</p>
                <p className="text-sm font-bold text-text bg-surface-alt px-2 py-1 rounded-md">
                  {bestSet.weight}kg × {bestSet.reps}
                </p>
              </div>
            </div>
          )}

          {/* Gráfica de Progresión */}
          {chartData.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
              <div tabIndex={0} className="flex items-center gap-2 relative group w-max outline-none cursor-help">
                <h3 className="text-sm font-bold text-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Evolución de Peso Máximo
                </h3>
                <Info className="w-4 h-4 text-text-muted transition-colors" />
                
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl z-20 pointer-events-none tooltip-content">
                  <p className="text-xs text-text-muted normal-case font-medium leading-relaxed">
                    Muestra el peso más alto que levantaste en este ejercicio cada día. Útil para ver tu <strong className="text-text">progresión de fuerza</strong> en el tiempo.
                  </p>
                </div>
              </div>
              <div className="h-64 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.5} />
                    <XAxis 
                      dataKey="dateStr" 
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: '#888', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1C1C1E', borderColor: '#333', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} kg`, 'Peso']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#FF4500" 
                      strokeWidth={3}
                      dot={{ fill: '#FF4500', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#fff', stroke: '#FF4500', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Historial de PRs */}
          {prList.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col mb-1">
                <h3 className="text-sm font-bold text-text flex items-center gap-2 ml-1">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  Mejores Marcas: {selectedExercise?.name}
                </h3>
              </div>
              
              <div className="bg-surface border border-border rounded-2xl flex flex-col">
                {prList.map((pr, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border-b border-border/50 last:border-0 hover:bg-surface-alt/50 transition-colors first:rounded-t-2xl last:rounded-b-[calc(1rem-1px)]">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                        index === 1 ? 'bg-slate-300/20 text-slate-300' :
                        index === 2 ? 'bg-amber-700/20 text-amber-600' :
                        'bg-surface-alt text-text-muted'
                      }`}>
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-black text-lg text-text leading-tight">{pr.weight}kg <span className="text-text-muted text-sm font-medium">× {pr.reps}</span></p>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{pr.dateStr}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div tabIndex={0} className="relative group flex items-center gap-1 justify-end outline-none cursor-help">
                        <Info className="w-3 h-3 text-text-muted opacity-60" />
                        <span className="text-[10px] text-text-muted font-bold uppercase">Eq. 1RM</span>
                        
                        <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 bg-surface-alt border border-border rounded-xl shadow-xl z-20 text-left pointer-events-none tooltip-content">
                          <p className="text-[11px] text-text-muted normal-case font-medium leading-relaxed">
                            <strong className="text-text">1RM Equivalente.</strong> Sirve para comparar qué serie fue "más fuerte", equilibrando el peso y las repeticiones.
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary mt-0.5">{Math.round(pr.estimated1RM)}kg</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mapa Muscular (8 Semanas) - Nuevo Hogar */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center relative overflow-hidden mt-2">
        <div tabIndex={0} className="relative group flex items-center gap-1.5 mb-1 w-max outline-none cursor-help z-20">
          <span className="text-sm font-bold uppercase tracking-widest text-text-muted">
            Mapa Muscular
          </span>
          <Info className="w-4 h-4 text-text-muted" />
          
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl pointer-events-none text-left tooltip-content">
            <p className="text-xs text-text-muted normal-case font-medium leading-relaxed">
              Distribución del volumen de tus series en las <strong className="text-text">últimas 8 semanas</strong>. Ayuda a identificar visualmente si estás ignorando algún grupo muscular.
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold text-text-muted/70 mb-4 text-center relative z-10 tracking-widest">Últimas 8 semanas</span>
        
        {muscleMapData.length > 0 ? (
          <>
            <div className="w-full h-72 -ml-2 relative z-10 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={muscleMapData}>
                  <PolarGrid stroke="#2A2A2A" />
                  <PolarAngleAxis 
                    dataKey="muscle" 
                    tick={{ fill: '#A3A3A3', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                  <Radar
                    name="Series"
                    dataKey="count"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fill="#8B5CF6"
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Leyenda Analítica */}
            <div className="w-full relative z-10 grid grid-cols-2 gap-2 bg-bg p-3 rounded-2xl border border-border">
              {muscleMapData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="text-text-muted">{item.muscle}</span>
                  <span className="text-text font-black">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full h-40 flex items-center justify-center bg-surface-alt/50 rounded-2xl border border-border border-dashed mt-2 relative z-10">
            <p className="text-text-muted text-sm text-center px-6">
              Registra entrenamientos para ver tu mapa muscular.
            </p>
          </div>
        )}
      </div>

      <SearchableSelect
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        title="Seleccionar Ejercicio"
        items={searchableItems}
        selectedId={selectedExerciseId}
        onSelect={setSelectedExerciseId}
        searchPlaceholder="Buscar ejercicio o músculo..."
        emptyMessage="No se encontraron ejercicios"
      />
    </div>
  );
}
