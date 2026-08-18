import { useState } from 'react';
import { Flame, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface WarmupSuggestionCardProps {
  lastWeight: number;
}

export function WarmupSuggestionCard({ lastWeight }: WarmupSuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Eliminar el límite de 10kg para permitir calentar ejercicios de hombro o accesorios ligeros.
  if (lastWeight <= 2) return null; // Solo evitamos calentar si el peso efectivo es absurdo (ej. 1 o 2kg).

  // Redondear a múltiplo de 2.5kg si es un peso de barra/compuesto (>10kg).
  // Si es un peso ligero (<10kg), redondeamos al kg más cercano (ej. mancuernas de 2kg, 3kg, etc).
  const calculateWeight = (val: number) => {
    if (lastWeight < 10) return Math.max(1, Math.round(val));
    return Math.max(2.5, Math.round(val / 2.5) * 2.5);
  };

  // Evitamos crear series duplicadas si los pesos redondeados terminan siendo el mismo (muy común en pesos bajitos)
  const allPhases = [
    { name: 'Activación', percent: '40-50%', weight: calculateWeight(lastWeight * 0.45), reps: '8 - 10' },
    { name: 'Aproximación', percent: '60-70%', weight: calculateWeight(lastWeight * 0.65), reps: '5 - 6' },
    { name: 'Potenciación', percent: '80-85%', weight: calculateWeight(lastWeight * 0.85), reps: '2 - 3' },
  ];

  // Filtramos fases con el mismo peso para no repetir calentamientos idénticos
  const uniquePhases = allPhases.filter((phase, index, self) =>
    index === self.findIndex((t) => t.weight === phase.weight)
  );

  // Si después del filtro solo queda 1 fase y es igual al peso efectivo, mejor no mostrar calentamiento
  if (uniquePhases.length === 1 && uniquePhases[0].weight >= lastWeight) return null;

  return (
    <div className="bg-surface border border-highlight/30 rounded-2xl mb-8 overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-highlight/5 hover:bg-highlight/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-highlight/20 flex items-center justify-center text-highlight">
            <Flame className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-highlight">Calentamiento Sugerido</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Optimiza tu rendimiento</p>
          </div>
        </div>
        <div className="text-highlight/70">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {expanded && (
        <div className="p-4 border-t border-highlight/10 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-start gap-2 mb-4 bg-surface-alt p-3 rounded-xl border border-border">
            <Info className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
            <p className="text-xs text-text-muted leading-relaxed">
              Realiza estas series sin llegar al fallo. Prepararán tus articulaciones para tu peso efectivo de <strong className="text-text">{lastWeight}kg</strong>. No hace falta registrarlas.
            </p>
          </div>

          <div className="space-y-2">
            {uniquePhases.map((phase, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-bg rounded-xl border border-border/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-text-muted w-4">{idx + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-text">{phase.name}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{phase.percent}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-text">{phase.weight}<span className="text-[10px] text-text-muted ml-0.5 uppercase">kg</span></p>
                  <p className="text-xs text-text-muted font-medium">{phase.reps} reps</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
