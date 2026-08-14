import { Link } from "react-router-dom";
import { usePublic } from "../../lib/usePublic";
import { mediaUrl } from "../../lib/api";
import { PageHero } from "../../components/public/PageHero";
import { Reveal } from "../../components/public/Reveal";
import { ServiceIcon } from "../../lib/icons";
import { ArrowUpRight } from "lucide-react";

export default function Services() {
  const { data } = usePublic("/public/services");
  const services = data || [];

  return (
    <div>
      <PageHero eyebrow="Our Services" title="Premium care for every need" description="From cosy boarding to expert grooming and positive training — thoughtful, professional care tailored to your pet." />
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {services.map((s, i) => (
            <Reveal key={s.id} delay={(i % 2) * 0.06}>
              <Link to={`/services/${s.slug}`} data-testid={`service-card-${s.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={mediaUrl(s.image)} alt={s.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 text-terracotta backdrop-blur">
                    <ServiceIcon name={s.icon} className="h-5 w-5" />
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-2xl font-medium text-ink">{s.name}</h3>
                    <span className="text-sm font-semibold text-terracotta">{s.starting_price}</span>
                  </div>
                  <p className="mt-3 flex-1 text-base leading-relaxed text-ink/60">{s.short_description}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink group-hover:text-terracotta">
                    View Details <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
