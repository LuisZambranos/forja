import { useState } from 'react';
import { getDailyPhrase } from '@core/services/motivational.service';
import { Dices } from 'lucide-react';

export function DailyQuoteCard() {
  const [offset, setOffset] = useState(0);
  const phrase = getDailyPhrase(offset);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-surface to-transparent p-5 pr-14">
      {/* Comilla decorativa */}
      <span
        className="absolute -top-3 -left-1 text-8xl font-black text-primary/10 leading-none select-none pointer-events-none"
        aria-hidden="true"
      >
        ❝
      </span>

      {/* Botón para cambiar de frase */}
      <button 
        onClick={() => setOffset(prev => prev + 1)}
        className="absolute top-4 right-2 rounded-full bg-linear-to-br from-primary to-highlight p-[1.5px] shadow-[0_-4px_12px_rgba(139,92,246,0.4),0_4px_12px_rgba(255,107,0,0.4)] hover:shadow-[0_-6px_16px_rgba(139,92,246,0.6),0_6px_16px_rgba(255,107,0,0.6)] transition-all hover:scale-110 active:scale-95 duration-300 group"
        aria-label="Siguiente frase"
      >
        <div className="p-1.5 rounded-full bg-surface/90 backdrop-blur-md group-hover:bg-surface/70 transition-colors flex items-center justify-center">
          <Dices 
            className="w-4 h-4 text-highlight drop-shadow-sm transition-transform duration-500 ease-out" 
            style={{ transform: `rotate(${offset * 180}deg)` }}
          />
        </div>
      </button>

      {/* Contenedor animado por key */}
      <div key={offset} className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
        {/* Texto de la frase */}
        <p className="relative text-base font-semibold text-text leading-relaxed mt-3 mb-3">
          {phrase.text}
        </p>

        {/* Autor */}
        <div className="flex items-center justify-end gap-2">
          <div className="h-px w-8 bg-border" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest whitespace-nowrap">
            {phrase.author}
          </p>
        </div>
      </div>
    </div>
  );
}
