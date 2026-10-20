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
  const d = useHubData();
  const lista = useMemo(
    () => anunciosDe(d, local).filter((a) => !apenasIds || apenasIds.includes(a.id)),
    [d, local, apenasIds],
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
  return html;
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
  const frameStyle = {
    width: "100%",
    maxWidth: medida.largura,
    height: medida.altura,
    display: "block" as const,
  };

  const r = rotulo.toUpperCase();
  const textoRótulo = r === "PUBLICIDADE" ? "text-ink/35" : "text-emerald-600/80 dark:text-emerald-400/80";

  return (
    <div className="my-5 flex flex-col items-center gap-1.5" style={{ width: "100%", maxWidth: medida.largura }} data-slot={slot}>
      <span className={`text-[9px] font-semibold uppercase tracking-[0.18em] ${textoRótulo}`}>{r}</span>
      {anuncio.tipo === "script" ? (
        <iframe
          key={anuncio.id}
          title={anuncio.tag}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
          srcDoc={docDe(anuncio)}
          className="block rounded-xl border-0 bg-transparent"
          style={frameStyle}
          scrolling="no"
        />
      ) : anuncio.imagem ? (
        <a
          href={anuncio.link || undefined}
          target={anuncio.link ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="block overflow-hidden rounded-xl"
          style={{ width: "100%", maxWidth: medida.largura }}
        >
          <img
            src={anuncio.imagem}
            alt={anuncio.tag}
            className="block h-auto w-full"
            style={{
              width: "100%",
              aspectRatio: `${medida.largura} / ${medida.altura}`,
              objectFit: "cover",
            }}
          />
        </a>
      ) : null}
    </div>
  );
}
