import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, endIcon, className = '', type, onChange, ...props }, ref) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        let val = e.target.value;
        if (val.includes(',')) {
          val = val.replace(/,/g, '.');
          e.target.value = val;
        }
        // Permitir solo números y un punto decimal
        if (val !== '' && !/^\d*\.?\d*$/.test(val)) {
          return; // ignora el evento si se introducen letras
        }
      }
      onChange?.(e);
    };

    const isNumber = type === 'number';

    return (
      <div className="flex flex-col gap-1 w-full relative">
        {label && <label className="text-sm text-text-muted font-medium">{label}</label>}
        <div className="relative w-full">
          <input
            ref={ref}
            type={isNumber ? 'text' : type}
            inputMode={isNumber ? 'decimal' : props.inputMode}
            onChange={handleChange}
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
