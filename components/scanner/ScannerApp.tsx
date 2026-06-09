"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CameraOff, Keyboard, Maximize, Minimize, QrCode, RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";

type ScanResponse = {
  result: "ACCEPTED" | "DUPLICATE" | "REJECTED";
  participant: { fullName: string; profile: string; city: string } | null;
};

type SessionOption = { id: string; name: string; active: boolean };

export function ScannerApp({ sessions }: { sessions: SessionOption[] }) {
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const initialSession = sessions.find((s) => s.active)?.id ?? sessions[0]?.id ?? "";
  const [sessionId, setSessionId] = useState(initialSession);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [count, setCount] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const submitCode = useCallback(
    async (qrCode: string) => {
      const trimmed = qrCode.trim();
      if (!trimmed || !sessionId) return;
      // Debounce repeated decodes of the same QR within 3s.
      const now = Date.now();
      if (lastScanRef.current.code === trimmed && now - lastScanRef.current.at < 3000) {
        return;
      }
      lastScanRef.current = { code: trimmed, at: now };

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ qrCode: trimmed, sessionId }),
        });
        const payload = await response.json();
        const data: ScanResponse = payload.success
          ? payload.data
          : { result: "REJECTED", participant: null };
        setResult(data);
        if (data.result === "ACCEPTED") setCount((value) => value + 1);
        if (navigator.vibrate) navigator.vibrate(data.result === "ACCEPTED" ? 60 : [40, 40, 40]);
      } catch {
        setResult({ result: "REJECTED", participant: null });
      }
      window.setTimeout(() => setResult(null), 2400);
    },
    [sessionId],
  );

  async function startCamera() {
    if (cameraActive) return;
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (vw, vh) => {
            const size = Math.floor(Math.min(vw, vh) * 0.7);
            return { width: size, height: size };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => void submitCode(decodedText),
        () => undefined,
      );
      setCameraActive(true);
    } catch (error) {
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Accès caméra refusé. Autorise la caméra dans le navigateur."
          : "Caméra indisponible. Utilise la saisie manuelle.",
      );
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      // ignore
    }
    scannerRef.current = null;
    setCameraActive(false);
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await shellRef.current?.requestFullscreen().catch(() => undefined);
    } else {
      await document.exitFullscreen().catch(() => undefined);
    }
  }

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    return () => {
      void scannerRef.current?.stop().catch(() => undefined);
    };
  }, []);

  if (!sessions.length) {
    return (
      <div className="scanner-shell" ref={shellRef}>
        <div className="scanner-empty">
          <Logo size={150} />
          <CameraOff size={40} />
          <h2 className="display">Aucune session</h2>
          <p>
            Crée d&apos;abord une session dans l&apos;admin (Paramètres → Sessions) pour
            pouvoir enregistrer les présences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-shell" ref={shellRef}>
      <header className="scanner-head">
        <Logo size={120} />
        <div className="cluster" style={{ gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <span className="status-pill">Staff · Scanner</span>
        </div>
      </header>

      <label className="scanner-session">
        <span className="scanner-session-label">Session active</span>
        <select
          className="select"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
        >
          {sessions.map((session) => (
            <option value={session.id} key={session.id}>
              {session.name}
              {session.active ? " · en cours" : ""}
            </option>
          ))}
        </select>
      </label>

      <div className="scanner-camera">
        <div id="qr-reader" className="scanner-video" />
        {!cameraActive ? (
          <div className="scanner-reticle" aria-hidden="true">
            <span className="scanline" />
          </div>
        ) : null}
        {!cameraActive ? (
          <p className="scanner-hint">Active la caméra puis aligne le QR code</p>
        ) : null}
        {result ? (
          <div
            className={`scan-result ${
              result.result === "ACCEPTED"
                ? "success"
                : result.result === "DUPLICATE"
                  ? "duplicate"
                  : "error"
            }`}
          >
            <div>
              <h2 className="display">
                {result.result === "ACCEPTED"
                  ? "✓ Présent·e"
                  : result.result === "DUPLICATE"
                    ? "Déjà scanné"
                    : "Non valide"}
              </h2>
              <p>{result.participant?.fullName ?? "QR code non reconnu"}</p>
              <span>
                {result.participant?.profile}
                {result.participant?.city ? ` · ${result.participant.city}` : ""}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <footer className="scanner-foot">
        {cameraError ? <p className="app-message error">{cameraError}</p> : null}
        <div className="cluster" style={{ justifyContent: "space-between" }}>
          <div>
            <small>Scannés · cette session</small>
            <strong className="grad-text-lt" style={{ display: "block", fontSize: 28 }}>
              {count}
            </strong>
          </div>
          <button className="btn btn-ghost" onClick={() => setCount(0)}>
            <RotateCcw size={17} /> Reset
          </button>
        </div>
        {cameraActive ? (
          <button className="btn btn-ghost btn-block" onClick={() => void stopCamera()}>
            <CameraOff size={18} /> Arrêter la caméra
          </button>
        ) : (
          <button className="btn btn-grad btn-block" onClick={() => void startCamera()}>
            <QrCode size={18} /> Activer la caméra
          </button>
        )}
        <form
          className="cluster"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode(manualCode);
            setManualCode("");
          }}
        >
          <input
            className="input"
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Saisie manuelle du code"
            aria-label="Code du badge"
          />
          <button className="btn btn-ghost" type="submit">
            <Keyboard size={18} /> Valider
          </button>
        </form>
      </footer>
    </div>
  );
}
