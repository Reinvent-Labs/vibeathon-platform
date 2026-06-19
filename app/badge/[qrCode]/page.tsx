import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Image from "next/image";
import { AuroraMesh } from "@/components/AuroraMesh";
import { Logo } from "@/components/Logo";
import { BadgeActions } from "@/components/public/BadgeActions";
import { CATEGORIES } from "@/lib/categories";
import { findParticipantByQrCode } from "@/lib/repository";

export const metadata: Metadata = { title: "Mon badge" };

export default async function BadgePage({
  params,
}: {
  params: Promise<{ qrCode: string }>;
}) {
  const { qrCode } = await params;
  const participant = await findParticipantByQrCode(qrCode);
  if (!participant || !["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"].includes(participant.status)) notFound();
  const teamName =
    "team" in participant ? participant.team?.name : participant.teamName;
  const category = CATEGORIES[participant.category ?? "HACKATHON"];

  const qrDataUrl = await QRCode.toDataURL(qrCode, {
    width: 260,
    margin: 1,
    color: { dark: "#050807", light: "#ffffff" },
  });

  return (
    <div className="page-shell">
      <AuroraMesh />
      <div className="mini-nav">
        <Logo size={145} />
        <Link href="/statut" className="back">← Mon statut</Link>
      </div>
      <div className="badge-wrap">
        <div className="badge-intro"><span className="eyebrow">Confirmé·e</span><h1 className="display">Ton pass pour<br /><span className="grad-text-lt">le jour J.</span></h1></div>
        <div className="badge" id="participant-badge" style={{ ["--cat" as string]: category.color }}>
          <div className="lanyard-hole" />
          <div className="inner">
            <div className="bmesh"><span className="bg1" /><span className="bg2" /><span className="bg3" /></div>
            <div className="content">
              <div className="topbar"><Logo size={125} /></div>
              <div className="role-pill role-pill-cat">● {category.label}</div>
              <h2 className="pname pname-cat">{participant.fullName}</h2>
              <p className="ptag">{teamName ? `Équipe · ${teamName}` : category.tagline}</p>
              <div className="qr-box"><Image src={qrDataUrl} alt={`QR code ${qrCode}`} width={220} height={220} unoptimized /></div>
              <div className="meta"><div className="lab">VIBEATHON 2026</div><div className="val">Abidjan · Côte d&apos;Ivoire</div></div>
            </div>
          </div>
          <div className="pid">{qrCode.replaceAll("-", "·")}</div>
        </div>
        <BadgeActions />
      </div>
    </div>
  );
}
