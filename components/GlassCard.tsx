import { HTMLAttributes } from "react";

type Variant = "default" | "strong" | "dark";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  as?: "div" | "section" | "article";
}

const variantClass: Record<Variant, string> = {
  default: "glass",
  strong: "glass-strong",
  dark: "glass-dark",
};

export function GlassCard({
  variant = "default",
  as: Tag = "div",
  className = "",
  children,
  ...rest
}: GlassCardProps) {
  return (
    <Tag className={`${variantClass[variant]} rounded-3xl ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
