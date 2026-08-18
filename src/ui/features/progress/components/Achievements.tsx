import { useState } from 'react';
import { useAuth } from '@ui/hooks/useAuth';
import { useAchievements } from '../hooks/useAchievements';
import { Info, CheckCircle2, AlertCircle, Dumbbell } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Modal } from '@ui/components/ui/Modal';

export function Achievements() {
  const { user } = useAuth();
  const { consistencyStats, isLoading } = useAchievements(user?.uid);
  const [selectedWeek, setSelectedWeek] = useState<typeof consistencyStats.weeksBreakdown[0] | null>(null);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col gap-6 py-6 animate-pulse px-4">
        <div className="h-64 bg-surface rounded-3xl" />
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-surface rounded-3xl" />
          <div className="h-32 bg-surface rounded-3xl" />
        </div>
        <div className="h-24 bg-surface rounded-3xl" />
      </div>
    );
  }

  const { rate, message, weeksBreakdown } = consistencyStats;
  const pieData = [
    { name: 'Logrado', value: rate },
    { name: 'Faltante', value: Math.max(0, 100 - rate) }
  ];
  const COLORS = ['#8B5CF6', '#1E1E24'];

  const lifetimeTonnage = user.lifetime_tonnage || 0;
  const formatTonnage = (tons: number) => {
    if (tons >= 1000000) return (tons / 1000000).toFixed(1) + 'M';
    if (tons >= 1000) return (tons / 1000).toFixed(1) + 'k';
    return tons.toString();
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isSecuredToday = user.last_workout_date === todayStr;
  const hasStreak = (user.current_streak || 0) > 0;

  const getRankInfo = (streak: number) => {
    if (streak >= 730) return { title: 'Dios', percent: 99.9 }; // 2 años
    if (streak >= 365) return { title: 'Semidiós', percent: 99 }; // 1 año
    if (streak >= 270) return { title: 'Leyenda', percent: 95 }; // 9 meses
    if (streak >= 180) return { title: 'Mito', percent: 90 }; // 6 meses
    if (streak >= 90) return { title: 'Élite', percent: 80 }; // 3 meses
    if (streak >= 30) return { title: 'Máquina', percent: 60 }; // 1 mes
    if (streak >= 14) return { title: 'Forjador', percent: 40 }; // 2 semanas
    if (streak >= 7) return { title: 'Constante', percent: 20 }; // 1 semana
    return { title: 'Iniciado', percent: 5 }; // < 1 semana
  };

  const effectiveMaxStreak = Math.max(user.max_streak || 0, user.current_streak || 0);
  const rankInfo = getRankInfo(effectiveMaxStreak);

  // Helper for mini-calendar (Last 7 days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    
    // For now we simulate checkmarks based on streak, but ideally we'd use the actual sessions.
    // If streak is N, the last N days are true, rest false. But we know today might be pending.
    const isToday = i === 6;
    let isActive = false;
    
    if (isToday) {
      isActive = isSecuredToday;
    } else {
      const daysAgo = 6 - i;
      if (isSecuredToday) {
        isActive = (user.current_streak || 0) > daysAgo;
      } else {
        isActive = (user.current_streak || 0) >= daysAgo;
      }
    }

    const dayName = ['D','L','M','X','J','V','S'][d.getDay()];
    return { label: dayName, isActive };
  });

  return (
    <div className="flex flex-col gap-6 pb-20 pt-4 px-4">
      
      {/* 1. Consistencia del Mes (Corona) */}
      <div className="bg-surface border border-border p-6 rounded-3xl flex flex-col items-center relative overflow-hidden shadow-lg">
        <div className="absolute w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent opacity-60 animate-pulse pointer-events-none" />
        
        <div tabIndex={0} className="relative group flex items-center gap-1.5 mb-2 w-max outline-none cursor-help z-20">
          <span className="text-sm font-bold uppercase tracking-widest text-text-muted">
            Consistencia del Mes
          </span>
          <Info className="w-4 h-4 text-text-muted" />
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-surface-alt border border-border rounded-xl shadow-xl pointer-events-none z-30 tooltip-content">
            <p className="text-xs text-text-muted normal-case font-medium leading-relaxed">
              Mide cuántos días entrenaste respecto a los programados en tu rutina. La primera semana del mes se ajusta para no penalizarte si empezaste a mitad de semana.
            </p>
          </div>
        </div>
        
        <div className="w-full h-64 relative my-4 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={85}
                outerRadius={110}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                stroke="none"
                cornerRadius={rate === 100 ? 0 : 12} // Cierra perfecto al 100%
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {/* Reducido a text-5xl para que no choque */}
            <span className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-br from-primary to-highlight drop-shadow-md">
              {rate}%
            </span>
          </div>
        </div>

        <p className="text-base font-bold text-primary text-center relative z-10 bg-primary/10 px-6 py-2 rounded-full mb-6">
          {message}
        </p>

        {/* Desglose Semanal */}
        <div className="w-full relative z-10 flex flex-col gap-2 bg-bg p-4 rounded-2xl border border-border">
          <span className="text-[10px] uppercase font-bold text-text-muted text-center tracking-widest mb-2">Detalle Semanal</span>
          {weeksBreakdown && weeksBreakdown.length > 0 ? (
            weeksBreakdown.map((week, idx) => (
              <button 
                key={idx} 
                onClick={() => setSelectedWeek(week)}
                className="flex justify-between items-center text-sm p-2 -mx-2 rounded-xl hover:bg-surface-alt/50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="text-text font-medium">{week.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted">{week.actual}/{week.expected} días</span>
                  {week.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-[#ffaa40]" />
                  )}
                </div>
              </button>
            ))
          ) : (
            <span className="text-sm text-text-muted text-center py-2">Registra tu primer entreno del mes.</span>
          )}
        </div>
      </div>

      {/* 2. Rachas (Prominentes, Gamificadas y con Tooltips Libres) */}
      <div className="flex flex-col gap-4">
        
        {/* Racha Actual */}
        {/* Usamos un div principal relativo PERO SIN overflow-hidden, el overflow va en un inner-div */}
        <div className="relative rounded-3xl p-5 border border-border bg-surface shadow-lg">
          {/* Capa de fondo con overflow para el glow */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#ffaa40]/10 blur-2xl rounded-full" />
          </div>
          
          <div className="flex flex-col relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <div tabIndex={0} className="relative group flex items-center gap-1.5 mb-1 w-max outline-none cursor-help">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Racha Actual</span>
                  <Info className="w-3.5 h-3.5 text-text-muted" />
                  <div className="absolute top-full left-0 mt-2 w-56 p-3 bg-surface-alt border border-border rounded-xl shadow-xl z-40 tooltip-content">
                    <p className="text-[11px] text-text-muted normal-case font-medium leading-relaxed">
                      Días seguidos entrenando. ¡No dejes que se apague la llama! Si pasas un día sin entrenar, vuelve a cero.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-5xl font-black text-text">{user.current_streak || 0}</span>
                  {/* Fuego animado (respira) */}
                  <span className="text-4xl drop-shadow-[0_0_12px_rgba(255,144,0,0.6)] animate-pulse" style={{ animationDuration: '2s' }}>🔥</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {isSecuredToday ? (
                  <div className="bg-success/15 text-success text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-success/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> Hoy asegurado
                  </div>
                ) : hasStreak ? (
                  <div className="bg-[#ffaa40]/15 text-[#ffaa40] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-[#ffaa40]/30 animate-pulse">
                    <AlertCircle className="w-4 h-4" /> Pendiente hoy
                  </div>
                ) : (
                  <div className="bg-surface-alt text-text-muted text-xs font-bold px-3 py-1.5 rounded-full border border-border">
                    ¡Empieza hoy!
                  </div>
                )}
                <span className="text-[10px] text-text-muted font-medium mr-1 mt-1">Días seguidos</span>
              </div>
            </div>

            {/* Mini Calendario Semanal */}
            <div className="mt-2 p-3 bg-bg rounded-2xl border border-border flex justify-between items-center">
              {last7Days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <span className={`text-[9px] font-bold ${idx === 6 ? 'text-primary' : 'text-text-muted'}`}>{day.label}</span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-500 ${
                    day.isActive 
                      ? 'bg-[#ffaa40]/20 text-[#ffaa40] border border-[#ffaa40]/40 shadow-[0_0_8px_rgba(255,170,64,0.3)]' 
                      : 'bg-surface-alt border border-border text-transparent'
                  }`}>
                    {day.isActive && <span className="drop-shadow-md">✓</span>}
                  </div>
                </div>
              ))}
            </div>
            {/* Meta de Racha */}
            {hasStreak && (
               <div className="mt-4 px-1">
                 {(() => {
                    const milestones = [1, 7, 14, 30, 60, 90, 180, 365];
                    const next = milestones.find(m => m > (user.current_streak || 0)) ?? 365;
                    const prev = milestones.filter(m => m <= (user.current_streak || 0)).pop() ?? 0;
                    const pct = Math.min(100, (((user.current_streak || 0) - prev) / (next - prev)) * 100);
                    return (
                      <>
                        <div className="flex justify-between text-[10px] text-text-muted font-bold mb-1.5 uppercase tracking-wide">
                          <span>Próxima meta</span>
                          <span className="text-highlight">{next} días</span>
                        </div>
                        <div className="h-1.5 bg-bg border border-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 bg-linear-to-r from-highlight to-[#ffaa40]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </>
                    );
                 })()}
               </div>
            )}
          </div>
        </div>

        {/* Récord Máximo (Trofeo Holográfico) */}
        <div className="relative rounded-3xl p-5 border border-border bg-surface shadow-lg group/record">
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 blur-2xl rounded-full" />
            {/* Barrido de luz (Shine effect) */}
            <div className="absolute inset-0 -translate-x-full group-hover/record:animate-[shimmer_2s_infinite] bg-linear-to-r from-transparent via-white/5 to-transparent skew-x-12" />
          </div>
          
          <div className="flex flex-col relative z-10">
            <div tabIndex={0} className="relative group flex items-center gap-1.5 mb-1 w-max outline-none cursor-help">
              <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Récord Histórico</span>
              <Info className="w-3.5 h-3.5 text-text-muted" />
              <div className="absolute bottom-full left-0 mb-2 w-56 p-3 bg-surface-alt border border-border rounded-xl shadow-xl pointer-events-none z-40 tooltip-content">
                <p className="text-[11px] text-text-muted normal-case font-medium leading-relaxed">
                  Tu mejor marca de constancia absoluta desde que usas Forja. Refleja tu máximo compromiso.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-5xl font-black text-text">{effectiveMaxStreak}</span>
                <span className="text-4xl drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] transform hover:scale-110 transition-transform cursor-default">🏆</span>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-black text-primary bg-primary/10 px-3 py-1 rounded-lg uppercase tracking-wider mb-1">
                  {rankInfo.title}
                </span>
                <span className="text-[10px] text-text-muted font-medium bg-bg px-2 py-0.5 rounded-full border border-border">
                  Mejor racha
                </span>
              </div>
            </div>

            {effectiveMaxStreak > 0 && (
              <div className="mt-4 p-3 bg-linear-to-r from-primary/5 to-transparent rounded-2xl border-l-2 border-primary">
                <p className="text-xs font-bold text-text">
                  ¡Superas al <span className="text-primary text-sm">{rankInfo.percent}%</span> de la comunidad!
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Estás en el top de los usuarios más disciplinados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Tonelaje Histórico (Fondo, Secundario) */}
      <div className="bg-bg border border-border p-5 rounded-2xl flex items-center justify-between opacity-80 mt-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg">
            <Dumbbell className="w-5 h-5 text-text-muted" />
          </div>
          <div>
            <div tabIndex={0} className="relative group flex items-center gap-1.5 w-max outline-none cursor-help">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Tonelaje Histórico</p>
              <Info className="w-3 h-3 text-text-muted" />
              <div className="absolute bottom-full left-0 mb-2 w-56 p-2 bg-surface-alt border border-border rounded-xl shadow-xl pointer-events-none z-20 tooltip-content">
                <p className="text-[11px] text-text-muted normal-case font-medium">
                  Suma de todo el peso levantado desde tu primer día en Forja.
                </p>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-black text-text">{formatTonnage(lifetimeTonnage)}</span>
              <span className="text-xs font-bold text-text-muted">kg movidos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Detalles Semanales */}
      <Modal 
        isOpen={!!selectedWeek} 
        onClose={() => setSelectedWeek(null)}
        title={selectedWeek ? `Detalles ${selectedWeek.label}` : ''}
      >
        {selectedWeek && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-text-muted">Cumplimiento</span>
              <span className="text-sm font-bold text-text">{selectedWeek.actual}/{selectedWeek.expected} días</span>
            </div>
            
            <div className="grid grid-cols-7 gap-2 bg-surface-alt/30 p-4 rounded-2xl border border-border">
              {selectedWeek.days.map((day, i) => {
                let badgeClass = 'bg-surface border border-border text-transparent'; // none
                let mark = null;
                
                if (day.status === 'completed') {
                  badgeClass = 'bg-success/20 text-success border border-success/40 shadow-[0_0_8px_rgba(74,222,128,0.3)]';
                  mark = '✓';
                } else if (day.status === 'recovered') {
                  badgeClass = 'bg-info/20 text-info border border-info/40 shadow-[0_0_8px_rgba(56,189,248,0.3)]'; // Blue (info)
                  mark = '↺';
                } else if (day.status === 'missed') {
                  badgeClass = 'bg-danger/20 text-danger border border-danger/40';
                  mark = '✗';
                } else if (day.status === 'pending_today') {
                  badgeClass = 'bg-[#ffaa40]/20 text-[#ffaa40] border border-[#ffaa40]/40 shadow-[0_0_8px_rgba(255,170,64,0.3)] animate-pulse';
                  mark = '·';
                } else if (day.status === 'scheduled_future') {
                  badgeClass = 'bg-surface-alt/50 text-text-muted border border-border border-dashed';
                  mark = '·';
                } else if (day.status === 'none') {
                  badgeClass = 'bg-surface border border-border text-transparent';
                }

                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-text-muted">{day.label}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${badgeClass}`}>
                      {mark && <span className="drop-shadow-md">{mark}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-success/20 border border-success/40 flex items-center justify-center text-[8px] text-success font-bold">✓</div>
                <span className="text-[10px] text-text-muted">Cumplidos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-info/20 border border-info/40 flex items-center justify-center text-[8px] text-info font-bold">↺</div>
                <span className="text-[10px] text-text-muted">Recuperados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-danger/20 border border-danger/40 flex items-center justify-center text-[8px] text-danger font-bold">✗</div>
                <span className="text-[10px] text-text-muted">Fallados</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#ffaa40]/20 border border-[#ffaa40]/40 flex items-center justify-center text-[10px] text-[#ffaa40] font-bold leading-none shadow-[0_0_8px_rgba(255,170,64,0.3)] animate-pulse">·</div>
                <span className="text-[10px] text-text-muted">Pendiente (Hoy)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full bg-surface-alt/50 border border-border border-dashed flex items-center justify-center text-[10px] text-text-muted font-bold leading-none">·</div>
                <span className="text-[10px] text-text-muted">Programados</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
