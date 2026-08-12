import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && <label className="text-sm text-text-muted font-medium">{label}</label>}
        <input
          ref={ref}
          className={`h-12 px-4 rounded-xl bg-surface border border-border text-text focus:outline-none focus:ring-1 focus:ring-primary transition-colors touch-manipulation ${error ? 'border-danger focus:ring-danger' : ''} ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
