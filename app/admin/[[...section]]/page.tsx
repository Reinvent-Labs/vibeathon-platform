import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireRole } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section: segments } = await params;
  const section = segments?.[0] ?? "overview";
  const active = section === "overview" ? "/admin" : `/admin/${section}`;
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) redirect(`/login?next=${encodeURIComponent(active)}`);
  if (section === "utilisateurs" && user.role !== "SUPER_ADMIN") {
    redirect("/admin");
  }
  if (section === "evaluation") {
    redirect("/admin/jury");
  }
  return (
    <AdminShell active={active} user={user}>
      <AdminDashboard
        section={section}
        currentRole={user.role as "SUPER_ADMIN" | "ADMIN"}
      />
    </AdminShell>
  );
}
