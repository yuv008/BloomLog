"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function Sheet({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/20 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[28px] glass-card p-6 pb-10",
            "data-[state=open]:animate-in data-[state=closed]:animate-out"
          )}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-beige" />
          {title && (
            <Dialog.Title className="font-display text-xl text-ink mb-4">
              {title}
            </Dialog.Title>
          )}
          {children}
          <Dialog.Close className="absolute right-4 top-4 rounded-full p-2 text-whisper hover:bg-beige/50">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
