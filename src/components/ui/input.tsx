"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
     extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
     return (
          <input
               ref={ref}
               className={cn(
                    "flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                    className
               )}
               {...props}
          />
     );
});
Input.displayName = "Input";

export { Input };