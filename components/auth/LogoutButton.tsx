"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type StaffLogoutDestination = "/login" | "/jury" | "/scan";

/** Ends the current staff session and returns to the appropriate portal entry point. */
export function LogoutButton({
  compact = false,
  redirectTo = "/login",
}: {
  compact?: boolean;
  redirectTo?: StaffLogoutDestination;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Déconnexion impossible.");
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Déconnexion impossible.",
      );
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "btn btn-ghost"}
      aria-label="Se déconnecter"
      disabled={loading}
      onClick={() => void logout()}
    >
      <LogOut size={17} />
      {compact ? null : loading ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}
