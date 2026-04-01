import Link from "next/link";
import { JoinForm } from "@/components/join-form";

export default function HomePage() {
  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        {/* brand */}
        <p className="text-5xl mb-4">🛶</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          raft.house
        </h1>
        <p className="text-sm text-[var(--rh-text-muted)] mb-10">
          use it to cross, then let it go.
        </p>

        {/* join form */}
        <JoinForm />

        {/* facilitator link */}
        <div className="mt-12 pt-8 border-t border-black/10">
          <p className="text-xs text-[var(--rh-text-muted)] mb-3">
            running a session?
          </p>
          <Link
            href="/facilitate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--rh-teal)] text-white text-sm font-semibold hover:bg-[var(--rh-deep)] transition-colors"
          >
            open facilitator dashboard
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
