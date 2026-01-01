import { Logo } from "@/components/logo";
import React from "react";

const OnboardingLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Logo href="/" className="mb-10 justify-center" />
      {children}
    </div>
  );
};

export default OnboardingLayout;
