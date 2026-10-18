import { useMemo } from "react";
import { useHubData, anunciosDe, sortearAnuncio, FORMATOS, type Anuncio, type FormatoAnuncio } from "@/lib/hub-data";

/**
 * Espaço publicitário do hub.
 * O container acompanha o tamanho da arte (320×50, 300×250, quadrado, 320×600)
 * para o banner não ficar solto dentro de uma caixa grande.
 */
export function AdBanner({
  local,
  slot = 0,
  formato = "barra",
  apenasIds,
  rotulo = "Publicidade",
}: {
  local: string;
  slot?: number;
  formato?: FormatoAnuncio;
  apenasIds?: string[];
  rotulo?: string;
}) {
  const { anuncios } = useHubData();
  const lista = useMemo(
    () => anunciosDe({ anuncios } as never, local).filter((a) => !apenasIds || apenasIds.includes(a.id)),
    [anuncios, local, apenasIds],
  );
  const escolha = useMemo(() => sortearAnuncio(lista), [lista]);
  if (!escolha) return null;
  return <AnuncioView anuncio={escolha} formato={formato} rotulo={rotulo} slot={slot} />;
}

function docDe(a: Anuncio) {
  const body = (a.codigo ?? "").trim();
  const html = `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style>
</head><body>${body}</body></html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

export function AnuncioView({
  anuncio,
  formato = "barra",
  rotulo = "Publicidade",
  slot = 0,
}: {
  anuncio: Anuncio;
  formato?: FormatoAnuncio;
  rotulo?: string;
  slot?: number;
}) {
  const medida = FORMATOS[formato] ?? FORMATOS.barra;
  const estilo = { width: medida.largura, maxWidth: "100%" as const };

  return (
    <div className="my-5 flex flex-col items-center gap-1.5" style={{ maxWidth: medida.largura }} data-slot={slot}>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-ink/35">{rotulo}</span>
      {anuncio.tipo === "script" ? (
        <iframe
          key={anuncio.id}
          title={anuncio.tag}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          srcDoc={docDe(anuncio)}
          className="block rounded-xl border-0 bg-transparent"
          style={{ height: medida.altura, ...estilo }}
          scrolling="no"
        />
      ) : anuncio.imagem ? (
        <a
          href={anuncio.link || undefined}
          target={anuncio.link ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl"
          style={estilo}
        >
          <img
            src={anuncio.imagem}
            alt={anuncio.tag}
            className="block h-auto w-full"
            style={{ aspectRatio: `${medida.largura} / ${medida.altura}`, objectFit: "cover" }}
          />
        </a>
      ) : null}
    </div>
  );
}
