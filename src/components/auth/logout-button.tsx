"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout05Icon } from "@hugeicons/core-free-icons";

export function Logout({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoading(true);

      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Logged out successfully", {
              description: "You have been signed out of your account.",
            });
            router.push("/");
          },
          onError: (ctx) => {
            toast.error("Logout failed", {
              description:
                ctx.error.message || "Unable to log out. Please try again.",
            });
          },
        },
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Something went wrong", {
        description: "Please try again later.",
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      className={className}
      variant="outline"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          Logging out... <Spinner />
        </>
      ) : (
        <>
          <HugeiconsIcon
            icon={Logout05Icon}
            strokeWidth={2}
            className="size-4"
          />{" "}
          Logout
        </>
      )}
    </Button>
  );
}
