import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline";
};
export function Button({ className = "", variant = "solid", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "outline"
      ? "bg-white ring-1 ring-black/10 hover:bg-gray-50"
      : "bg-brand text-white hover:bg-brand-dark";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
