"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
     ({ className, ...props }, ref) => (
          <div
               ref={ref}
               className={cn("rounded-xl border border-slate-200 bg-white p-4 shadow-sm", className)}
               {...props}
          />
     )
);
Card.displayName = "Card";

const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
     <div className={cn("mb-2 font-semibold text-lg text-slate-800", className)} {...props} />
);

const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
     <h3 className={cn("text-xl font-bold leading-none tracking-tight", className)} {...props} />
);

const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
     <div className={cn("text-slate-700 text-sm", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardContent };
