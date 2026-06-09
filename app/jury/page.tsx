import type { Metadata } from "next";
import { JuryPortal } from "@/components/jury/JuryPortal";

export const metadata: Metadata = { title: "Espace jury" };

export default function JuryPage() {
  return <JuryPortal />;
}
