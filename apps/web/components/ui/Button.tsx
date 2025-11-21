import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-medium transition-all rounded-lg border hover:shadow-md active:scale-95';

  const variants = {
    primary: 'bg-primary-light dark:bg-primary-dark text-white dark:text-black border-primary-light dark:border-primary-dark hover:bg-accent-light dark:hover:bg-accent-dark',
    secondary: 'bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-900',
    ghost: 'bg-transparent text-fg-light dark:text-fg-dark border-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed active:scale-100'
    : '';

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        disabledStyles,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

