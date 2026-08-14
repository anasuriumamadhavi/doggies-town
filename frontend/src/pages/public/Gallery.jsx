import { useState, useMemo } from "react";
import { usePublic } from "../../lib/usePublic";
import { mediaUrl } from "../../lib/api";
import { PageHero } from "../../components/public/PageHero";
import { X } from "lucide-react";

export default function Gallery() {
  const { data } = usePublic("/public/gallery");
  const items = data || [];
  const [active, setActive] = useState("All");
  const [lightbox, setLightbox] = useState(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))], [items]);
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <div>
      <PageHero eyebrow="Gallery" title="Moments of joy & care" description="A glimpse into everyday happiness at our facility." />
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} data-testid={`gallery-filter-${c.toLowerCase()}`} onClick={() => setActive(c)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${active === c ? "bg-terracotta text-white" : "border border-ink/10 text-ink/70 hover:border-ink/30"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="masonry">
          {filtered.map((g) => (
            <button key={g.id} onClick={() => setLightbox(g)} className="block w-full overflow-hidden rounded-2xl">
              <img src={mediaUrl(g.url)} alt={g.alt_text} loading="lazy" className="w-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
            </button>
          ))}
        </div>
        {filtered.length === 0 && <p className="py-20 text-center text-ink/40">No images in this category yet.</p>}
      </div>

      {lightbox && (
        <div data-testid="gallery-lightbox" className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close"><X className="h-6 w-6" /></button>
          <figure className="max-h-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <img src={mediaUrl(lightbox.url)} alt={lightbox.alt_text} className="max-h-[80vh] w-auto rounded-2xl object-contain" />
            {lightbox.caption && <figcaption className="mt-4 text-center text-sm text-cream/70">{lightbox.caption}</figcaption>}
          </figure>
        </div>
      )}
    </div>
  );
}
