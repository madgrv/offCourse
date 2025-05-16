'use client';
// Simple Select component using Radix UI
import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';

export interface Option {
  label: string;
  value: string;
}

interface SimpleSelectProps {
  options: Option[];
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}

const Select = React.forwardRef<HTMLButtonElement, SimpleSelectProps>(
  (
    {
      options,
      placeholder,
      value,
      onValueChange,
      disabled = false,
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) => {
    // Ensure we have valid options
    const safeOptions = options || [];

    return (
      <SelectPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex w-full items-center justify-between rounded border px-3 py-2 bg-background text-sm',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          aria-label={ariaLabel}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className='ml-2 h-4 w-4' />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className='z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
            position='popper'
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className='p-1'>
              {safeOptions.length === 0 ? (
                <div className='text-sm py-2 px-2 text-center text-muted-foreground'>
                  No options available
                </div>
              ) : (
                safeOptions.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                      'focus:bg-accent focus:text-accent-foreground',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                    )}
                  >
                    <span className='absolute left-2 flex h-3.5 w-3.5 items-center justify-center'>
                      <SelectPrimitive.ItemIndicator>
                        <Check className='h-4 w-4' />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>
                      {option.label}
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);
Select.displayName = 'Select';

export default Select;
