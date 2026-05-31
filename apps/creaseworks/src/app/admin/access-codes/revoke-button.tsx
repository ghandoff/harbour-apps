"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  codeId: string;
  codeStr: string;
}

export function RevokeButton({ codeId, codeStr }: Props) {
  const router = useRouter();
  const [revoking, setRevoking] = useState(false);

  async function handleRevoke() {
    if (!confirm(`revoke code ${codeStr}? this cannot be undone.`)) return;
    setRevoking(true);
    try {
      await fetch("/api/admin/access-codes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: codeId }),
      });
      router.refresh();
    } finally {
      setRevoking(false);
    }
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={revoking}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {revoking ? "revoking…" : "revoke"}
    </button>
  );
}
