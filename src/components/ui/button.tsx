import * as React from "react";

type ButtonVariant = "solid" | "outline" | "ghost";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ className = "", variant = "solid", ...props }: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<ButtonVariant, string> = {
    solid: "bg-brand text-white hover:bg-brand-dark",
    outline: "bg-white ring-1 ring-black/10 hover:bg-gray-50",
    ghost: "bg-transparent hover:bg-gray-100 text-brand",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
