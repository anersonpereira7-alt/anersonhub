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
    const i = (Math.floor(Math.random() * disponiveis.length) + slot) % disponiveis.length;
    setEscolhido(disponiveis[i]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, slot, disponiveis.map((a) => a.id).join(",")]);

  if (!escolhido) return null;

  return (
    <section className="glass-panel mt-4 overflow-hidden rounded-2xl p-2.5" aria-label="Publicidade">
      <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wide text-ink/35">Publicidade</p>
      {escolhido.tipo === "imagem" && escolhido.imagem ? (
        escolhido.link ? (
          <a href={escolhido.link} target="_blank" rel="noopener noreferrer sponsored" className="block">
            <img src={escolhido.imagem} alt={escolhido.tag} className="mx-auto block max-w-full rounded-xl" />
          </a>
        ) : (
          <img src={escolhido.imagem} alt={escolhido.tag} className="mx-auto block max-w-full rounded-xl" />
        )
      ) : escolhido.codigo ? (
        <iframe
          title={`Anúncio ${escolhido.tag}`}
          srcDoc={docDe(escolhido.codigo)}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          scrolling="no"
          className="mx-auto block h-[110px] w-full max-w-[360px] border-0"
        />
      ) : null}
    </section>
  );
}
