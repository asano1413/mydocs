"use client";

import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;
const AlertDialogOverlay = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) => (
     <AlertDialogPrimitive.Overlay
          className={cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-sm", className)}
          {...props}
     />
);

const AlertDialogContent = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) => (
     <AlertDialogPortal>
          <AlertDialogOverlay />
          <AlertDialogPrimitive.Content
               className={cn("fixed z-50 left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg", className)}
               {...props}
          />
     </AlertDialogPortal>
);

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
     <div className={cn("mb-4 space-y-1", className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
     <div className={cn("mt-6 flex justify-end gap-2", className)} {...props} />
);

const AlertDialogTitle = AlertDialogPrimitive.Title;
const AlertDialogDescription = AlertDialogPrimitive.Description;
const AlertDialogAction = AlertDialogPrimitive.Action;
const AlertDialogCancel = AlertDialogPrimitive.Cancel;

export {
     AlertDialog,
     AlertDialogTrigger,
     AlertDialogContent,
     AlertDialogHeader,
     AlertDialogFooter,
     AlertDialogTitle,
     AlertDialogDescription,
     AlertDialogAction,
     AlertDialogCancel,
};
