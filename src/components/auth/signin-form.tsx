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
import { GoogleIcon } from "./google-icon";

export function SignInForm({ title = "Sign In" }: { title?: string }) {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger asChild>
        <Button>{title}</Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-sm">
        <div className="space-y-4 overflow-y-auto">
          <ResponsiveDialogHeader className="sm:text-center">
            <ResponsiveDialogTitle>Sign in</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              to continue to platform
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>

          <Button variant="outline" className="w-full" type="button">
            <GoogleIcon />
            Continue with Google
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
