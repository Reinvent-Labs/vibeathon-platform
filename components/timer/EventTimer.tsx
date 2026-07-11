"use client";

import { Pause, Play, RotateCcw, Timer, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";

const DURATION_PRESETS = [1, 3, 5, 10, 15];
const DEFAULT_DURATION_MINUTES = 5;
const MAX_DURATION_MINUTES = 180;
const TIMER_RADIUS = 46;

type BrowserWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const toMilliseconds = (minutes: number) => minutes * 60 * 1_000;

const formatCountdown = (milliseconds: number) => {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

/** Provides a visible, audible event countdown without requiring server state. */
export function EventTimer() {
  const [durationMinutes, setDurationMinutes] = useState(DEFAULT_DURATION_MINUTES);
  const [remainingMilliseconds, setRemainingMilliseconds] = useState(
    toMilliseconds(DEFAULT_DURATION_MINUTES),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const durationMilliseconds = toMilliseconds(durationMinutes);
  const progress = Math.max(0, Math.min(1, remainingMilliseconds / durationMilliseconds));
  const displayedTime = formatCountdown(remainingMilliseconds);

  const enableAlarm = async () => {
    const AudioContextConstructor =
      window.AudioContext ?? (window as BrowserWindow).webkitAudioContext;
    if (!AudioContextConstructor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextConstructor();
    }
    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }
  };

  const playAlarm = () => {
    const audioContext = audioContextRef.current;
    if (!audioContext) return;

    const scheduleAlarm = () => {
      const startedAt = audioContext.currentTime;
      [0, 0.3, 0.6].forEach((offset, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const noteStartedAt = startedAt + offset;
        const noteEndsAt = noteStartedAt + 0.24;

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(index === 2 ? 880 : 660, noteStartedAt);
        gain.gain.setValueAtTime(0.0001, noteStartedAt);
        gain.gain.exponentialRampToValueAtTime(0.22, noteStartedAt + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteEndsAt);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(noteStartedAt);
        oscillator.stop(noteEndsAt);
      });
    };

    if (audioContext.state === "suspended") {
      void audioContext.resume().then(scheduleAlarm).catch(() => undefined);
      return;
    }
    scheduleAlarm();
  };

  useEffect(() => {
    if (!isRunning) return;

    let animationFrame = 0;
    let lastPaintedAt = 0;
    const tick = (now: number) => {
      const nextRemaining = Math.max(0, (deadlineRef.current ?? Date.now()) - Date.now());

      if (nextRemaining === 0) {
        deadlineRef.current = null;
        setRemainingMilliseconds(0);
        setIsRunning(false);
        setIsFinished(true);
        playAlarm();
        return;
      }

      if (now - lastPaintedAt >= 100) {
        setRemainingMilliseconds(nextRemaining);
        lastPaintedAt = now;
      }
      animationFrame = window.requestAnimationFrame(tick);
    };

    animationFrame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [isRunning]);

  useEffect(
    () => () => {
      audioContextRef.current?.close().catch(() => undefined);
    },
    [],
  );

  const chooseDuration = (minutes: number) => {
    const nextDuration = Math.max(1, Math.min(MAX_DURATION_MINUTES, minutes));
    setDurationMinutes(nextDuration);
    setRemainingMilliseconds(toMilliseconds(nextDuration));
    setIsFinished(false);
    deadlineRef.current = null;
  };

  const start = () => {
    void enableAlarm();
    const nextRemaining = remainingMilliseconds || durationMilliseconds;
    deadlineRef.current = Date.now() + nextRemaining;
    setRemainingMilliseconds(nextRemaining);
    setIsFinished(false);
    setIsRunning(true);
  };

  const pause = () => {
    const nextRemaining = Math.max(0, (deadlineRef.current ?? Date.now()) - Date.now());
    deadlineRef.current = null;
    setRemainingMilliseconds(nextRemaining);
    setIsRunning(false);
  };

  const reset = () => {
    deadlineRef.current = null;
    setRemainingMilliseconds(durationMilliseconds);
    setIsRunning(false);
    setIsFinished(false);
  };

  return (
    <main className={`timer-page${isFinished ? " is-finished" : ""}`}>
      <div className="timer-page-glow timer-page-glow-left" aria-hidden="true" />
      <div className="timer-page-glow timer-page-glow-right" aria-hidden="true" />

      <header className="timer-header">
        <Logo size={132} />
        <div className="timer-header-title">
          <Timer aria-hidden="true" size={17} />
          <span>Chronomètre de scène</span>
        </div>
      </header>

      <section className="timer-content" aria-labelledby="timer-title">
        <div className="timer-intro">
          <span className="eyebrow">VIBEATHON · Rythme de présentation</span>
          <h1 id="timer-title">{isFinished ? "Temps écoulé" : "Compte à rebours"}</h1>
          <p>{isFinished ? "La sonnerie a été déclenchée." : "Choisissez la durée puis lancez le temps."}</p>
        </div>

        <div className="timer-ring-wrap">
          <div className="timer-ring-halo" aria-hidden="true" />
          <svg
            className="timer-ring"
            viewBox="0 0 120 120"
            role="img"
            aria-label={`${displayedTime} restantes`}
          >
            <defs>
              <linearGradient id="timer-ring-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="#75FF8D" />
                <stop offset="54%" stopColor="#BA77FF" />
                <stop offset="100%" stopColor="#FF57E3" />
              </linearGradient>
            </defs>
            <circle className="timer-ring-track" cx="60" cy="60" r={TIMER_RADIUS} />
            <circle
              className="timer-ring-progress"
              cx="60"
              cy="60"
              r={TIMER_RADIUS}
              pathLength="1"
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
            />
          </svg>
          <div className="timer-readout">
            <span className="timer-readout-label">Temps restant</span>
            <strong>{displayedTime}</strong>
            <span className={`timer-state${isFinished ? " finished" : ""}`} role="status">
              {isFinished ? "Terminé" : isRunning ? "En cours" : "Prêt"}
            </span>
          </div>
        </div>

        <div className="timer-controls" aria-label="Commandes du chronomètre">
          <div className="timer-duration-picker">
            <span className="timer-control-label">Durée</span>
            <div className="timer-presets" aria-label="Durées rapides">
              {DURATION_PRESETS.map((minutes) => (
                <button
                  className={`timer-preset${durationMinutes === minutes ? " active" : ""}`}
                  disabled={isRunning}
                  key={minutes}
                  type="button"
                  onClick={() => chooseDuration(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
            <label className="timer-custom-duration">
              <span>Personnalisée</span>
              <input
                aria-label="Durée personnalisée en minutes"
                disabled={isRunning}
                inputMode="numeric"
                max={MAX_DURATION_MINUTES}
                min="1"
                type="number"
                value={durationMinutes}
                onChange={(event) => chooseDuration(Number(event.target.value) || 1)}
              />
              <span>min</span>
            </label>
          </div>

          <div className="timer-actions">
            {isRunning ? (
              <button className="btn btn-ghost timer-action" type="button" onClick={pause}>
                <Pause aria-hidden="true" size={18} />
                Pause
              </button>
            ) : (
              <button className="btn btn-grad timer-action" type="button" onClick={start}>
                <Play aria-hidden="true" size={18} />
                {isFinished ? "Recommencer" : "Démarrer"}
              </button>
            )}
            <button className="btn btn-ghost timer-action" type="button" onClick={reset}>
              <RotateCcw aria-hidden="true" size={18} />
              Réinitialiser
            </button>
          </div>
        </div>

        <p className="timer-sound-note">
          <Volume2 aria-hidden="true" size={16} />
          Une alerte sonore retentira à la fin du temps.
        </p>
      </section>
    </main>
  );
}
