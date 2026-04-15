import type { Metadata } from "next";
import { AnxietyMapClient } from "./anxiety-map-client";

export const metadata: Metadata = {
  title: "anxiety map — winded.vertigo",
  description:
    "map anxiety triggers and find the ones that matter most. an interactive tool based on network analysis research.",
  robots: { index: false, follow: false },
};

export default function AnxietyMapPage() {
  return <AnxietyMapClient />;
}
