import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-line-gold bg-card px-6 py-16 text-center",
        className,
      )}
    >
      {icon && <div className="mb-4 text-gold/70">{icon}</div>}
      <h3 className="font-serif text-2xl">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-[13px] text-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
