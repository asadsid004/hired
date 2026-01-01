import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const Logo = ({
  href = "/dashboard",
  className,
}: {
  href?: string;
  className?: string;
}) => {
  return (
    <Link href={href} className={cn("flex items-center", className)}>
      <Image
        src={"/logo.svg"}
        alt="Logo"
        width={30}
        height={30}
        className="h-8 w-8"
        priority
      />
      <span className="ml-0.5 text-3xl font-bold tracking-tight">Hired</span>
    </Link>
  );
};
