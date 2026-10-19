
import { Link } from "react-router-dom";

export function MobileStickyCTA() {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "80px",
        backgroundColor: "red",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
      }}
    >
      <Link to="/" style={{ color: "white", fontSize: "16px" }}>
        HOME
      </Link>

      <Link to="/bookings" style={{ color: "white", fontSize: "16px" }}>
        BOOK
      </Link>

      <Link to="/services" style={{ color: "white", fontSize: "16px" }}>
        SERVICES
      </Link>

      <Link to="/contact" style={{ color: "white", fontSize: "16px" }}>
        CONTACT
      </Link>
    </div>
  );
}