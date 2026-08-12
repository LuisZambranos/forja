import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'glass';
}

export function Card({ children, className = '', variant = 'default', ...props }: CardProps) {
  const base = 'rounded-2xl p-4';
  
  const variants = {
    // Card estándar
    default: 'bg-surface border border-border',
    // Card con acento de borde izquierdo morado
    accent: 'bg-surface border border-border border-l-4 border-l-primary',
    // Card con efecto cristal para overlays
    glass: 'glass-card',
  };

  return (
    <div 
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
