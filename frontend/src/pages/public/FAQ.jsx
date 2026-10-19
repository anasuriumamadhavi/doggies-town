import { useMemo, useState } from "react";
import { usePublic } from "../../lib/usePublic";
import { PageHero } from "../../components/public/PageHero";
import { BookNowButton } from "../../components/public/Buttons";
import { Plus } from "lucide-react";

export default function FAQ() {
  const { data } = usePublic("/public/faqs");
  const faqs = useMemo(() => data || [], [data]);
  const [active, setActive] = useState("All");
  const categories = useMemo(() => ["All", ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))], [faqs]);
  const filtered = useMemo(() => (active === "All" ? faqs : faqs.filter((f) => f.category === active)), [active, faqs]);

  return (
    <div>
      <PageHero eyebrow="FAQ" title="Questions, answered" description="Everything you need to know before your pet's visit." />
      <div className="mx-auto max-w-4xl px-4 py-20 md:px-8 md:py-28">
        <div className="mb-10 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setActive(c)} data-testid={`faq-filter-${c.toLowerCase()}`}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${active === c ? "bg-terracotta text-white" : "border border-ink/10 text-ink/70 hover:border-ink/30"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="divide-y divide-black/5 border-y border-black/5">
          {filtered.map((f) => (
            <details key={f.id} className="group py-6" data-testid={`faq-item-${f.id}`}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium text-ink">
                {f.question}
                <Plus className="h-5 w-5 shrink-0 text-terracotta transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="mt-4 text-base leading-relaxed text-ink/60">{f.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-white p-10 text-center">
          <h3 className="font-display text-2xl font-medium text-ink">Still have questions?</h3>
          <p className="text-ink/60">Reach out to our team or book a visit.</p>
          <BookNowButton testId="faq-book-now-btn" />
        </div>
      </div>
    </div>
  );
}
