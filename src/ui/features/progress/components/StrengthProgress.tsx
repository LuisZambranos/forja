import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Trophy, ArrowUpRight, Dumbbell, Activity, Info } from 'lucide-react';
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
  // para no saturar la base de datos si el usuario tiene años de uso.
  const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;
  const { data: sessions, isLoading: loadingSessions } = useWorkoutSessions(user?.uid, EIGHT_WEEKS_MS);
  
  const { data: myExercises, isLoading: loadingMy } = useMyExercises(user?.uid);
  const { data: globalExercises, isLoading: loadingGlobal } = useGlobalExercises();

  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');

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
        name: ex?.name || 'Ejercicio Desconocido'
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allSetsWithDates, allExercises]);

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
    
    // Best set overall (using our utility)
    const bestSetCore = getBestSet(setsForEx);
    
    // Calculate PR list: Top 5 sets by 1RM
    const allRecords: PRRecord[] = setsForEx.map(s => ({
      weight: s.weight,
      reps: s.reps,
      estimated1RM: calculate1RMEpley(s.weight, s.reps),
      dateStr: s.dateStr,
      timestamp: s.timestamp
    }));
    
    // Remove duplicates (same weight and reps)
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
          Registra al menos un entrenamiento con peso para ver tu progresión aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-8">
      {/* Selector de Ejercicio */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider ml-1">
          Analizar Ejercicio
        </label>
        <div className="relative">
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3.5 text-text appearance-none outline-none focus:ring-1 focus:ring-primary transition-all font-medium"
          >
            <option value="" disabled>Selecciona un ejercicio...</option>
            {performedExercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {!selectedExerciseId ? (
        <div className="bg-surface/50 border border-border/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4">
          <div className="opacity-20 pointer-events-none w-full h-50 bg-linear-to-t from-primary/20 to-transparent rounded-xl flex items-end">
            {/* Esqueleto visual de gráfica */}
            <div className="w-full border-b border-border h-full flex items-end justify-between px-4 pb-2">
               <div className="w-1/6 h-[20%] bg-border rounded-t-sm"></div>
               <div className="w-1/6 h-[40%] bg-border rounded-t-sm"></div>
               <div className="w-1/6 h-[30%] bg-border rounded-t-sm"></div>
               <div className="w-1/6 h-[60%] bg-border rounded-t-sm"></div>
               <div className="w-1/6 h-[80%] bg-border rounded-t-sm"></div>
            </div>
          </div>
          <p className="text-text-muted font-medium mt-4">Selecciona un ejercicio arriba para ver su proyección de 1RM y gráficas.</p>
        </div>
      ) : (
        <>
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
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
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
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                  <p className="text-xs text-text-muted normal-case font-medium leading-relaxed">
                    Muestra el peso más alto que levantaste en este ejercicio cada día. Útil para ver tu <strong className="text-text">progresión de fuerza</strong> en el tiempo.
                  </p>
                </div>
              </div>
              <div className="h-62.5 w-full -ml-4">
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
              <h3 className="text-sm font-bold text-text flex items-center gap-2 ml-1">
                <Trophy className="w-4 h-4 text-yellow-500" />
                Mejores Marcas (Histórico)
              </h3>
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
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full right-0 mb-2 w-52 p-2.5 bg-surface-alt border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 text-left pointer-events-none">
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
        </>
      )}
    </div>
  );
}
