"use client";

import { SessionProvider } from "next-auth/react";
import PwaInstall from "@/components/pwa-install";
import { ModeProvider } from "@/components/ui/mode-provider";
import type { UiMode } from "@/components/ui/mode-provider";

export default function Providers({
  children,
  initialUiMode = "grownup",
}: {
  children: React.ReactNode;
  initialUiMode?: UiMode;
}) {
  return (
    <SessionProvider basePath="/harbour/creaseworks/api/auth">
      <ModeProvider initialMode={initialUiMode}>
        {children}
        <PwaInstall />
      </ModeProvider>
    </SessionProvider>
  );
}
