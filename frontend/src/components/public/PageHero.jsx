import { useSite } from "../../context/SiteContext";

export function PageHero({ eyebrow, title, description, image }) {
  return (
    <section className="relative overflow-hidden bg-ink">
      {image && (
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
      <div className="relative mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        {eyebrow && <p className="overline mb-4 text-terracotta">{eyebrow}</p>}
        <h1 className="font-display text-4xl font-medium leading-tight tracking-tight text-cream sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-cream/70 md:text-lg">{description}</p>
        )}
      </div>
    </section>
  );
}
