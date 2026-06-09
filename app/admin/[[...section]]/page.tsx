import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const { section: segments } = await params;
  const section = segments?.[0] ?? "overview";
  const active = section === "overview" ? "/admin" : `/admin/${section}`;
  return (
    <AdminShell active={active}>
      <AdminDashboard section={section} />
    </AdminShell>
  );
}
