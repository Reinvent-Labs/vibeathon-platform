import type { Metadata } from "next";
import { JuryPortal } from "@/components/jury/JuryPortal";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Espace jury" };

export default async function JuryPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!user) redirect("/login?next=%2Fjury");
  return <JuryPortal user={user} />;
}
