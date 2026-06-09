"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CameraOff,
  Keyboard,
  Maximize,
  Minimize,
  QrCode,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SessionPayload } from "@/lib/auth";

type ScanResponse = {
  result: "ACCEPTED" | "DUPLICATE" | "REJECTED";
  reason: string | null;
  sessionCount: number;
  participant: {
    reference: string;
    fullName: string;
    profile: string;
    city: string;
    status: string;
    teamName: string | null;
  } | null;
};

type SessionOption = {
  id: string;
  name: string;
  active: boolean;
  scanCount: number;
};

/**
 * Full-screen staff scanner. Camera reads and manual entries both use the
 * same authenticated API, which records every attempt in PostgreSQL.
 */
export function ScannerApp({
  sessions,
  user,
}: {
  sessions: SessionOption[];
  user: SessionPayload & { fullName: string };
}) {
  const router = useRouter();
  const scannerRef = useRef<{
    stop: () => Promise<void>;
    clear: () => void;
  } | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const lastScanRef = useRef({ code: "", at: 0 });

  const initialSession =
    sessions.find((session) => session.active)?.id ?? sessions[0]?.id ?? "";
  const sessionIdRef = useRef(initialSession);
  const [sessionId, setSessionId] = useState(initialSession);
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<ScanResponse | null>(null);
  const [count, setCount] = useState(
    sessions.find((session) => session.id === initialSession)?.scanCount ?? 0,
  );
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const submitCode = useCallback(
    async (rawCode: string) => {
      const qrCode = rawCode.trim();
      const activeSessionId = sessionIdRef.current;
      if (!qrCode || !activeSessionId) return;

      const now = Date.now();
      const scanKey = `${activeSessionId}:${qrCode}`;
      if (
        lastScanRef.current.code === scanKey &&
        now - lastScanRef.current.at < 3_000
      ) {
        return;
      }
      lastScanRef.current = { code: scanKey, at: now };

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            qrCode,
            sessionId: activeSessionId,
          }),
        });
        const payload = await response.json();
        if (response.status === 401) {
          router.replace("/login?next=%2Fscan");
          return;
        }
        const data: ScanResponse = payload.success
          ? payload.data
          : {
              result: "REJECTED",
              participant: null,
              reason: payload.error ?? "Scan impossible",
              sessionCount: count,
            };
        setResult(data);
        setCount(data.sessionCount);
        navigator.vibrate?.(
          data.result === "ACCEPTED" ? 60 : [40, 40, 40],
        );
      } catch {
        setResult({
          result: "REJECTED",
          participant: null,
          reason: "Connexion au serveur impossible",
          sessionCount: count,
        });
      }
      window.setTimeout(() => setResult(null), 2_500);
    },
    [count, router],
  );

  async function startCamera() {
    if (cameraActive) return;
    setCameraError(null);
    if (!window.isSecureContext) {
      setCameraError(
        "La caméra exige HTTPS (ou localhost). Ouvre l'adresse sécurisée du scanner.",
      );
      return;
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (viewportWidth, viewportHeight) => {
            const size = Math.floor(
              Math.min(viewportWidth, viewportHeight) * 0.7,
            );
            return { width: size, height: size };
          },
        },
        (decodedText) => void submitCode(decodedText),
        () => undefined,
      );
      setCameraActive(true);
    } catch (error) {
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Accès caméra refusé. Autorise la caméra dans le navigateur."
          : "Caméra indisponible. Vérifie les permissions ou utilise la saisie de secours.",
      );
    }
  }

  async function stopCamera() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      // The browser may already have stopped the stream.
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

  useEffect(
    () => () => {
      void scannerRef.current?.stop().catch(() => undefined);
    },
    [],
  );

  if (!sessions.length) {
    return (
      <div className="scanner-shell" ref={shellRef}>
        <div className="scanner-empty">
          <Logo size={150} />
          <CameraOff size={40} />
          <h1 className="display">Aucune session</h1>
          <p>
            Crée d&apos;abord une session dans l&apos;admin, puis reviens ici pour
            enregistrer les présences.
          </p>
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-shell" ref={shellRef}>
      <header className="scanner-head">
        <Logo size={120} />
        <div className="cluster scanner-head-actions">
          <span className="status-pill">Staff · Scanner</span>
          <button
            type="button"
            className="icon-btn"
            aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
          <LogoutButton compact />
        </div>
      </header>

      <div className="scanner-workspace">
        <div className="scanner-camera">
          <div id="qr-reader" className="scanner-video" />
          {!cameraActive ? (
            <div className="scanner-reticle" aria-hidden="true">
              <span className="scanline" />
            </div>
          ) : null}
          {!cameraActive ? (
            <p className="scanner-hint">
              Active la caméra puis aligne le QR code du badge
            </p>
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
                  {result.reason}
                  {result.participant?.teamName
                    ? ` · ${result.participant.teamName}`
                    : ""}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="scanner-foot">
          <p className="staff-context">
            Connecté·e : <strong>{user.fullName}</strong>
          </p>
          <label className="scanner-session">
            <span className="scanner-session-label">Session enregistrée</span>
            <select
              className="select"
              value={sessionId}
              onChange={(event) => {
                const nextSessionId = event.target.value;
                sessionIdRef.current = nextSessionId;
                setSessionId(nextSessionId);
                lastScanRef.current = { code: "", at: 0 };
                setCount(
                  sessions.find((session) => session.id === nextSessionId)
                    ?.scanCount ?? 0,
                );
              }}
            >
              {sessions.map((session) => (
                <option value={session.id} key={session.id}>
                  {session.name}
                  {session.active ? " · en cours" : ""}
                </option>
              ))}
            </select>
          </label>
          {cameraError ? (
            <p className="app-message error">{cameraError}</p>
          ) : null}
          <div className="scanner-count">
            <small>Présences validées · cette session</small>
            <strong className="grad-text-lt">{count}</strong>
            <span>Compteur synchronisé avec la base de données.</span>
          </div>
          {cameraActive ? (
            <button
              className="btn btn-ghost btn-block"
              onClick={() => void stopCamera()}
            >
              <CameraOff size={18} /> Arrêter la caméra
            </button>
          ) : (
            <button
              className="btn btn-grad btn-block"
              onClick={() => void startCamera()}
            >
              <QrCode size={18} /> Activer la caméra
            </button>
          )}
          <form
            className="scanner-manual"
            onSubmit={(event) => {
              event.preventDefault();
              void submitCode(manualCode);
              setManualCode("");
            }}
          >
            <label htmlFor="manual-badge-code">Saisie de secours</label>
            <div className="cluster">
              <input
                id="manual-badge-code"
                className="input"
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="QR ou référence VBT-2026-…"
                autoComplete="off"
              />
              <button className="btn btn-ghost" type="submit">
                <Keyboard size={18} /> Valider
              </button>
            </div>
          </form>
        </aside>
      </div>
    </div>
  );
}
