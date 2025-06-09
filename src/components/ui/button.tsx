"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "ghost" | "icon" | "danger";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, variant = "default", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    const base =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white";

    const variants: Record<string, string> = {
      default: "bg-sky-500 text-white hover:bg-sky-600 px-4 py-2",
      ghost: "bg-transparent hover:bg-slate-100 text-slate-700 px-4 py-2",
      icon: "h-8 w-8 p-0 bg-slate-300 hover:bg-slate-400 text-gray-700",
      danger: "bg-red-300 text-white hover:bg-red-400 p-2",
    };

    return (
      <Comp
        className={cn(base, variants[variant], className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
