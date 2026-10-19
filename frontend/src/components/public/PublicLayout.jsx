import { Outlet, useLocation } from "react-router-dom";

import { useEffect } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { FloatingActions } from "./FloatingActions";
import { MobileStickyCTA } from "./MobileStickyCTA";


const navItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "3px",
  textDecoration: "none",
  color: "#333",
  fontSize: "12px",
  fontWeight: "600",
};

export function PublicLayout() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
     <main className="flex-1 pb-20 pt-16 md:pb-0 md:pt-20">
  <Outlet />
</main>
      <Footer />
<FloatingActions />

<nav
  className="mobile-bottom-nav"
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    height: "75px",
    backgroundColor: "#ffffff",
    zIndex: 999999,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    borderTop: "1px solid #ddd",
  }}
>
  <a href="/" style={navItemStyle}>
    <span style={{ fontSize: "24px" }}>⌂</span>
    <span>Home</span>
  </a>

 <a
  href="https://pet.kensworthpreview.com/book"
  target="_self"
  rel="noopener noreferrer"
  style={{
    ...navItemStyle,
    width: "100%",
    height: "75px",
    cursor: "pointer",
  }}
>
  <span style={{ fontSize: "24px" }}>▣</span>
  <span>Book</span>
</a>
  <a href="/services" style={navItemStyle}>
    <span style={{ fontSize: "24px" }}>🐾</span>
    <span>Services</span>
  </a>

  <a href="/contact" style={navItemStyle}>
    <span style={{ fontSize: "24px" }}>●</span>
    <span>Contact</span>
  </a>
</nav>
    </div>
  );
}
