import type { Metadata } from "next";
import { ScannerApp } from "@/components/scanner/ScannerApp";
import { listSessions } from "@/lib/repository";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Scanner" };

// Always read live session data created in the admin.
export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN", "SCANNER"]);
  if (!user) redirect("/login?next=%2Fscan");
  const sessions = await listSessions();
  return (
    <ScannerApp
      user={user}
      sessions={sessions.map((session) => ({
        id: session.id,
        name: session.name,
        active: session.active,
        scanCount: session.scanCount,
        allowedCategories: session.allowedCategories,
      }))}
    />
  );
}
