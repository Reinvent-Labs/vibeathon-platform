"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const LINKS = [
  ["#concept", "Le concept"],
  ["#activites", "Activités"],
  ["#programme", "Programme"],
  ["/formation", "Formation"],
  ["#billets", "Mon pass"],
] as const;

/**
 * Public site navigation.
 * Desktop: inline links + CTA. Mobile: a hamburger that opens a full drawer
 * containing the links and both CTAs, so "Je candidate" is always reachable
 * and never collides with the logo on small screens.
 */
export function SiteNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      closeButtonRef.current?.focus();
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <nav className={`nav-bar ${scrolled ? "scrolled" : ""}`} aria-label="Navigation principale">
        <div className="nav-inner">
          <Logo size={132} className="nav-logo" />

          <div className="links">
            {LINKS.map(([href, label]) => (
              <Link href={href} key={href}>
                {label}
              </Link>
            ))}
          </div>

          <div className="nav-cta">
            <Link href="/statut" className="btn btn-ghost">Mon statut</Link>
            <Link href="/billet" className="btn btn-grad">
              Prendre mon pass
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="menu-btn"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
        </div>
      </nav>

      {/* Drawer is a sibling of the nav so the nav's backdrop-filter does not
          turn it into a containing block / let content bleed through. */}
      {open ? (
        <div className="nav-drawer" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="nav-drawer-head">
            <Logo size={120} />
            <button
              ref={closeButtonRef}
              type="button"
              className="menu-btn"
              aria-label="Fermer le menu"
              onClick={() => setOpen(false)}
            >
              <X />
            </button>
          </div>
          <div className="nav-drawer-links">
            {LINKS.map(([href, label]) => (
              <Link href={href} key={href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link href="/statut" onClick={() => setOpen(false)}>
              Mon statut
            </Link>
          </div>
          <Link
            href="/billet"
            className="btn btn-grad btn-block"
            onClick={() => setOpen(false)}
          >
            Prendre mon pass
          </Link>
        </div>
      ) : null}
    </>
  );
}
