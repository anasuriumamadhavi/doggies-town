import { useParams, Link } from "react-router-dom";
import { usePublic } from "../../lib/usePublic";
import { mediaUrl } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { BookNowButton } from "../../components/public/Buttons";
import { Reveal } from "../../components/public/Reveal";
import { Check, Phone, MessageCircle, Clock, Tag } from "lucide-react";

export default function ServiceDetail() {
  const { slug } = useParams();
  const { data: s, loading } = usePublic(`/public/services/${slug}`);
  const { whatsappLink, callLink } = useSite();

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-ink/40">Loading…</div>;
  if (!s) return <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-ink/50">Service not found. <Link to="/services" className="text-terracotta underline">Back to services</Link></div>;

  return (
    <div>
      <section className="relative overflow-hidden bg-ink">
        <img src={mediaUrl(s.image)} alt={s.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
          <p className="overline mb-4 text-terracotta">Service</p>
          <h1 className="font-display text-4xl font-medium leading-tight text-cream sm:text-5xl lg:text-6xl">{s.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/75 md:text-lg">{s.short_description}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <BookNowButton size="lg" testId="service-book-now-btn" />
            <a href={whatsappLink(`Hi, I would like to enquire about ${s.name}.`)} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-cream hover:bg-cream/10">
              <MessageCircle className="h-4 w-4" /> WhatsApp Us
            </a>
            <a href={callLink()} className="inline-flex items-center gap-2 rounded-full border border-cream/25 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-cream hover:bg-cream/10">
              <Phone className="h-4 w-4" /> Call Us
            </a>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-2">
            <Reveal>
              <h2 className="font-display text-3xl font-medium text-ink">Overview</h2>
              <p className="mt-5 text-base leading-relaxed text-ink/65 md:text-lg">{s.full_description}</p>
            </Reveal>

            {(s.features || []).length > 0 && (
              <Reveal>
                <h3 className="mt-14 font-display text-2xl font-medium text-ink">What we offer</h3>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <div key={f} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
                      <Check className="h-5 w-5 shrink-0 text-terracotta" /> <span className="text-sm text-ink/80">{f}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}

            {(s.highlights || []).length > 0 && (
              <Reveal>
                <h3 className="mt-14 font-display text-2xl font-medium text-ink">Highlights</h3>
                <div className="mt-6 flex flex-wrap gap-3">
                  {s.highlights.map((h) => <span key={h} className="rounded-full bg-sage/15 px-4 py-2 text-sm font-medium text-sage">{h}</span>)}
                </div>
              </Reveal>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-28 rounded-3xl border border-black/5 bg-white p-8">
              <div className="flex items-center gap-3 border-b border-black/5 pb-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta"><Tag className="h-5 w-5" /></span>
                <div><p className="text-xs uppercase tracking-wider text-ink/40">Starting price</p><p className="font-display text-2xl font-semibold text-ink">{s.starting_price}</p></div>
              </div>
              <div className="flex items-center gap-3 py-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/15 text-sage"><Clock className="h-5 w-5" /></span>
                <div><p className="text-xs uppercase tracking-wider text-ink/40">Duration</p><p className="font-medium text-ink">{s.duration}</p></div>
              </div>
              <div className="mt-3"><BookNowButton className="w-full justify-center" testId="service-aside-book-now-btn" /></div>
            </div>
          </aside>
        </div>

        {(s.faqs || []).length > 0 && (
          <div className="mt-20 max-w-3xl">
            <h3 className="font-display text-2xl font-medium text-ink">Frequently asked</h3>
            <div className="mt-6 divide-y divide-black/5">
              {s.faqs.map((f, i) => (
                <details key={i} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium text-ink">{f.question}<span className="text-terracotta transition-transform group-open:rotate-45">+</span></summary>
                  <p className="mt-3 text-base leading-relaxed text-ink/60">{f.answer}</p>
                </details>
              ))}
            </div>
          </div>
        )}
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
        <div className="rounded-[2rem] bg-terracotta px-6 py-16 text-center text-white md:py-20">
          <h2 className="font-display text-3xl font-medium md:text-4xl">Ready to book {s.name}?</h2>
          <div className="mt-8 flex justify-center"><BookNowButton size="lg" className="bg-white !text-terracotta" testId="service-final-book-now-btn" /></div>
        </div>
      </section>
    </div>
  );
}
