import { ThemeToggle } from "./theme/theme-toggle";
import { Logo } from "./logo";
import { SignInForm } from "./auth/signin-form";

export const Navbar = () => {
  return (
    <nav className="border-muted-foreground/30 border-b">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <Logo href="/" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <SignInForm />
          </div>
        </div>
      </div>
    </nav>
  );
};
