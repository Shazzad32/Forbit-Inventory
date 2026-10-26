"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/actions";
import Icon from "./Icon";

const MAIN = [
  { href: "/", label: "Dashboard", icon: "home", exact: true },
  { href: "/store", label: "Store", icon: "store" },
  { href: "/retail", label: "Retail", icon: "retail" },
  { href: "/rangs", label: "Rangs", icon: "rangs" },
  { href: "/return", label: "Returns", icon: "return" },
];
const REPORTS = [
  { href: "/sold", label: "Sold devices", icon: "sold" },
  { href: "/not-paid", label: "Due list", icon: "coin" },
  { href: "/due", label: "Technician report", icon: "due" },
];

function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="pin" />
      </span>
      <span>
        <b>Inventory</b>
        <small>Device management</small>
      </span>
    </div>
  );
}

/**
 * Desktop: fixed navigation rail on the left.
 * Phone / tablet: the rail slides in from the left (menu button in the top bar).
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // close the drawer after navigating
  useEffect(() => setOpen(false), [pathname]);

  // Escape closes it, and the page behind does not scroll while it is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const active = (n) => (n.exact ? pathname === n.href : pathname === n.href || pathname.startsWith(`${n.href}/`));
  const link = (n) => (
    <Link key={n.href} href={n.href} aria-current={active(n) ? "page" : undefined}>
      <Icon name={n.icon} />
      {n.label}
    </Link>
  );

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>

      <aside id="sidebar" className={`sidebar${open ? " open" : ""}`} aria-label="Main navigation">
        <Brand />
        <nav className="nav">
          {MAIN.map(link)}
          <span className="nav-label">Reports</span>
          {REPORTS.map(link)}
        </nav>
        <div className="side-foot">
          <form action={logout}>
            <button type="submit" className="logout">
              <Icon name="logout" />
              Log out
            </button>
          </form>
        </div>
      </aside>

      {open && <div className="scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      <div className="main-wrap">
        <div className="topbar">
          <button
            type="button"
            className="icon-btn"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="sidebar"
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "x" : "menu"} />
          </button>
          <span className="topbar-title">Inventory</span>
          <Link href="/devices/new" className="icon-btn accent-btn" aria-label="Add device">
            <Icon name="plus" />
          </Link>
        </div>
        <main id="main">{children}</main>
      </div>
    </>
  );
}
