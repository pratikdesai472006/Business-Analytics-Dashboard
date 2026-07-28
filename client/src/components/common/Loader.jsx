import { Loader2 } from "lucide-react";
import { cn } from "./cn";

function Loader({ label = "Loading", fullscreen = false, className = "" }) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm font-medium text-muted">{label}…</span>
      <span className="sr-only" role="status">
        {label}
      </span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export function Skeleton({ className = "" }) {
  return <div className={cn("skeleton rounded-lg", className)} aria-hidden="true" />;
}

export default Loader;
