import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'filled';
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
  const baseStyles = 'rounded-lg border transition-all';

  const variants = {
    default: 'bg-bg-light dark:bg-bg-dark border-border-light dark:border-border-dark shadow-sm hover:shadow-md',
    outlined: 'bg-transparent border-border-light dark:border-border-dark',
    filled: 'bg-primary-light/10 dark:bg-primary-dark/10 border-primary-light dark:border-primary-dark',
  };

  return (
    <div
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

