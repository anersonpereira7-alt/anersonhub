import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { getHubContent } from "@/lib/hub.functions";
import { useHubData, artigosAtivos, type Artigo } from "@/lib/hub-data";
import { PageShell, SiteFooter } from "@/components/SiteChrome";
import { AdBanner } from "@/components/AdBanner";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog · Anerson Hub de Ofertas" },
      {
        name: "description",
        content:
          "Dicas de compras, economia no dia a dia e explicações sem enrolação: artigos curtos para você comprar melhor e gastar menos.",
      },
      { property: "og:title", content: "Blog · Anerson Hub de Ofertas" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Artigos curtos, em linguagem simples, sobre compras, economia e o dia a dia.",
      },
    ],
  }),
  loader: () => getHubContent(),
  component: Blog,
});

function dataFmt(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(
      new Date(iso),
    );
  } catch {
    return "";
  }
}

function Blog() {
  const inicial = useLoaderData({ strict: false }) as string | null | undefined;
  const data = useHubData(inicial);
  const artigos = artigosAtivos(data).sort((a, b) => {
    if (!!b.destaque !== !!a.destaque) return b.destaque ? 1 : -1;
    return (b.criadoEm || "").localeCompare(a.criadoEm || "");
  });

  return (
    <PageShell>
      <header className="glass-panel rounded-2xl p-4">
        <Link to="/" className="text-[12px] font-semibold text-brand">
          ← Voltar para as ofertas
        </Link>
        <h1 className="mt-2 font-display text-2xl font-bold leading-tight">Blog</h1>
        <p className="mt-1 text-[13px] leading-snug text-ink/65">
          Papo reto sobre compras, economia e o dia a dia. Sem palavra difícil e sem enrolação.
        </p>
      </header>

      {artigos.length === 0 ? (
        <p className="glass-panel mt-4 rounded-2xl p-6 text-center text-[13px] text-ink/60">
          Ainda não tem artigo aqui. Volte em breve.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {artigos.map((a, i) => (
            <div key={a.id}>
              <CardArtigo artigo={a} />
              {i === 2 && <AdBanner local="blog" slot={0} />}
            </div>
          ))}
        </div>
      )}

      <AdBanner local="blog" slot={1} />
      <SiteFooter />
    </PageShell>
  );
}

function CardArtigo({ artigo }: { artigo: Artigo }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: artigo.slug }}
      className="glass-panel flex gap-3 rounded-2xl p-3 transition active:scale-[0.99]"
    >
      {artigo.imagem ? (
        <img
          src={artigo.imagem}
          alt=""
          className="size-20 shrink-0 rounded-xl object-cover"
          width={80}
          height={80}
        />
      ) : (
        <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-brand/10 font-display text-lg font-bold text-brand">
          {artigo.titulo.slice(0, 1)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
            {artigo.tempoLeitura || 1} min
          </span>
          {artigo.destaque && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
              em alta
            </span>
          )}
        </div>
        <h2 className="mt-1 font-display text-[15px] font-bold leading-snug">{artigo.titulo}</h2>
        <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-ink/60">{artigo.resumo}</p>
        <p className="mt-1 text-[11px] text-ink/40">{dataFmt(artigo.criadoEm)}</p>
      </div>
    </Link>
  );
}
