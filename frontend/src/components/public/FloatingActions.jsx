import { useSite } from "../../context/SiteContext";
import { Phone, MessageCircle } from "lucide-react";

export function FloatingActions() {
  const { settings, whatsappLink, callLink } = useSite();

  if (!settings) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "100px",
        zIndex: 999998,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* WhatsApp */}
      <a
        data-testid="floating-whatsapp-btn"
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#25D366",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(37,211,102,0.4)",
        }}
      >
        <MessageCircle size={26} />
      </a>

      {/* Call */}
      <a
        data-testid="floating-call-btn"
        href={callLink()}
        aria-label="Call us"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#111111",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <Phone size={24} />
      </a>
    </div>
  );
}