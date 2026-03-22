"use client";

/**
 * MaterialPickerHero — interactive material icon grid for the
 * logged-out landing page hero. Tapping an icon navigates to
 * /find?material=[slug] so visitors land directly in the
 * system-of-play without signing up.
 *
 * Receives material data as props (server-fetched, no client fetch).
 */

import { useRouter } from "next/navigation";
import Image from "next/image";
import { materialSlug } from "@/lib/queries/materials";

interface HeroMaterial {
  id: string;
  title: string;
  emoji: string | null;
  icon: string | null;
  form_primary: string | null;
}

interface MaterialPickerHeroProps {
  materials: HeroMaterial[];
}

/** Form → subtle background tint for the icon cell */
const FORM_TINTS: Record<string, string> = {
  cylinder:  "rgba(67, 177, 135, 0.08)",
  flat:      "rgba(88, 114, 203, 0.08)",
  flexible:  "rgba(203, 120, 88, 0.08)",
  rigid:     "rgba(39, 50, 72, 0.08)",
  sphere:    "rgba(213, 210, 255, 0.10)",
  granular:  "rgba(67, 72, 36, 0.08)",
  liquid:    "rgba(88, 203, 178, 0.08)",
  malleable: "rgba(203, 120, 88, 0.08)",
};

export default function MaterialPickerHero({ materials }: MaterialPickerHeroProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4" style={{ maxWidth: 480 }}>
      {materials.map((m, i) => {
        const slug = materialSlug(m.title);
        const tint = FORM_TINTS[m.form_primary ?? ""] ?? "rgba(255,235,210,0.06)";
        return (
          <button
            key={m.id}
            onClick={() => router.push(`/find?material=${slug}`)}
            className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: tint,
              border: "1px solid rgba(255,235,210,0.08)",
              animation: `heroTileIn 400ms ${i * 50}ms cubic-bezier(0.34, 1.56, 0.64, 1) both`,
            }}
            aria-label={`find playdates using ${m.title}`}
          >
            <span className="flex items-center justify-center" style={{ width: 48, height: 48 }}>
              {m.icon ? (
                <Image
                  src={`/harbour/creaseworks/icons/materials/${m.icon}`}
                  alt=""
                  width={48}
                  height={48}
                  className="object-contain"
                />
              ) : (
                <span className="text-3xl leading-none">{m.emoji ?? "🧱"}</span>
              )}
            </span>
            <span
              className="text-2xs font-medium leading-tight text-center"
              style={{ color: "rgba(255,235,210,0.7)" }}
            >
              {m.title}
            </span>
          </button>
        );
      })}

      <style>{`
        @keyframes heroTileIn {
          from { opacity: 0; transform: scale(0.85) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes heroTileIn { from, to { opacity: 1; transform: none; } }
        }
      `}</style>
    </div>
  );
}
