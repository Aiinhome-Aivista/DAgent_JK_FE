import React, { ReactNode } from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  children?: ReactNode;
  className?: string;
}

export const Badge = ({ className = '', variant = 'primary', children, ...props }: BadgeProps) => {
  const baseStyles = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider';
  
  const variants = {
    primary: 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20',
    secondary: 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]',
    outline: 'bg-transparent text-[var(--text-secondary)] border border-[var(--border)]',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    />
  );
};
