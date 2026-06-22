"use client";

import { useState } from "react";

interface JuryCardProps {
  name: string;
  title: string;
  company: string;
  bio: string;
  tag: string;
  color: string;
  initials: string;
  photoUrl: string;
}

export function JuryCard({
  name,
  title,
  company,
  bio,
  tag,
  color,
  initials,
  photoUrl,
}: JuryCardProps) {
  const [imageError, setImageError] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "rgba(16, 23, 26, 0.75)",
        border: hovered ? `1px solid ${color}` : "1px solid var(--line)",
        borderRadius: "20px",
        padding: "30px 24px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
        transform: hovered ? "translateY(-6px) scale(1.02)" : "translateY(0) scale(1)",
        boxShadow: hovered ? `0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px ${color}33` : "0 8px 24px rgba(0, 0, 0, 0.2)",
        transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease",
        ["--cat" as string]: color,
      }}
    >
      {/* Accent top bar */}
      <div style={{ backgroundColor: color, position: "absolute", top: 0, left: 0, right: 0, height: "4px" }} />
      
      {/* Avatar Section */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
        <div style={{
          width: "68px",
          height: "68px",
          borderRadius: "14px",
          background: `linear-gradient(135deg, ${color}20 0%, rgba(255,255,255,0.02) 100%)`,
          border: `2px solid ${color}`,
          display: "grid",
          placeItems: "center",
          fontFamily: "Outfit, sans-serif",
          fontWeight: 900,
          fontSize: "1.4rem",
          color: color,
          boxShadow: hovered ? `0 0 15px ${color}88` : `0 0 8px ${color}33`,
          transition: "box-shadow 0.3s ease",
          position: "relative",
          overflow: "hidden",
        }}>
          {!photoUrl || imageError ? (
            <span>{initials}</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={name}
              onError={() => setImageError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
            />
          )}
        </div>
        <div>
          {/* Neon label */}
          <span style={{
            fontSize: "0.68rem",
            fontWeight: "800",
            letterSpacing: "0.12em",
            color: color,
            textTransform: "uppercase",
            display: "block",
            marginBottom: "4px",
            textShadow: hovered ? `0 0 8px ${color}44` : "none",
            transition: "text-shadow 0.3s ease",
          }}>
            MEMBRE DU JURY
          </span>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#fff", margin: 0 }}>
            {name}
          </h3>
        </div>
      </div>
      
      {/* Corporate info */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: "var(--ink)", fontWeight: "600", fontSize: "0.95rem" }}>
          {title}
        </div>
        <div style={{ color: "var(--ink-soft)", fontSize: "0.85rem", marginTop: "2px" }}>
          {company}
        </div>
      </div>
      
      {/* Biography */}
      <p className="body" style={{ fontSize: "0.9rem", color: "var(--ink-soft)", lineHeight: "1.5", flex: 1, margin: 0 }}>
        {bio}
      </p>

      {/* Domain tag */}
      <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
        <span className="cat-tag" style={{
          ["--cat" as string]: color,
          fontSize: "0.75rem",
        }}>
          {tag}
        </span>
      </div>
    </article>
  );
}
