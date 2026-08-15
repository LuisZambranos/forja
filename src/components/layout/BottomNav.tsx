import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, ClipboardList, User, Activity } from 'lucide-react';

const tabs = [
  { to: '/',           icon: Home,          label: 'Inicio'    },
  { to: '/routines',   icon: ClipboardList, label: 'Rutinas'   },
  { to: '/exercises',  icon: Dumbbell,      label: 'Ejercicios'},
  { to: '/progress',   icon: Activity,      label: 'Progreso'  },
  { to: '/profile',    icon: User,          label: 'Perfil'    },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex h-16">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => [
              'flex flex-1 flex-col items-center justify-center gap-0.5',
              'transition-all duration-200 select-none',
              isActive
                ? 'text-primary'
                : 'text-text-muted hover:text-text',
            ].join(' ')}
          >
            {({ isActive }) => (
              <>
                <div className={[
                  'relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200',
                  isActive ? 'bg-primary/15' : '',
                ].join(' ')}>
                  <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {/* Dot indicator debajo del ícono */}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
