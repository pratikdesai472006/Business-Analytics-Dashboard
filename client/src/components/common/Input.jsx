import { forwardRef, useId } from "react";
import { cn } from "./cn";

const Input = forwardRef(function Input(
  {
    label,
    hint,
    error,
    icon: Icon,
    trailing,
    className = "",
    containerClassName = "",
    id,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={cn("w-full", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-subtle"
            aria-hidden="true"
          />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full rounded-xl border bg-surface text-foreground",
            "placeholder:text-subtle text-sm transition-all duration-200",
            "focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary",
            Icon ? "pl-11" : "pl-4",
            trailing ? "pr-11" : "pr-4",
            error ? "border-danger" : "border-input",
            className
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {trailing}
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>
      )}
    </div>
  );
});

export default Input;
