import { Loader2 } from "lucide-react";
import { cn } from "./cn";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-hover shadow-soft disabled:hover:bg-primary",
  secondary:
    "bg-elevated text-foreground border border-border hover:border-border-strong hover:bg-surface",
  outline:
    "border border-border text-foreground hover:bg-primary-soft hover:border-primary/40 hover:text-primary",
  ghost: "text-muted hover:bg-primary-soft hover:text-foreground",
  danger: "bg-danger text-white hover:brightness-95 shadow-soft",
  success: "bg-success text-white hover:brightness-95 shadow-soft",
};

const sizes = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
  icon: "h-11 w-11",
};

function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold",
        "transition-all duration-200 active:scale-[0.98]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="h-4 w-4" aria-hidden="true" />
      )}
      {size !== "icon" && children}
      {!loading && IconRight && (
        <IconRight className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}

export default Button;
