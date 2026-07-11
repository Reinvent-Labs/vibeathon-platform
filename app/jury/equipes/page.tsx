import type { Metadata } from "next";
import { JuryAuth } from "@/components/jury/JuryAuth";
import { JuryTeamDirectory } from "@/components/jury/JuryTeamDirectory";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Répertoire des équipes — VIBEATHON 2026" };

/** Provides jury staff with a private directory without broadening scoring scope. */
export default async function JuryTeamsPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!user) return <JuryAuth />;
  return <JuryTeamDirectory user={user} />;
}
