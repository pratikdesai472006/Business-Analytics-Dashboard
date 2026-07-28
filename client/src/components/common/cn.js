// Minimal className combiner — filters out falsy values and joins with spaces.
export const cn = (...classes) => classes.filter(Boolean).join(" ");
