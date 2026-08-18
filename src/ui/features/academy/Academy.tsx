import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ACADEMY_CATEGORIES } from './academyData';

export default function Academy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col bg-bg pb-24">
      {/* ── Cabecera ── */}
      <div className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border/50 px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-surface-alt transition-colors active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 text-text" />
        </button>
        <div>
          <h1 className="text-xl font-black text-text leading-tight">Academia Forjador</h1>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Conoce tu cuerpo</p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 flex flex-col gap-6">
        <p className="text-sm text-text-muted leading-relaxed font-medium">
          El verdadero progreso no viene solo de levantar más peso, sino de entender cómo responde tu cuerpo. Elige una categoría y empieza a aprender.
        </p>

        {/* ── Categorías (Grid) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACADEMY_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.id}
                onClick={() => navigate(`/academy/${cat.id}`)}
                className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
              >
                {/* Glow effect */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 group-hover:opacity-60 transition-opacity ${cat.bgClass}`} />
                
                <div className="flex items-center gap-4 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${cat.bgClass} ${cat.colorClass} ${cat.borderClass}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-text leading-tight mb-1">{cat.title}</h2>
                    <p className="text-xs text-text-muted">{cat.subtitle}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
