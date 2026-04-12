import type { Metadata } from "next";
import { ProwlClient } from "./prowl-client";

export const metadata: Metadata = {
  title: "the world prowl — winded.vertigo",
  description:
    "90 minutes of play, presence, and each other. a world prowl from winded.vertigo.",
  robots: { index: false, follow: false },
};

export default function ProwlPage() {
  return <ProwlClient />;
}
