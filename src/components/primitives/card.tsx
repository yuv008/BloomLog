import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("glass-card min-w-0 max-w-full p-5 md:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
