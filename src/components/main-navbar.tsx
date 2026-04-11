"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useEffectEvent } from "react";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme/theme-toggle";
import { Logout } from "./auth/logout-button";

const NavItems = [
  { label: "Jobs", href: "/jobs" },
  { label: "Resume", href: "/resume" },
  { label: "Practice", href: "/practice" },
  { label: "Profile", href: "/profile" },
];

export const MainNavbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const setIsOpenEvent = useEffectEvent((value: boolean) => {
    setIsOpen(value);
  });

  // Close on route change
  useEffect(() => {
    setIsOpenEvent(false);
  }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Navbar */}
      <header className="border-border/50 bg-background/80 supports-backdrop-filter:bg-background/60 sticky top-0 z-60 border-b backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Logo />

          {/* Desktop nav */}
          <div className="flex gap-4">
            <nav className="hidden items-center gap-1 md:flex">
              {NavItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={[
                    "relative rounded-md px-3 py-1.5 font-medium transition-colors duration-150",
                    isActive(item.href)
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  ].join(" ")}
                >
                  {isActive(item.href) && (
                    <span className="bg-accent absolute inset-0 rounded-md" />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* Desktop actions */}
            <div className="hidden items-center gap-2 md:flex">
              <ThemeToggle />
              <Logout />
            </div>
          </div>

          {/* Mobile: actions + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              aria-label={isOpen ? "Close menu" : "Open menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
              className="hover:bg-accent hover:text-foreground relative flex h-9 w-9 items-center justify-center rounded-md transition-colors"
            >
              {/* Animated hamburger → X */}
              <span className="sr-only">{isOpen ? "Close" : "Menu"}</span>
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <line
                  x1="4"
                  y1="7"
                  x2="20"
                  y2="7"
                  className={`origin-center transition-transform duration-300 ${isOpen ? "translate-y-[5px] rotate-45" : ""}`}
                  style={{ transformBox: "fill-box" }}
                />
                <line
                  x1="4"
                  y1="12"
                  x2="20"
                  y2="12"
                  className={`transition-opacity duration-200 ${isOpen ? "opacity-0" : "opacity-100"}`}
                />
                <line
                  x1="4"
                  y1="17"
                  x2="20"
                  y2="17"
                  className={`origin-center transition-transform duration-300 ${isOpen ? "-translate-y-[5px] -rotate-45" : ""}`}
                  style={{ transformBox: "fill-box" }}
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay backdrop */}
      <div
        aria-hidden="true"
        onClick={() => setIsOpen(false)}
        className={[
          "bg-background/60 fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      {/* Mobile slide-down menu */}
      <div
        className={[
          "border-border/50 bg-background/90 fixed top-16 right-0 left-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ease-in-out md:hidden",
          isOpen
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto max-w-7xl px-4 py-3">
          <ul className="flex flex-col gap-1">
            {NavItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={[
                    "flex rounded-md px-3 py-2.5 font-medium transition-colors duration-150",
                    isActive(item.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            <li className="border-border/50 mt-2 border-t pt-3">
              <Logout className="w-full" />
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};
