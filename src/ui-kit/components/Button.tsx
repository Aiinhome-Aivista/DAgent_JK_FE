import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]',
      secondary: 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]',
      outline: 'bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
      ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    // Omit problematic props for motion.button
    const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safeProps } = props as any;

    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...safeProps}
      />
    );
  }
);

Button.displayName = 'Button';
