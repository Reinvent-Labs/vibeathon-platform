import type { Metadata } from "next";
import { JuryPortal } from "@/components/jury/JuryPortal";
import { JuryAuth } from "@/components/jury/JuryAuth";
import { requireRole } from "@/lib/auth";

export const metadata: Metadata = { title: "Espace jury — VIBEATHON 2026" };

export default async function JuryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!user) {
    const { error } = await searchParams;
    return <JuryAuth errorParam={error} />;
  }
  return <JuryPortal user={user} />;
}
