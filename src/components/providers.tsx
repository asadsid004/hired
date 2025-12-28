import React from "react";
import { Toaster } from "sonner";

import { ThemeProvider } from "@/components/theme/theme-provider";

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
        {children}
      </ThemeProvider>
    </div>
  );
};
