import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export const SectionCard = ({
  title,
  description,
  children,
  className,
  action,
}: SectionCardProps) => {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col rounded-lg border shadow-sm",
        className,
      )}
    >
      <div className="flex flex-row items-center justify-between border-b px-6 py-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg leading-none font-semibold tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
};
