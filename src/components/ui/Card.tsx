import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-card", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-panel border border-line bg-card p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHead({
  title,
  action,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-[18px] flex items-center justify-between", className)}>
      <h3 className="font-serif text-[22px] font-medium">{title}</h3>
      {action}
    </div>
  );
}
