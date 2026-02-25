"use client";

import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/revola";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function SignInForm({ title = "Sign In" }: { title?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, error } = authClient.useSession();
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/jobs",
      });
    } catch (error) {
      const err = error as Error;
      console.error("Sign in error:", err.message);
      toast.error(err.message || "Unable to sign in. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    toast.error(error.message || "Login failed. Please try again.");
  }

  if (session) {
    return <Button onClick={() => router.push("/jobs")}>Go to Jobs</Button>;
  }

  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        <Button>{title}</Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-sm">
        <div className="space-y-4 overflow-y-auto">
          <ResponsiveDialogHeader className="sm:text-center">
            <ResponsiveDialogTitle>Sign In</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              to continue to platform
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Button
            variant="outline"
            className="w-full"
            type="button"
            onClick={signInWithGoogle}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner />
                Signing in...
              </>
            ) : (
              <>
                <GoogleIcon />
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-muted-foreground text-center text-xs">
            By signing up you agree to our{" "}
            <a className="underline hover:no-underline" href="#">
              Terms
            </a>
            .
          </p>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
