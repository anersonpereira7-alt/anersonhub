import { createFileRoute } from "@tanstack/react-router";
import { useHubData } from "@/lib/hub-data";
import { PageShell, SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade · CupomHub" },
      { name: "description", content: "Como tratamos dados no hub de cupons e links de afiliado." },
      { property: "og:title", content: "Política de privacidade · CupomHub" },
      { property: "og:description", content: "Como tratamos dados no hub de cupons e links de afiliado." },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  const { textos } = useHubData();
  return (
    <PageShell>
      <SiteHeader />
      <article className="glass-panel mt-4 rounded-2xl p-5">
        <h1 className="font-display text-xl font-bold">Política de privacidade</h1>
        <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-ink/70">{textos.privacidade}</p>
      </article>
      <SiteFooter />
    </PageShell>
  );
}
