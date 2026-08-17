import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Dumbbell, Scale, Flame, CalendarDays } from 'lucide-react';
import { StrengthProgress } from './components/StrengthProgress';
import { BodyEvolution } from './components/BodyEvolution';
import { Achievements } from './components/Achievements';
import { WorkoutHistory } from './components/WorkoutHistory';

type TabId = 'strength' | 'body' | 'achievements' | 'history';

export default function ProgressHub() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>(
    (location.state as any)?.tab || 'strength'
  );

  // If the user navigates to /progress again via an internal link, reset if provided
  useEffect(() => {
    if ((location.state as any)?.tab) {
      setActiveTab((location.state as any).tab);
    }
  }, [location.state]);

  const tabs = [
    { id: 'strength', label: 'Fuerza', icon: Dumbbell },
    { id: 'body', label: 'Cuerpo', icon: Scale },
    { id: 'achievements', label: 'Logros', icon: Flame },
    { id: 'history', label: 'Historial', icon: CalendarDays },
  ] as const;

  return (
    <div className="min-h-dvh flex flex-col bg-bg max-w-lg mx-auto pb-24">
      <header className="px-4 pt-8 pb-4 flex flex-col gap-4 sticky top-0 bg-bg/95 backdrop-blur-md z-50">
        <h1 className="text-2xl font-black text-text tracking-wide">Mi Progreso</h1>
        
        {/* Navegación por Pestañas */}
        <div className="flex bg-surface-alt p-1 rounded-2xl">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'text-text-muted hover:text-text hover:bg-surface/50'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'opacity-100' : 'opacity-70'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Contenido de la pestaña activa */}
      <main className="flex-1 px-4 pt-2">
        {activeTab === 'strength' && <StrengthProgress />}
        {activeTab === 'body' && <BodyEvolution />}
        {activeTab === 'achievements' && <Achievements />}
        {activeTab === 'history' && <WorkoutHistory />}
      </main>
    </div>
  );
}

