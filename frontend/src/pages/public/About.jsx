import { usePublic } from "../../lib/usePublic";
import { mediaUrl } from "../../lib/api";
import { PageHero } from "../../components/public/PageHero";
import { Reveal } from "../../components/public/Reveal";
import { BookNowButton } from "../../components/public/Buttons";

export default function About() {
  const { data } = usePublic("/public/about");
  if (!data) return <div className="flex h-[60vh] items-center justify-center text-ink/40">Loading…</div>;

  return (
    <div>
      <PageHero eyebrow="About Us" title={data.hero_heading} description={data.hero_description} image={mediaUrl(data.hero_image)} />
      <div className="mx-auto max-w-6xl px-4 py-24 md:px-8 md:py-32">
        <div className="space-y-24 md:space-y-32">
          {(data.sections || []).filter((s) => s.visible).map((s, i) => (
            <Reveal key={s.key}>
              <div className={`grid grid-cols-1 items-center gap-10 lg:gap-16 ${s.image ? "lg:grid-cols-2" : ""}`}>
                <div className={i % 2 && s.image ? "lg:order-2" : ""}>
                  <p className="overline text-terracotta">0{i + 1}</p>
                  <h2 className="mt-3 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">{s.heading}</h2>
                  <p className="mt-5 text-base leading-relaxed text-ink/65 md:text-lg">{s.description}</p>
                </div>
                {s.image && <img src={mediaUrl(s.image)} alt={s.heading} className="aspect-[4/3] w-full rounded-3xl object-cover" />}
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-24 flex justify-center"><BookNowButton size="lg" label={data.cta_text} testId="about-book-now-btn" /></div>
      </div>
    </div>
  );
}
