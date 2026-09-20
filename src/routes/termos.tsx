import { createFileRoute } from "@tanstack/react-router";
import { useHubData } from "@/lib/hub-data";
import { PageShell, SiteFooter } from "@/components/SiteChrome";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso · CupomHub" },
      { name: "description", content: "Termos de uso do hub de cupons e links de afiliado." },
      { property: "og:title", content: "Termos de uso · CupomHub" },
      { property: "og:description", content: "Termos de uso do hub de cupons e links de afiliado." },
    ],
  }),
  component: Termos,
});

function Termos() {
  const { textos } = useHubData();
  return (
    <PageShell>
      <article className="glass-panel rounded-2xl p-5">
        <h1 className="font-display text-xl font-bold">Termos de uso</h1>
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink/70">{textos.termos}</p>
      </article>
      <SiteFooter />
    </PageShell>
  );
}
