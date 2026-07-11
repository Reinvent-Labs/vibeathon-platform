import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JuryResults } from "@/components/jury/JuryResults";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Résultats — VIBEATHON 2026" };

export default async function JuryResultsPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!user) redirect("/jury");
  return <JuryResults user={user} />;
}
