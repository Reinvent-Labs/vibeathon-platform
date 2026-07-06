"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Event date: Saturday, July 11, 2026 at 08:00:00 AM GMT (Abidjan time)
    const targetDate = new Date("2026-07-11T08:00:00Z").getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) {
    // Return placeholder during SSR and initial mount to avoid layout shift
    return (
      <div className="countdown-container loading">
        <div className="countdown-inner" style={{ opacity: 0.3 }}>
          <div className="countdown-slot">
            <span className="num">--</span>
            <span className="lbl">Jours</span>
          </div>
          <div className="countdown-divider">:</div>
          <div className="countdown-slot">
            <span className="num">--</span>
            <span className="lbl">Heures</span>
          </div>
          <div className="countdown-divider">:</div>
          <div className="countdown-slot">
            <span className="num">--</span>
            <span className="lbl">Min</span>
          </div>
          <div className="countdown-divider">:</div>
          <div className="countdown-slot">
            <span className="num">--</span>
            <span className="lbl">Sec</span>
          </div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="countdown-container">
        <div className="countdown-inner expired">
          <div className="countdown-live-pill animate-pulse">
            <span className="live-dot" /> L'ÉVÉNEMENT EST EN COURS !
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="countdown-container">
      <div className="countdown-inner">
        <div className="countdown-slot">
          <span className="num">{String(timeLeft.days).padStart(2, "0")}</span>
          <span className="lbl">Jours</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-slot">
          <span className="num">{String(timeLeft.hours).padStart(2, "0")}</span>
          <span className="lbl">Heures</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-slot">
          <span className="num">{String(timeLeft.minutes).padStart(2, "0")}</span>
          <span className="lbl">Min</span>
        </div>
        <div className="countdown-divider">:</div>
        <div className="countdown-slot">
          <span className="num">{String(timeLeft.seconds).padStart(2, "0")}</span>
          <span className="lbl">Sec</span>
        </div>
      </div>
    </div>
  );
}
