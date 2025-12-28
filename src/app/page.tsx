import { SignInForm } from "@/components/auth/signin-form";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <Navbar />
      <div className="flex max-w-2xl mx-auto h-full flex-1 flex-col items-center justify-center px-4">
        <div className="border-primary/10 bg-primary/5 text-primary mb-8 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm">
          <span className="mr-2">🚀</span> AI-powered job search & career growth
        </div>
        <h1 className="text-center font-light text-4xl tracking-tight">
          No More Solo Job Hunting.
          <span className="block font-semibold italic text-5xl md:text-6xl">
            Do it with AI.
          </span>
        </h1>
        <p className="my-8 text-center text-lg">
          Discover the perfect job, optimize your resume, and ace your
          interviews with our intelligent career platform.
        </p>
        <SignInForm title="Start Search" />
      </div>
    </main>
  );
}
