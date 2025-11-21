import { type InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-medium text-sm mb-1 text-fg-light dark:text-fg-dark">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 rounded-lg border bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark border-border-light dark:border-border-dark focus:border-primary-light dark:focus:border-primary-dark focus:ring-2 focus:ring-primary-light/20 dark:focus:ring-primary-dark/20 transition-all',
            error && 'border-primary-light dark:border-primary-dark',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-primary-light dark:text-primary-dark">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

