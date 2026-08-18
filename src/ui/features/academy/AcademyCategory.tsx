import { ArrowLeft } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { ACADEMY_CATEGORIES, ACADEMY_CARDS } from './academyData';

export default function AcademyCategoryView() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = ACADEMY_CATEGORIES.find(c => c.id === categoryId);
  const cards = ACADEMY_CARDS.filter(c => c.categoryId === categoryId);

  if (!category) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg text-text">
        Categoría no encontrada.
      </div>
    );
  }

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
          <h1 className="text-xl font-black text-text leading-tight">{category.title}</h1>
          <p className="text-xs font-bold tracking-widest text-text-muted uppercase">
            {cards.length} {cards.length === 1 ? 'Concepto' : 'Conceptos'}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 flex flex-col gap-6">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <section key={card.id} className="bg-surface border border-border rounded-3xl p-6 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-30 ${card.bgClass}`} />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${card.bgClass} ${card.colorClass} ${card.borderClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-text leading-tight flex-1">{card.title}</h2>
              </div>
              
              <div className="relative z-10">
                {card.content}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
