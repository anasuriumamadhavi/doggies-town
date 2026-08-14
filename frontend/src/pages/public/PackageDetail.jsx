import { useParams, Link } from "react-router-dom";
import { usePublic } from "../../lib/usePublic";
import { mediaUrl } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { BookNowButton } from "../../components/public/Buttons";
import { Reveal } from "../../components/public/Reveal";
import { Check, MessageCircle } from "lucide-react";

export default function PackageDetail() {
  const { slug } = useParams();
  const { data: p, loading } = usePublic(`/public/packages/${slug}`);
  const { whatsappLink } = useSite();

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-ink/40">Loading…</div>;
  if (!p) return <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-ink/50">Package not found. <Link to="/packages" className="text-terracotta underline">Back to packages</Link></div>;

  return (
    <div>
      <section className="relative overflow-hidden bg-ink">
        <img src={mediaUrl(p.image)} alt={p.name} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-36">
          {p.most_popular && <span className="mb-4 inline-block rounded-full bg-terracotta px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">Most Popular</span>}
          <h1 className="font-display text-4xl font-medium leading-tight text-cream sm:text-5xl lg:text-6xl">{p.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/75 md:text-lg">{p.description}</p>
          <p className="mt-6 font-display text-3xl font-semibold text-terracotta">{p.price} <span className="text-base font-normal text-cream/60">/ {p.duration}</span></p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
          <div className="lg:col-span-2 space-y-14">
            {(p.included_services || []).length > 0 && (
              <Reveal>
                <h2 className="font-display text-3xl font-medium text-ink">Included services</h2>
                <div className="mt-6 flex flex-wrap gap-3">
                  {p.included_services.map((s) => <span key={s} className="rounded-full bg-sage/15 px-4 py-2 text-sm font-medium text-sage">{s}</span>)}
                </div>
              </Reveal>
            )}
            {(p.benefits || []).length > 0 && (
              <Reveal>
                <h2 className="font-display text-3xl font-medium text-ink">Benefits</h2>
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {p.benefits.map((b) => (
                    <div key={b} className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4">
                      <Check className="h-5 w-5 shrink-0 text-terracotta" /> <span className="text-sm text-ink/80">{b}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            )}
            {p.terms && (
              <Reveal>
                <h2 className="font-display text-2xl font-medium text-ink">Terms</h2>
                <p className="mt-4 text-base leading-relaxed text-ink/60">{p.terms}</p>
              </Reveal>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-28 rounded-3xl border border-black/5 bg-white p-8">
              <p className="text-xs uppercase tracking-wider text-ink/40">Package price</p>
              <p className="font-display text-3xl font-semibold text-terracotta">{p.price}</p>
              <p className="mt-1 text-sm text-ink/50">{p.duration}</p>
              <div className="mt-6 space-y-3">
                <BookNowButton className="w-full justify-center" label={p.cta_text || "Book This Package"} testId="package-book-now-btn" />
                <a href={whatsappLink(`Hi, I would like to enquire about ${p.name}.`)} target="_blank" rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-ink hover:bg-cream">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
