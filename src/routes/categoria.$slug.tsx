import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Info } from "lucide-react";
import { categoriaPorSlug, lojasDaCategoria, useHubData, type Loja } from "@/lib/hub-data";
import { Icon3D } from "@/components/Icon3D";
import { PageShell, SiteFooter } from "@/components/SiteChrome";
import { StoreCard } from "@/components/StoreCard";
import { CouponDialog } from "@/components/CouponDialog";
import { AgeGate } from "@/components/AgeGate";
import { getHubContent } from "@/lib/hub.functions";

export const Route = createFileRoute("/categoria/$slug")({
  head: ({ params }) => {
    const nome = params.slug.replace(/-/g, " ");
    const titulo = `Cupons de ${nome} · CupomHub`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: `Lojas parceiras e cupons de desconto na categoria ${nome}.` },
        { property: "og:title", content: titulo },
        { property: "og:description", content: `Lojas parceiras e cupons de desconto na categoria ${nome}.` },
      ],
    };
  },
  loader: () => getHubContent(),
  errorComponent: () => <CategoriaPage />,
  notFoundComponent: () => <CategoriaPage />,
  component: CategoriaPage,
});

function CategoriaPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const inicial = Route.useLoaderData({ strict: false }) as string | null | undefined;
  const data = useHubData(inicial);
  const categoria = categoriaPorSlug(data, slug);
  const [lojaAberta, setLojaAberta] = useState<Loja | null>(null);
  const [idadeOk, setIdadeOk] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  if (!categoria || !categoria.ativa) {
    return (
      <PageShell>
        <div className="glass-panel mt-6 rounded-2xl p-6 text-center">
          <p className="font-display text-lg font-bold">Categoria indisponível</p>
          <Link to="/" className="mt-3 inline-block text-sm font-semibold text-brand">
            Voltar para a home
          </Link>
        </div>
      </PageShell>
    );
  }

  const lojas = [...lojasDaCategoria(data, categoria.id)].sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR"),
  );
  const precisaIdade = categoria.restrita && !idadeOk;

  return (
    <PageShell>
      {categoria.restrita && idadeOk && categoria.aviso ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-brand/30 bg-brand/10 p-3 text-[12px] font-medium text-ink/75">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          <span>{categoria.aviso}</span>
        </div>
      ) : null}

      <section className="glass-panel mt-4 flex items-center gap-3 rounded-2xl p-3.5">
        <Icon3D iconId={categoria.iconId} className="size-14 rounded-2xl" iconClassName="size-7" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold leading-tight">{categoria.nome}</h1>
          <p className="mt-0.5 text-[13px] leading-snug text-ink/65">{categoria.descricao}</p>
        </div>
      </section>

      <div className="mt-4 flex items-center justify-between px-1">
        <h2 className="font-display text-sm font-semibold text-ink/80">Lojas parceiras</h2>
        <span className="text-[11px] text-ink/45">{lojas.length} lojas</span>
      </div>

      <section className="mt-2 space-y-3">
        {lojas.length === 0 ? (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/55">
            Ainda não há lojas cadastradas nesta categoria.
          </p>
        ) : (
          lojas.map((l) => <StoreCard key={l.id} loja={l} onVerCupons={setLojaAberta} />)
        )}
      </section>

      <Link to="/" className="mt-5 flex items-center gap-1.5 px-1 text-[13px] font-semibold text-brand">
        <ArrowLeft className="size-4" /> Todas as categorias
      </Link>

      <SiteFooter />
      <CouponDialog loja={lojaAberta} onOpenChange={(o) => !o && setLojaAberta(null)} />
      <AgeGate
        open={precisaIdade}
        bloqueado={bloqueado}
        onMaior={() => setIdadeOk(true)}
        onMenor={() => {
          setBloqueado(true);
          setTimeout(() => navigate({ to: "/" }), 2200);
        }}
      />
    </PageShell>
  );
}
