import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useHubData, type Loja } from "@/lib/hub-data";
import { Icon3D } from "@/components/Icon3D";
import { PageShell, SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { StoreCard } from "@/components/StoreCard";
import { CouponDialog } from "@/components/CouponDialog";
import perfilFoto from "@/assets/perfil.jpg";
import vini3d from "@/assets/vini-3d.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CupomHub · Cupons e ofertas selecionadas" },
      {
        name: "description",
        content: "Hub de cupons e links de afiliado: categorias, lojas parceiras e códigos de desconto atualizados.",
      },
      { property: "og:title", content: "CupomHub · Cupons e ofertas selecionadas" },
      {
        property: "og:description",
        content: "Encontre cupons de desconto por categoria e acesse as lojas parceiras em um toque.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const data = useHubData();
  const [lojaAberta, setLojaAberta] = useState<Loja | null>(null);
  const categorias = data.categorias.filter((c) => c.ativa);
  const destaques = data.lojas.filter((l) => l.ativa && l.temCupom && l.cupons.length > 0).slice(0, 2);

  return (
    <PageShell>
      <SiteHeader />

      <section className="glass-panel mt-4 flex items-center gap-3 rounded-2xl p-3.5">
        <img
          src={perfilFoto}
          alt={data.perfil.nome}
          width={56}
          height={56}
          className="size-14 shrink-0 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <h1 className="font-display text-lg font-bold leading-tight">{data.perfil.nome}</h1>
          <p className="mt-0.5 text-[13px] leading-snug text-ink/65">{data.perfil.descricao}</p>
        </div>
      </section>

      <section className="mt-4">
        <div className="mb-2.5 flex items-center justify-between px-1">
          <h2 className="font-display text-sm font-semibold text-ink/80">Categorias</h2>
          <span className="text-[11px] text-ink/45">{categorias.length} áreas</span>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {categorias.map((c) => (
            <Link
              key={c.id}
              to="/categoria/$slug"
              params={{ slug: c.slug }}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-glass-border bg-white/55 p-2.5 text-center backdrop-blur-md transition active:scale-95"
            >
              <Icon3D iconId={c.iconId} />
              <span className="text-[11px] font-medium leading-tight text-ink/75">{c.nome}</span>
            </Link>
          ))}
        </div>
      </section>

      {destaques.length > 0 ? (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-sm font-semibold text-ink/80">Lojas em destaque</h2>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
              com cupom
            </span>
          </div>
          <div className="space-y-3">
            {destaques.map((l) => (
              <StoreCard key={l.id} loja={l} onVerCupons={setLojaAberta} />
            ))}
          </div>
        </section>
      ) : null}

      <Link to="/admin" className="glass-panel mt-5 flex items-center gap-3 rounded-2xl p-3">
        <img src={vini3d} alt="Vini" width={48} height={48} loading="lazy" className="size-12 shrink-0 object-contain" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[13px] font-semibold">Vini · Assistente de IA</span>
          <span className="block text-[12px] text-ink/55">Cuida do painel: categorias, lojas e cupons.</span>
        </span>
      </Link>

      <SiteFooter />
      <CouponDialog loja={lojaAberta} onOpenChange={(o) => !o && setLojaAberta(null)} />
    </PageShell>
  );
}
