import { HTMLAttributes, forwardRef } from 'react';
import { motion } from 'motion/react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, children, ...props }, ref) => {
    // Omit problematic props for motion.div
    const { onAnimationStart, onDragStart, onDragEnd, onDrag, ...safeProps } = props as any;
    return (
      <motion.div
        whileHover={hoverable ? { y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } : {}}
        ref={ref}
        className={`
          bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden
          transition-all duration-300
          ${hoverable ? 'cursor-pointer' : ''}
          ${className}
        `}
        {...safeProps}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`p-6 border-b border-[var(--border)] ${className}`} {...props}>
    {children}
  </div>
);

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={` ${className}`} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = ({ className = '', children, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={` border-t border-[var(--border)] bg-[var(--surface-hover)]/30 ${className}`} {...props}>
    {children}
  </div>
);
