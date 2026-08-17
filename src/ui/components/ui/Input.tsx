import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, endIcon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && <label className="text-sm text-text-muted font-medium">{label}</label>}
        <div className="relative w-full">
          <input
            ref={ref}
            className={`w-full h-12 px-4 rounded-xl bg-surface border border-border text-text focus:outline-none focus:ring-1 focus:ring-primary transition-colors touch-manipulation ${error ? 'border-danger focus:ring-danger' : ''} ${endIcon ? 'pr-12' : ''} ${className}`}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-text-muted hover:text-text transition-colors">
              {endIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
