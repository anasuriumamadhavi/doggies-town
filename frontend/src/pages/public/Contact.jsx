import { useSite } from "../../context/SiteContext";
import { EnquiryForm } from "../../components/public/EnquiryForm";
import { BookNowButton } from "../../components/public/Buttons";
import { Phone, MessageCircle, Mail, MapPin, Clock, Navigation } from "lucide-react";

export default function Contact() {
  const { settings, whatsappLink, callLink } = useSite();
  if (!settings) return <div className="flex h-[60vh] items-center justify-center text-ink/40">Loading…</div>;

  const mapsDir = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.address || "")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
      <div className="max-w-2xl">
        <p className="overline text-terracotta">Get in touch</p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-ink sm:text-5xl">We'd love to meet your pet</h1>
        <p className="mt-5 text-base leading-relaxed text-ink/65 md:text-lg">Have a question or ready to plan a visit? Reach out — our team is here to help.</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <a href={callLink()} data-testid="contact-call-btn" className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md">
          <Phone className="h-6 w-6 text-terracotta" /><span className="text-sm font-semibold text-ink">Call Now</span>
        </a>
        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" data-testid="contact-whatsapp-btn" className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md">
          <MessageCircle className="h-6 w-6 text-[#25D366]" /><span className="text-sm font-semibold text-ink">WhatsApp</span>
        </a>
        <a href={mapsDir} target="_blank" rel="noopener noreferrer" data-testid="contact-directions-btn" className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-md">
          <Navigation className="h-6 w-6 text-sage" /><span className="text-sm font-semibold text-ink">Directions</span>
        </a>
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-5 text-center">
          <BookNowButton size="sm" testId="contact-book-now-btn" />
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-14 lg:grid-cols-2 lg:gap-20">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">Send an enquiry</h2>
          <p className="mt-2 text-sm text-ink/50">This is an enquiry form — to book, use the Book Now button.</p>
          <div className="mt-8"><EnquiryForm /></div>
        </div>

        <div>
          <div className="space-y-5 rounded-3xl border border-black/5 bg-white p-8">
            <h3 className="font-display text-xl font-medium text-ink">{settings.business_name}</h3>
            <InfoRow icon={<Phone className="h-5 w-5" />} label="Phone" value={settings.phone} />
            <InfoRow icon={<MessageCircle className="h-5 w-5" />} label="WhatsApp" value={settings.whatsapp} />
            <InfoRow icon={<Mail className="h-5 w-5" />} label="Email" value={settings.email} />
            <InfoRow icon={<MapPin className="h-5 w-5" />} label="Address" value={settings.address} />
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-terracotta"><Clock className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-wider text-ink/40">Opening hours</p>
                {(settings.opening_hours || []).map((h) => (
                  <p key={h.day} className="text-sm text-ink/80">{h.day}: <span className="text-ink/55">{h.hours}</span></p>
                ))}
              </div>
            </div>
          </div>
          {settings.maps_embed && (
            <div className="mt-6 overflow-hidden rounded-3xl border border-black/5">
              <iframe title="map" src={settings.maps_embed} className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-terracotta">{icon}</span>
      <div><p className="text-xs uppercase tracking-wider text-ink/40">{label}</p><p className="text-sm text-ink/80">{value}</p></div>
    </div>
  );
}
