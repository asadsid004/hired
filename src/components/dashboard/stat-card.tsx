import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  tooltip?: string;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon,
  trend,
  tooltip,
  className,
}: StatCardProps) => {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-2 rounded-lg border p-5 shadow-sm transition-all hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-sm font-medium">
            {title}
          </span>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-muted-foreground/50 cursor-help transition-colors"
                  >
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      strokeWidth={2}
                      size={15}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="text-muted-foreground/80 h-5 w-5">{icon}</div>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <h3 className="text-3xl font-semibold tracking-tight">{value}</h3>
      </div>
      {trend && (
        <p className="text-muted-foreground mt-1 text-xs">
          <span
            className={cn(
              "font-medium",
              trend.value > 0
                ? "text-emerald-500"
                : trend.value < 0
                  ? "text-red-500"
                  : "text-muted-foreground",
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>{" "}
          {trend.label}
        </p>
      )}
    </div>
  );
};
