"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) => (
     <DialogPrimitive.Overlay
          className={cn("fixed inset-0 z-40 bg-black/40 backdrop-blur-sm", className)}
          {...props}
     />
);

const DialogContent = ({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) => (
     <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
               className={cn("fixed z-50 left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg", className)}
               {...props}
          />
     </DialogPortal>
);

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
     <div className={cn("mb-4 space-y-1", className)} {...props} />
);

const DialogTitle = (props: React.ComponentProps<typeof DialogPrimitive.Title>) => (
     <DialogPrimitive.Title
          {...props}
          className={cn("text-gray-700 font-bold", props.className)}
     />
);

const DialogDescription = DialogPrimitive.Description;

export {
     Dialog,
     DialogTrigger,
     DialogContent,
     DialogHeader,
     DialogTitle,
     DialogDescription,
};

