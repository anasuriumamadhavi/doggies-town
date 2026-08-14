import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, mediaUrl } from "../../lib/api";
import { useSite } from "../../context/SiteContext";
import { BookNowButton, OutlineButton } from "../../components/public/Buttons";
import { Reveal } from "../../components/public/Reveal";
import { ServiceIcon } from "../../lib/icons";
import { ArrowRight, ArrowUpRight, Star, Check } from "lucide-react";

export default function Home() {
  const { services } = useSite();
  const [hp, setHp] = useState(null);
  const [packages, setPackages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/public/homepage"),
      api.get("/public/packages"),
      api.get("/public/testimonials"),
      api.get("/public/gallery"),
      api.get("/public/faqs"),
    ]).then(([h, p, t, g, f]) => {
      setHp(h.data); setPackages(p.data || []); setTestimonials(t.data || []);
      setGallery(g.data || []); setFaqs(f.data || []);
    });
  }, []);

  if (!hp) return <div className="flex h-[60vh] items-center justify-center text-ink/40">Loading…</div>;

  const hero = hp.hero || {};

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink">
        <img src={mediaUrl(hero.image)} alt="Happy pet" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/60 to-transparent" />
        <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-4 py-28 md:px-8 md:py-40 lg:min-h-[85vh]">
          <div className="max-w-2xl fade-up">
            <p className="overline mb-5 text-terracotta">{hero.eyebrow}</p>
            <h1 className="font-display text-4xl font-medium leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-7xl">
              {hero.heading}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream/75 md:text-lg">{hero.description}</p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <BookNowButton size="lg" label={hero.primary_cta_text} testId="hero-book-now-btn" />
              <Link to="/services">
                <span className="group inline-flex items-center gap-2 rounded-full border border-cream/25 px-8 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-cream transition-all hover:-translate-y-0.5 hover:bg-cream/10">
                  {hero.secondary_cta_text || "Explore Services"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {(hero.trust_indicators || []).map((t) => (
                <span key={t} className="flex items-center gap-2 text-sm text-cream/70">
                  <Check className="h-4 w-4 text-terracotta" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES QUICK NAV */}
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden md:grid-cols-3 lg:grid-cols-6">
          {services.map((s) => (
            <Link key={s.id} to={`/services/${s.slug}`}
              className="group flex flex-col items-center gap-3 border-b border-r border-black/5 px-4 py-8 text-center transition-colors hover:bg-cream">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-terracotta/10 text-terracotta transition-transform group-hover:-translate-y-1">
                <ServiceIcon name={s.icon} className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold text-ink">{s.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* INTRODUCTION */}
      {hp.introduction?.enabled && (
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <div className="relative">
                <img src={mediaUrl(hp.introduction.image)} alt="About Pawsome" className="aspect-[4/5] w-full rounded-3xl object-cover" />
                <div className="absolute -bottom-6 -right-6 hidden rounded-3xl bg-terracotta p-6 text-white shadow-xl md:block">
                  <p className="font-display text-4xl font-semibold">500+</p>
                  <p className="text-xs uppercase tracking-wider">Happy pets cared for</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="overline text-terracotta">Welcome to the family</p>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-4xl">{hp.introduction.heading}</h2>
              <p className="mt-6 text-base leading-relaxed text-ink/65 md:text-lg">{hp.introduction.description}</p>
              <div className="mt-8"><Link to="/about"><OutlineButton testId="intro-about-btn">{hp.introduction.cta_text || "About Us"}</OutlineButton></Link></div>
            </Reveal>
          </div>
        </section>
      )}

      {/* SERVICES SHOWCASE (editorial) */}
      <section className="bg-white py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <SectionHeading eyebrow="What we offer" title={hp.services_section?.heading} description={hp.services_section?.description} cta={{ to: "/services", label: "All Services" }} />
          <div className="mt-14 space-y-6">
            {services.slice(0, 4).map((s, i) => (
              <Reveal key={s.id} delay={i * 0.05}>
                <Link to={`/services/${s.slug}`}
                  className="group grid grid-cols-1 items-stretch gap-6 overflow-hidden rounded-3xl border border-black/5 bg-cream md:grid-cols-12">
                  <div className={`relative aspect-[16/10] overflow-hidden md:col-span-5 md:aspect-auto ${i % 2 ? "md:order-2" : ""}`}>
                    <img src={mediaUrl(s.image)} alt={s.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div className="flex flex-col justify-center gap-3 p-8 md:col-span-7 md:p-12">
                    <span className="font-display text-sm text-terracotta">0{i + 1}</span>
                    <h3 className="font-display text-2xl font-medium text-ink md:text-3xl">{s.name}</h3>
                    <p className="max-w-xl text-base leading-relaxed text-ink/60">{s.full_description?.slice(0, 160)}…</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(s.features || []).slice(0, 3).map((f) => (
                        <span key={f} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink/70">{f}</span>
                      ))}
                    </div>
                    <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-terracotta">
                      View Details <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      {hp.why_choose_us?.enabled && (
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <SectionHeading eyebrow="Why choose us" title={hp.why_choose_us.heading} description={hp.why_choose_us.description} />
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {(hp.why_choose_us.features || []).map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="h-full rounded-3xl border border-black/5 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/15 text-sage">
                    <ServiceIcon name={f.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-medium text-ink">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* FACILITY */}
      {hp.facility?.enabled && (
        <section className="bg-ink py-24 text-cream md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="max-w-2xl">
              <p className="overline text-terracotta">Our space</p>
              <h2 className="mt-4 font-display text-3xl font-medium leading-tight md:text-4xl">{hp.facility.heading}</h2>
              <p className="mt-5 text-base leading-relaxed text-cream/65 md:text-lg">{hp.facility.description}</p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {(hp.facility.images || []).map((img, i) => (
                <Reveal key={i} delay={i * 0.08}>
                  <img src={mediaUrl(img)} alt="Facility" className={`w-full rounded-3xl object-cover ${i === 0 ? "aspect-[4/5] md:aspect-[3/4]" : "aspect-square"}`} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* JOURNEY */}
      {hp.journey?.enabled && (
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <SectionHeading eyebrow="How it works" title={hp.journey.heading} />
          <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
            {(hp.journey.steps || []).map((s, i) => (
              <Reveal key={s.number} delay={i * 0.08}>
                <div className="relative">
                  <span className="font-display text-6xl font-semibold text-terracotta/20">{s.number}</span>
                  <h3 className="mt-2 font-display text-2xl font-medium text-ink">{s.title}</h3>
                  <p className="mt-3 text-base leading-relaxed text-ink/60">{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* PACKAGES PREVIEW */}
      {hp.packages_section?.enabled && packages.length > 0 && (
        <section className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <SectionHeading eyebrow="Best value" title={hp.packages_section.heading} description={hp.packages_section.description} cta={{ to: "/packages", label: "All Packages" }} />
            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.slice(0, 3).map((p, i) => <PackageCard key={p.id} p={p} delay={i * 0.05} />)}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {hp.testimonials_section?.enabled && testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
          <SectionHeading eyebrow="Kind words" title={hp.testimonials_section.heading} description={hp.testimonials_section.description} />
          <div className="mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {testimonials.map((t) => (
              <div key={t.id} className="w-[85%] shrink-0 snap-start rounded-3xl border border-black/5 bg-white p-8 sm:w-[420px]">
                <div className="flex gap-1">{Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-terracotta text-terracotta" />)}</div>
                <p className="mt-5 font-display text-xl leading-relaxed text-ink">"{t.testimonial}"</p>
                <div className="mt-6 flex items-center gap-3">
                  {t.image && <img src={mediaUrl(t.image)} alt={t.customer_name} className="h-12 w-12 rounded-full object-cover" />}
                  <div>
                    <p className="text-sm font-semibold text-ink">{t.customer_name}</p>
                    <p className="text-xs text-ink/50">{t.pet_name && `Pet parent of ${t.pet_name}`} · {t.service}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GALLERY PREVIEW */}
      {hp.gallery_section?.enabled && gallery.length > 0 && (
        <section className="bg-white py-24 md:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <SectionHeading eyebrow="Gallery" title={hp.gallery_section.heading} description={hp.gallery_section.description} cta={{ to: "/gallery", label: "View Gallery" }} />
            <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {gallery.slice(0, 8).map((g, i) => (
                <img key={g.id} src={mediaUrl(g.url)} alt={g.alt_text} loading="lazy"
                  className={`w-full rounded-2xl object-cover transition-transform duration-500 hover:scale-[1.02] ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ PREVIEW */}
      {hp.faq_section?.enabled && faqs.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-24 md:px-8 md:py-32">
          <SectionHeading eyebrow="Good to know" title={hp.faq_section.heading} description={hp.faq_section.description} cta={{ to: "/faq", label: "All FAQs" }} />
          <div className="mt-12 divide-y divide-black/5">
            {faqs.slice(0, 5).map((f) => (
              <details key={f.id} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between text-lg font-medium text-ink">
                  {f.question}
                  <span className="ml-4 text-terracotta transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-base leading-relaxed text-ink/60">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      {hp.final_cta?.enabled && (
        <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8 md:pb-32">
          <div className="relative overflow-hidden rounded-[2rem] bg-terracotta px-6 py-16 text-center text-white md:px-16 md:py-24">
            <div className="noise-overlay pointer-events-none absolute inset-0 opacity-[0.06]" />
            <h2 className="relative mx-auto max-w-2xl font-display text-3xl font-medium leading-tight md:text-5xl">{hp.final_cta.heading}</h2>
            <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">{hp.final_cta.description}</p>
            <div className="relative mt-9 flex justify-center">
              <BookNowButton size="lg" label={hp.final_cta.primary_cta_text} testId="final-cta-book-now-btn" className="bg-white !text-terracotta hover:shadow-[0_12px_30px_rgba(0,0,0,0.2)]" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, cta }) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-2xl">
        {eyebrow && <p className="overline text-terracotta">{eyebrow}</p>}
        <h2 className="mt-3 font-display text-3xl font-medium leading-tight tracking-tight text-ink md:text-4xl">{title}</h2>
        {description && <p className="mt-4 text-base leading-relaxed text-ink/60 md:text-lg">{description}</p>}
      </div>
      {cta && (
        <Link to={cta.to} className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink hover:text-terracotta">
          {cta.label} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

export function PackageCard({ p, delay = 0 }) {
  return (
    <Reveal delay={delay}>
      <Link to={`/packages/${p.slug}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-cream transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
        <div className="relative aspect-[16/11] overflow-hidden">
          <img src={mediaUrl(p.image)} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          {p.most_popular && <span className="absolute left-4 top-4 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">Most Popular</span>}
        </div>
        <div className="flex flex-1 flex-col p-7">
          <h3 className="font-display text-2xl font-medium text-ink">{p.name}</h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">{p.description}</p>
          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-ink/40">{p.duration}</p>
              <p className="font-display text-2xl font-semibold text-terracotta">{p.price}</p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-ink group-hover:text-terracotta">View <ArrowUpRight className="h-4 w-4" /></span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}
