import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';

export interface SearchableItem {
  id: string;
  name: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: SearchableItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  showSearch?: boolean;
}

export function SearchableSelect({
  isOpen,
  onClose,
  title,
  items,
  selectedId,
  onSelect,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No hay resultados',
  showSearch = true
}: SearchableSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const lower = searchQuery.toLowerCase();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(lower) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(lower))
    );
  }, [items, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-bg/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full sm:max-w-md bg-surface border-t sm:border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[80vh] sm:h-150 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300">
        {/* Cabecera */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-bold text-text ml-2">{title}</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-alt text-text-muted hover:text-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Buscador */}
        {showSearch && (
          <div className="p-4 border-b border-border/50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface-alt border border-border rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {filteredItems.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredItems.map(item => {
                const isSelected = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    className={`flex items-center justify-between w-full p-4 rounded-xl text-left transition-colors active:scale-[0.98] ${
                      isSelected 
                        ? 'bg-primary/10 border border-primary/30 text-primary' 
                        : 'hover:bg-surface-alt text-text border border-transparent'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className={`font-bold ${isSelected ? 'text-primary' : 'text-text'}`}>
                        {item.name}
                      </span>
                      {item.subtitle && (
                        <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium mt-0.5">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-primary" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
              <Search className="w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-muted">{emptyMessage}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
