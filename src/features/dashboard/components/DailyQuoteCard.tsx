import { getDailyPhrase } from '../../../shared/data/motivationalPhrases';

export function DailyQuoteCard() {
  const phrase = getDailyPhrase();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-br from-primary/10 via-surface to-transparent p-5">
      {/* Comilla decorativa */}
      <span
        className="absolute -top-3 -left-1 text-8xl font-black text-primary/10 leading-none select-none pointer-events-none"
        aria-hidden="true"
      >
        ❝
      </span>

      {/* Texto de la frase */}
      <p className="relative text-base font-semibold text-text leading-relaxed mt-3 mb-3">
        {phrase.text}
      </p>

      {/* Autor */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <p className="text-xs font-bold text-primary uppercase tracking-widest whitespace-nowrap">
          {phrase.author}
        </p>
      </div>
    </div>
  );
}
