import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-input text-primary focus:ring-primary',
              className
            )}
            {...props}
          />
          {label && (
            <label htmlFor={checkboxId} className="text-sm cursor-pointer">
              {label}
            </label>
          )}
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
