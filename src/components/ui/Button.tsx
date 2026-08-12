import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'highlight';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  
  const baseStyles = [
    'inline-flex items-center justify-center font-semibold',
    'transition-all duration-150 rounded-xl',
    'disabled:opacity-40 disabled:pointer-events-none',
    'active:scale-95 select-none',
  ].join(' ');
  
  const variants = {
    // Morado estructural — acciones secundarias, navegación
    primary: 'bg-primary text-white hover:bg-primary-hover',
    secondary: 'bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30',
    // Naranja — SOLO acciones de atención máxima (Finalizar, confirmar serie)
    highlight: 'bg-highlight text-white hover:bg-highlight-hover glow-highlight',
    // Estados
    danger: 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/30',
    ghost: 'bg-transparent text-text-muted hover:text-text hover:bg-surface-alt',
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm gap-1.5',
    md: 'h-14 px-5 text-base gap-2',   // 56px — mínimo cómodo con guantes/sudor
    lg: 'h-16 px-8 text-lg gap-2',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
