import { SignInForm } from "@/components/auth/signin-form";
import { Logo } from "@/components/logo";
import { Navbar } from "@/components/navbar";
import {
  BriefcaseIcon,
  File02Icon,
  MicIcon,
  BrainIcon,
  ArrowRightIcon,
  ArrowRight02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    icon: BriefcaseIcon,
    title: "Smart Job Discovery",
    description:
      "AI scans thousands of listings to surface roles that match your skills and ambitions — no noise, no guesswork.",
    label: "DISCOVER",
    href: "/jobs",
  },
  {
    icon: File02Icon,
    title: "Resume Optimizer",
    description:
      "Job-specific suggestions to tailor your resume with the right keywords and phrasing that beat ATS filters.",
    label: "OPTIMIZE",
    href: "/resume",
  },
  {
    icon: MicIcon,
    title: "Voice Mock Interviews",
    description:
      "Practice with a realistic AI interviewer, receive real-time feedback on delivery, and review a full performance report.",
    label: "PRACTICE",
    href: "/practice",
  },
  {
    icon: BrainIcon,
    title: "Interview Preparation",
    description:
      "Role-specific questions curated from real interview pools, with detailed scoring and improvement tips.",
    label: "PREPARE",
    href: "/interview",
  },
];

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative px-6 pt-16 pb-0 md:pt-24">
        <div className="mx-auto max-w-7xl">
          {/* Top line: tagline + description side by side */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-end md:gap-12">
            <div>
              <p className="text-primary dark:text-primary/80 mb-6 text-sm font-medium tracking-[0.2em] uppercase">
                AI-Powered Career Platform
              </p>
              <h1 className="text-[clamp(3.5rem,6vw,4.5rem)] leading-[1.02] font-light tracking-tight md:text-[clamp(2.5rem,6vw,5.5rem)]">
                No More Solo
                <br />
                <span className="font-semibold">Job Hunting.</span>
              </h1>
            </div>
            <div className="max-w-md pb-2 md:ml-auto">
              <p className="text-muted-foreground mb-6 text-base leading-relaxed md:mb-8 md:text-lg">
                Discover the perfect job, optimize your resume, and ace every
                interview — with an AI co-pilot that works tirelessly for your
                career.
              </p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <SignInForm title="Get Started" />
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                >
                  Learn more
                  <HugeiconsIcon
                    icon={ArrowRightIcon}
                    strokeWidth={2}
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Hero image - full width editorial image */}
          <div className="mt-14 overflow-hidden rounded-2xl md:mt-20">
            <div className="relative aspect-21/9 w-full">
              <Image
                src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2940&auto=format&fit=crop"
                alt="Modern workspace"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1280px"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />
              {/* Bottom-left info chip */}
              <div className="absolute bottom-6 left-6 flex items-center gap-3">
                <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-medium tracking-wide text-black backdrop-blur-sm dark:bg-white/90 dark:text-black">
                  YOUR CAREER, REIMAGINED
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee / Ticker ── */}
      <section className="border-border/60 mt-12 border-y py-5 md:mt-24">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-y-3 px-6 sm:grid-cols-2 sm:text-center md:grid-cols-4">
          {[
            "JOB SEARCH",
            "RESUME BUILDING",
            "MOCK INTERVIEWS",
            "ATS OPTIMIZATION",
          ].map((item) => (
            <span
              key={item}
              className="text-primary dark:text-primary/80 text-sm font-medium tracking-[0.15em]"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-6 py-16 md:py-32">
        <div className="mx-auto max-w-7xl">
          {/* Section header - editorial style */}
          <div className="mb-12 grid gap-5 md:mb-20">
            <div>
              <p className="text-primary dark:text-primary/80 mb-4 text-sm font-medium tracking-[0.2em] uppercase">
                What we offer
              </p>
              <h2 className="text-4xl leading-[1.1] font-light tracking-tight md:text-5xl">
                Your full career toolkit,{" "}
                <span className="font-semibold">powered by AI.</span>
              </h2>
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              Four powerful tools working together — so you can focus on showing
              up, not searching around.
            </p>
          </div>

          {/* Feature grid - editorial bento */}
          <div className="border-border/70 bg-border/50 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2">
            {features.map(({ icon: Icon, title, description, label, href }) => (
              <div
                key={title}
                className="group bg-card hover:bg-accent/40 flex flex-col justify-between p-8 transition-colors duration-300 md:p-10"
              >
                <div>
                  <div className="mb-8 flex items-center justify-between">
                    <span className="text-primary dark:text-primary/80 text-xs font-medium tracking-[0.2em]">
                      {label}
                    </span>
                    <div className="bg-foreground/5 text-foreground/70 group-hover:bg-foreground/10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300">
                      <HugeiconsIcon
                        icon={Icon}
                        strokeWidth={1.5}
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                  <h3 className="mb-3 text-xl font-semibold tracking-tight">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
                <div className="mt-8">
                  <Link
                    href={href}
                    className="text-foreground/70 group-hover:text-foreground inline-flex items-center gap-2 text-sm font-medium transition-colors duration-300"
                  >
                    Explore
                    <HugeiconsIcon
                      icon={ArrowRight02Icon}
                      strokeWidth={2}
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Split Section: About ── */}
      <section className="px-6 py-16 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
            {/* Image */}
            <div className="relative order-2 overflow-hidden rounded-2xl md:order-1">
              <div className="relative aspect-7/8">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2940&auto=format&fit=crop"
                  alt="Team collaborating"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              </div>
            </div>

            {/* Content */}
            <div className="order-1 md:order-2">
              <p className="text-primary dark:text-primary/80 mb-4 text-sm font-medium tracking-[0.2em] uppercase">
                About
              </p>
              <h2 className="mb-6 text-3xl leading-[1.15] font-light tracking-tight md:text-4xl">
                Hired unlocks a faster,
                <br />
                <span className="font-semibold">smarter way to get hired.</span>
              </h2>
              <p className="text-muted-foreground mb-8 text-base leading-relaxed">
                With just a prompt, you can bring any career goal to life
                instantly, cut down preparation time, eliminate repetitive
                tasks, and stay fully in control of your job search.
              </p>
              <div className="space-y-4">
                {[
                  "AI-powered job matching across thousands of listings",
                  "Resume optimization that beats ATS filters",
                  "Realistic voice mock interviews with feedback",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm">
                    <span className="bg-foreground text-background mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <SignInForm title="Launch now →" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-16 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="bg-foreground/85 text-background relative overflow-hidden rounded-2xl px-6 py-16 sm:px-8 md:px-16 md:py-24">
            {/* Background image with overlay */}
            <Image
              src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2940&auto=format&fit=crop"
              alt=""
              fill
              className="object-cover opacity-20 mix-blend-overlay"
              sizes="1280px"
            />
            <div className="relative z-10 grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center">
              <div>
                <p className="mb-4 text-xs font-medium tracking-[0.2em] uppercase opacity-70">
                  Ready to start?
                </p>
                <h2 className="text-3xl leading-[1.1] font-extralight tracking-tight md:text-5xl">
                  Your next job <br />
                  <span className="font-semibold">is waiting.</span>
                </h2>
              </div>
              <div className="md:ml-auto md:text-right">
                <p className="mb-8 max-w-sm text-base leading-relaxed opacity-70 md:ml-auto">
                  Join thousands of professionals who used Hired to land roles
                  they love — in half the time.
                </p>
                <SignInForm title="Get Started — It's Free" />
                <p className="mt-4 text-xs opacity-70">
                  No credit card required · Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-border/60 border-t">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand */}
            <div className="md:col-span-2 lg:col-span-3">
              <div className="mb-4 flex items-center gap-2">
                <Logo />
              </div>
              <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                Your AI-powered career companion. Find the right jobs, perfect
                your resume, and ace every interview.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 md:col-span-2">
              {/* Product */}
              <div>
                <h3 className="mb-4 text-xs font-medium tracking-[0.15em] uppercase">
                  Product
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  {[
                    "Job Search",
                    "Resume Optimizer",
                    "Mock Interviews",
                    "Career Insights",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="hover:text-foreground transition-colors duration-150"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="mb-4 text-xs font-medium tracking-[0.15em] uppercase">
                  Company
                </h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  {[
                    "About",
                    "Privacy Policy",
                    "Terms of Service",
                    "Contact",
                  ].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="hover:text-foreground transition-colors duration-150"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-border/60 mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Hired. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
