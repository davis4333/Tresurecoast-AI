export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80">
          Treasure Coast AI • Foundation Build
        </div>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Capture leads while you sleep.
        </h1>

        <p className="text-pretty text-lg text-white/70">
          Foundation build for Treasure Coast AI: Next.js 14 + TypeScript strict + Tailwind. No auth, no
          database, no payments — just a clean, production-grade base.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90">
            Get Started
          </button>
          <button className="rounded-md border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10">
            Learn More
          </button>
        </div>
      </div>
    </main>
  );
}
