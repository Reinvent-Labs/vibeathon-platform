import Link from "next/link";
import {
  Bot,
  ClipboardList,
  LayoutDashboard,
  Mail,
  QrCode,
  Settings,
  Star,
  Users,
  UserRoundCog,
} from "lucide-react";
import { Logo } from "@/components/Logo";

const navigation = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/candidatures", label: "Candidatures", icon: ClipboardList },
  { href: "/admin/participants", label: "Participants", icon: Users },
  { href: "/admin/equipes", label: "Équipes", icon: Users },
  { href: "/admin/presence", label: "Présence", icon: QrCode },
  { href: "/admin/evaluation", label: "Évaluation IA", icon: Bot },
  { href: "/admin/jury", label: "Jury & Scores", icon: Star },
  { href: "/admin/communications", label: "Communications", icon: Mail },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: UserRoundCog },
] as const;

export function AdminShell({
  active,
  children,
}: {
  active: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <aside className="side">
        <Logo size={155} className="brand" />
        <nav>
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link href={href} className={active === href ? "active" : ""} key={href}>
              <Icon className="ic" size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="user">
          <div className="av">NO</div>
          <div><b>Nelly Ossey</b><span>Super admin</span></div>
        </div>
      </aside>
      <main className="main">{children}</main>
      <nav className="admin-mobile-nav" aria-label="Navigation admin mobile">
        {navigation.slice(0, 7).map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}><Icon size={18} />{label.split(" ")[0]}</Link>
        ))}
      </nav>
    </div>
  );
}
