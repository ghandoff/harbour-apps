import Link from "next/link";
import { Wordmark } from "./_components/wordmark";

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full surface-champagne flex items-center justify-center px-6 py-24">
      <Wordmark />

      <div className="max-w-3xl w-full">
        <p className="text-sm tracking-widest text-[color:var(--color-cadet)]/70 mb-6">
          a winded.vertigo tool
        </p>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-[1.05]">
          co-design the rubric.<br />
          <span className="text-[color:var(--color-sienna)]">with the class.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[color:var(--color-cadet)] mb-4 max-w-2xl">
          students propose what counts as good, vote on what stays, write the scale in
          their own words, then calibrate on a real artefact before anything gets graded.
        </p>

        <p className="text-base text-[color:var(--color-cadet)]/80 mb-12 max-w-2xl">
          you frame the outcome. they do the rest. seven steps, about thirty minutes,
          a rubric the room owns.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/new"
            className="btn-primary inline-flex items-center justify-center text-base"
          >
            start a co-design session
          </Link>
          <Link
            href="/watch"
            className="btn-secondary inline-flex items-center justify-center text-base"
          >
            watch it unfold
          </Link>
        </div>

        <p className="text-xs text-[color:var(--color-cadet)]/60 mt-16 max-w-md">
          no sign-up. no accounts. a room code, a link, and your class.
        </p>
      </div>
    </main>
  );
}
