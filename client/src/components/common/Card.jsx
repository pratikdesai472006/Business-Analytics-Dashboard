import { cn } from "./cn";

function Card({
  children,
  className = "",
  hover = false,
  padding = "p-6",
  as: Tag = "div",
  ...props
}) {
  return (
    <Tag
      className={cn(
        "bg-card border border-border rounded-card shadow-card",
        hover &&
          "transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5",
        padding,
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ title, subtitle, action, className = "" }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-foreground text-balance">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-muted text-pretty">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export default Card;
