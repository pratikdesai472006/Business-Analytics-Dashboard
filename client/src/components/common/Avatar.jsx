import { getInitials } from "../../services/format";
import { cn } from "./cn";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-24 w-24 text-3xl",
};

// Deterministic gradient based on the name so each user keeps a stable color.
const palettes = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-sky-500 to-cyan-500",
  "from-rose-500 to-pink-500",
];

function Avatar({ name = "User", size = "md", className = "" }) {
  const idx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "bg-gradient-to-br font-semibold text-white select-none",
        palettes[idx],
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  );
}

export default Avatar;
