import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="page-shell empty-state">
      <Logo size={170} />
      <p className="eyebrow">404</p>
      <h1 className="display">Page<br /><span className="grad-text-lt">introuvable.</span></h1>
      <Link href="/" className="btn btn-grad">Retour à l&apos;accueil</Link>
    </main>
  );
}
