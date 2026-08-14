import { usePublic } from "../../lib/usePublic";
import { PageHero } from "../../components/public/PageHero";
import { PackageCard } from "./Home";

export default function Packages() {
  const { data } = usePublic("/public/packages");
  const packages = data || [];
  return (
    <div>
      <PageHero eyebrow="Packages" title="Curated bundles, best value" description="Thoughtfully combined services that give your pet more care and you more value." />
      <div className="mx-auto max-w-7xl px-4 py-24 md:px-8 md:py-32">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((p, i) => <PackageCard key={p.id} p={p} delay={(i % 3) * 0.05} />)}
        </div>
      </div>
    </div>
  );
}
