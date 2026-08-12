import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
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
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors rounded-xl disabled:opacity-50 disabled:pointer-events-none active:scale-95 touch-manipulation';
  
  const variants = {
    primary: 'bg-primary text-bg hover:bg-primary-hover',
    secondary: 'bg-secondary text-text hover:opacity-90',
    danger: 'bg-danger text-text hover:opacity-90',
    ghost: 'bg-transparent text-text hover:bg-surface-alt',
  };

  const sizes = {
    sm: 'h-10 px-4 text-sm',
    md: 'h-12 px-6 text-base', // min 48px height for touch targets
    lg: 'h-14 px-8 text-lg',
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
