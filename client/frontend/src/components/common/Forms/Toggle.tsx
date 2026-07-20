import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, id, ...props }, ref) => {
    const toggleId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex items-center gap-2">
        <label htmlFor={toggleId} className="relative inline-flex cursor-pointer items-center">
          <input
            id={toggleId}
            ref={ref}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'h-5 w-9 rounded-full bg-muted-foreground/30 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all',
              'peer-checked:bg-primary peer-checked:after:translate-x-full',
              className
            )}
          />
        </label>
        {label && (
          <label htmlFor={toggleId} className="text-sm cursor-pointer">
            {label}
          </label>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';
