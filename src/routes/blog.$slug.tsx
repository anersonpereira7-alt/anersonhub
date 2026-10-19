import { createFileRoute, Link, useLoaderData, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getHubContent } from "@/lib/hub.functions";
import {
  useHubData,
  artigoPorSlug,
  textoDoArtigo,
  tempoDeLeitura,
  type HubData,
} from "@/lib/hub-data";
import { PageShell, SiteFooter } from "@/components/SiteChrome";
import { AdBanner } from "@/components/AdBanner";
import { ViniResumo } from "@/components/ViniResumo";
import { BarraAcessibilidade } from "@/components/ArticleTools";

const CHAVE_ESCALA = "leitura-escala";

export const Route = createFileRoute("/blog/$slug")({
  head: ({
    loaderData,
  }: {
    loaderData?: { titulo: string; resumo: string; slug: string } | undefined;
  }) => {
    if (!loaderData?.titulo) {
      return {
        meta: [
          { title: "Artigo indisponível · Anerson Hub de Ofertas" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const titulo = `${loaderData.titulo} · Anerson Hub de Ofertas`;
    return {
      meta: [
        { title: titulo },
        { name: "description", content: loaderData.resumo.slice(0, 180) },
        { property: "og:title", content: titulo },
        { property: "og:type", content: "article" },
        { property: "og:description", content: loaderData.resumo.slice(0, 180) },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: async ({ params }) => {
    const inicial = await getHubContent();
    const d = ler(inicial);
    const artigo = artigoPorSlug(d, params.slug);
    if (!artigo || !artigo.ativo) throw notFound();
    return {
      inicial,
      id: artigo.id,
      slug: artigo.slug,
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      temResumo: artigo.temResumo,
      temAudio: artigo.temAudio,
      minutos: artigo.tempoLeitura || tempoDeLeitura(textoDoArtigo(artigo)),
    };
  },
  notFoundComponent: () => (
    <PageShell>
      <div className="glass-panel rounded-2xl p-6 text-center">
        <p className="font-display text-lg font-bold">Esse artigo não está disponível</p>
        <Link to="/blog" className="mt-3 inline-block text-[13px] font-semibold text-brand">
          Ver todos os artigos
        </Link>
      </div>
    </PageShell>
  ),
  component: ArtigoPagina,
});

function ler(inicial?: string | null): HubData {
  if (!inicial) return { artigos: [] } as unknown as HubData;
  try {
    return JSON.parse(inicial) as HubData;
  } catch {
    return { artigos: [] } as unknown as HubData;
  }
}

function ArtigoPagina() {
  const dados = useLoaderData({ strict: false }) as
    | {
        inicial?: string | null;
        id: string;
        slug: string;
        titulo: string;
        resumo: string;
        temResumo: boolean;
        temAudio: boolean;
        minutos: number;
      }
    | undefined;
  const data = useHubData(dados?.inicial);
  const artigo = data.artigos?.find((a) => a.id === dados?.id);
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    const salvo = Number(window.localStorage.getItem(CHAVE_ESCALA));
    if (salvo >= 0.9 && salvo <= 1.5) setEscala(salvo);
  }, []);
  useEffect(() => {
    window.localStorage.setItem(CHAVE_ESCALA, String(escala));
  }, [escala]);

  if (!artigo || !dados) return null;

  return (
    <PageShell>
      <article>
        <header className="glass-panel rounded-2xl p-4">
          <Link to="/blog" className="text-[12px] font-semibold text-brand">
            ← Blog
          </Link>
          <h1 className="mt-2 font-display text-[22px] font-bold leading-tight">{artigo.titulo}</h1>
          <p className="mt-1.5 text-[13px] leading-snug text-ink/65">{artigo.resumo}</p>
        </header>

        <BarraAcessibilidade
          escala={escala}
          setEscala={setEscala}
          artigoId={artigo.id}
          temAudio={!!artigo.temAudio}
          minutos={dados.minutos}
        />

        <ViniResumo artigoId={artigo.id} temResumo={!!artigo.temResumo} />

        {artigo.imagem && (
          <img
            src={artigo.imagem}
            alt=""
            className="mt-1 w-full rounded-2xl object-cover"
            style={{ aspectRatio: "16 / 9" }}
          />
        )}

        <div className="artigo mt-4" style={{ "--fs": escala } as React.CSSProperties}>
          {artigo.blocos.map((b) =>
            b.tipo === "titulo" ? (
              <h2 key={b.id}>{b.texto}</h2>
            ) : b.tipo === "texto" ? (
              <p key={b.id}>{b.texto}</p>
            ) : (
              <AdBanner key={b.id} local="bloco" formato="retangulo" apenasIds={b.anuncios} slot={0} />
            ),
          )}
        </div>

        <AdBanner local="blog" slot={2} />
      </article>

      <SiteFooter />
    </PageShell>
  );
}
