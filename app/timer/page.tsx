import type { Metadata } from "next";
import { EventTimer } from "@/components/timer/EventTimer";

export const metadata: Metadata = {
  title: "Chronomètre",
  description: "Chronomètre de scène VIBEATHON avec alerte de fin.",
};

/** Dedicated, distraction-free countdown display for live event moments. */
export default function TimerPage() {
  return <EventTimer />;
}
