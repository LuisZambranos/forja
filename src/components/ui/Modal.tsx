import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80 backdrop-blur-sm">
      {/* Overlay click para cerrar */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-surface border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">{title}</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted hover:text-text transition-colors active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5">
          {children}
        </div>
        
        {footer && (
          <div className="px-5 py-4 bg-bg/50 border-t border-border flex gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
