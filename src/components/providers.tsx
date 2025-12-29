import React from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { QueryProvider } from "@/components/query-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster richColors closeButton />
        <QueryProvider>{children}</QueryProvider>
      </ThemeProvider>
    </div>
  );
};
