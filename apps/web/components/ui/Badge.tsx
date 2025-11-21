import { type HTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: 'default' | 'primary';
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2 py-1 font-medium text-xs rounded-full border';

  const variants = {
    default: 'bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark border-border-light dark:border-border-dark',
    primary: 'bg-primary-light dark:bg-primary-dark text-white dark:text-black border-primary-light dark:border-primary-dark',
  };

  return (
    <span
      className={clsx(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}

