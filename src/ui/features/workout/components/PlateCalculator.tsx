import { useMemo } from 'react';

interface PlateCalculatorProps {
  weight: number;
  equipment: string;
}

export function PlateCalculator({ weight, equipment }: PlateCalculatorProps) {
  const isBarbell = equipment?.toLowerCase().includes('barra') || equipment?.toLowerCase().includes('barbell');

  if (!isBarbell) return null;

  const plates = useMemo(() => {
    if (!isBarbell || weight <= 20) return [];
    
    const availablePlates = [25, 20, 15, 10, 5, 2.5, 1.25];
    let target = (weight - 20) / 2; // Peso por lado
    const needed: { weight: number, count: number }[] = [];

    for (const plate of availablePlates) {
      let count = 0;
      while (target >= plate) {
        count++;
        target -= plate;
        target = Math.round(target * 100) / 100;
      }
      if (count > 0) {
        needed.push({ weight: plate, count });
      }
    }

    return needed;
  }, [weight, isBarbell]);

  return (
    <div className="flex flex-col items-center gap-1 mt-4 mb-2 w-full text-center">
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        <span className="text-[10px] text-text-muted uppercase tracking-widest font-black mr-1">
          Discos por lado:
        </span>
        
        {plates.length === 0 ? (
          <span className="text-xs font-medium text-text-muted">Solo Barra</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {plates.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-text">{item.count} de {item.weight}kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[9px] text-text-muted opacity-70">
        *Cálculo considerando la barra estándar de 20kg
      </p>
    </div>
  );
}
