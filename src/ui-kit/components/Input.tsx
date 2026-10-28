import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  endIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, endIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative w-full">
          <input
            ref={ref}
            className={`
              w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg 
              text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]
              transition-all duration-200
              ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}
              ${endIcon ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] flex items-center justify-center cursor-pointer hover:text-[var(--text-primary)] transition-colors">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
