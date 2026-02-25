import Link from "next/link";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme/theme-toggle";
import { Logout } from "./auth/logout-button";

const NavItems = [
  {
    label: "Jobs",
    href: "/jobs",
  },
  {
    label: "Resume",
    href: "/resume",
  },
  {
    label: "Profile",
    href: "/profile",
  },
];

export const MainNavbar = () => {
  return (
    <div className="border-b px-4 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <div className="flex items-center gap-4">
          {NavItems.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Logout />
          </div>
        </div>
      </div>
    </div>
  );
};
