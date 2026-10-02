import { useEffect, useState } from "react";
import { anunciosDe, useHubData, type Anuncio } from "@/lib/hub-data";

/** Envolve o código do anunciante num documento isolado. */
function docDe(codigo: string) {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;background:transparent;overflow:hidden}</style></head><body>${codigo}</body></html>`;
}

/**
 * Espaço publicitário com sorteio aleatório entre os anúncios ativos do local.
 * `local` é "home" ou o id da categoria. `slot` separa espaços na mesma página.
 */
export function AdBanner({ local, slot = 0 }: { local: string; slot?: number }) {
  const data = useHubData();
  const disponiveis = anunciosDe(data, local);
  const [escolhido, setEscolhido] = useState<Anuncio | null>(null);

  useEffect(() => {
    if (disponiveis.length === 0) {
      setEscolhido(null);
      return;
    }
    // Sorteio ponderado: anúncios destaque têm peso 2.
    const pesos = disponiveis.map((a) => (a.destaque ? 2 : 1));
    const total = pesos.reduce((s, p) => s + p, 0);
    let r = Math.random() * total;
    let i = 0;
    for (; i < pesos.length - 1; i++) {
      r -= pesos[i];
      if (r < 0) break;
    }
    if (slot && disponiveis.length > 1) i = (i + slot) % disponiveis.length;
    setEscolhido(disponiveis[i] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, slot, disponiveis.map((a) => `${a.id}${a.destaque ? "*" : ""}`).join(",")]);

  if (!escolhido) return null;

  return (
    <section className="mx-auto mt-4 flex w-full max-w-[320px] flex-col items-center" aria-label="Publicidade">
      <p className="mb-1 text-[9px] font-semibold uppercase tracking-wider text-ink/35">Publicidade</p>
      {escolhido.tipo === "imagem" && escolhido.imagem ? (
        escolhido.link ? (
          <a href={escolhido.link} target="_blank" rel="noopener noreferrer sponsored" className="block w-full">
            <img src={escolhido.imagem} alt={escolhido.tag} className="block h-auto w-full rounded-xl" />
          </a>
        ) : (
          <img src={escolhido.imagem} alt={escolhido.tag} className="block h-auto w-full rounded-xl" />
        )
      ) : escolhido.codigo ? (
        <iframe
          title={`Anúncio ${escolhido.tag}`}
          srcDoc={docDe(escolhido.codigo)}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          scrolling="no"
          className="block h-[50px] w-[320px] max-w-full overflow-hidden rounded-xl border-0"
        />
      ) : null}
    </section>
  );
}
