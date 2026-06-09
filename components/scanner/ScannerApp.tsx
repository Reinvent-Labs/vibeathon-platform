"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, QrCode, RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";
import { EVENT_SESSIONS } from "@/lib/constants";

type ScanResponse = {
  result: "ACCEPTED" | "DUPLICATE" | "REJECTED";
  participant: { fullName: string; profile: string; city: string } | null;
};

export function ScannerApp() {
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const [sessionId, setSessionId] = useState("demo-main-entry");
  const [manualCode, setManualCode] = useState("VBT-2026-C-0427");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [count, setCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);

  async function submitCode(qrCode: string) {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrCode, sessionId }),
    });
    const payload = await response.json();
    const data = payload.success
      ? payload.data
      : { result: "REJECTED", participant: null };
    setResult(data);
    if (data.result === "ACCEPTED") setCount((value) => value + 1);
    window.setTimeout(() => setResult(null), 2600);
  }

  async function startCamera() {
    if (cameraActive) return;
    const { Html5Qrcode } = await import("html5-qrcode");
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;
    setCameraActive(true);
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 240, height: 240 } },
      (decodedText) => {
        void submitCode(decodedText);
      },
      () => undefined,
    );
  }

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  return (
    <div className="scanner-shell">
      <header style={{ padding: 20 }} className="stack">
        <div className="cluster" style={{ justifyContent: "space-between" }}><Logo size={135} /><span className="status-pill">Staff · Scanner</span></div>
        <label>Session active
          <select className="select" value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
            <option value="demo-main-entry">{EVENT_SESSIONS[0]}</option>
            {EVENT_SESSIONS.slice(1).map((session, index) => <option value={`demo-session-${index + 1}`} key={session}>{session}</option>)}
          </select>
        </label>
      </header>
      <div className="scanner-camera">
        <div id="qr-reader" style={{ position: "absolute", inset: 0 }} />
        {!cameraActive ? <div className="scanner-reticle" /> : null}
        {result ? (
          <div className={`scan-result ${result.result === "ACCEPTED" ? "success" : result.result === "DUPLICATE" ? "duplicate" : "error"}`}>
            <div><h2 className="display">{result.result === "ACCEPTED" ? "Présent·e" : result.result === "DUPLICATE" ? "Déjà scanné" : "Non trouvé"}</h2><p>{result.participant?.fullName ?? "QR code invalide"}</p><span>{result.participant?.profile} {result.participant?.city ? `· ${result.participant.city}` : ""}</span></div>
          </div>
        ) : null}
      </div>
      <footer className="stack" style={{ padding: 20 }}>
        <div className="cluster" style={{ justifyContent: "space-between" }}><div><small>Scannés · session</small><strong className="grad-text-lt" style={{ display: "block", fontSize: 28 }}>{count} / 400</strong></div><button className="btn btn-ghost" onClick={() => setCount(0)}><RotateCcw size={17} /> Reset</button></div>
        <button className="btn btn-grad btn-block" onClick={() => void startCamera()}><QrCode size={18} /> Activer la caméra</button>
        <form className="cluster" onSubmit={(event) => { event.preventDefault(); void submitCode(manualCode); }}>
          <input className="input" value={manualCode} onChange={(event) => setManualCode(event.target.value)} aria-label="Code du badge" />
          <button className="btn btn-ghost"><Keyboard size={18} /> Valider</button>
        </form>
      </footer>
    </div>
  );
}
