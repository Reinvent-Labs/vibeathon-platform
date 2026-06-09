import type { Metadata } from "next";
import { ScannerApp } from "@/components/scanner/ScannerApp";

export const metadata: Metadata = { title: "Scanner" };

export default function ScanPage() {
  return <ScannerApp />;
}
