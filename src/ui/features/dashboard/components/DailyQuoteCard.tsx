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
        className="absolute top-4 right-4 p-2 rounded-full bg-surface-alt/50 hover:bg-primary/20 text-text-muted hover:text-primary transition-all active:scale-90 active:rotate-180 duration-300"
        aria-label="Siguiente frase"
      >
        <Dices className="w-5 h-5" />
      </button>

      {/* Contenedor animado por key */}
      <div key={offset} className="animate-in fade-in slide-in-from-right-4 duration-500 ease-out">
        {/* Texto de la frase */}
        <p className="relative text-base font-semibold text-text leading-relaxed mt-3 mb-3">
          {phrase.text}
        </p>

        {/* Autor */}
        <div className="flex items-center gap-2">
          <div className="h-px w-8 bg-border" />
          <p className="text-xs font-bold text-primary uppercase tracking-widest whitespace-nowrap">
            {phrase.author}
          </p>
        </div>
      </div>
    </div>
  );
}
