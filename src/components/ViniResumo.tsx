import { useEffect, useRef, useState } from "react";
import { buscarExtras } from "@/lib/extras";
import vini3d from "@/assets/vini-3d.png";

type Estado = "fechado" | "lendo" | "pronto" | "vazio";

/**
 * Banner que revela o resumo do Vini. Ao apertar, o botão vira o cartão:
 * primeiro "Vini está lendo o artigo...", depois "Vini está resumindo para você...",
 * e então o texto aparece com a borda em movimento.
 */
export function ViniResumo({ artigoId, temResumo }: { artigoId: string; temResumo: boolean }) {
  const [estado, setEstado] = useState<Estado>("fechado");
  const [texto, setTexto] = useState("");
  const [fase, setFase] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  async function abrir() {
    if (estado !== "fechado") return;
    setEstado("lendo");
    setFase(0);
    timer.current = window.setTimeout(() => setFase(1), 2600);
    const [ex] = await Promise.all([
      buscarExtras(artigoId),
      new Promise((s) => window.setTimeout(s, 2000)),
    ]);
    const resumo = ex?.resumo?.trim();
    if (resumo) {
      setTexto(resumo);
      setEstado("pronto");
    } else {
      setEstado("vazio");
    }
  }

  if (!temResumo && estado === "fechado") return null;

  return (
    <div className="my-6">
      {estado === "fechado" && (
        <button
          type="button"
          onClick={abrir}
          className="flex w-full items-center gap-3 rounded-2xl border border-brand/25 bg-brand/5 p-3.5 text-left transition active:scale-[0.99] hover:bg-brand/10"
        >
          <img src={vini3d} alt="" width={40} height={40} className="size-10 shrink-0 object-contain" />
          <span className="min-w-0">
            <span className="block font-display text-[14px] font-bold text-ink">Ver resumo do Vini</span>
            <span className="block text-[12px] text-ink/55">Sem ler tudo? O Vini conta o essencial.</span>
          </span>
          <span aria-hidden className="ml-auto text-brand">
            ▶
          </span>
        </button>
      )}

      {estado === "lendo" && (
        <div className="flex items-center gap-3 rounded-2xl border border-brand/25 bg-brand/5 p-4">
          <img src={vini3d} alt="" width={40} height={40} className="size-10 shrink-0 animate-pulse object-contain" />
          <span className="min-w-0">
            <span className="block font-display text-[14px] font-bold text-ink">
              {fase === 0 ? "Vini está lendo o artigo..." : "Vini está resumindo para você..."}
            </span>
            <span className="mt-1.5 flex gap-1" aria-hidden>
              <i className="size-1.5 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
              <i className="size-1.5 animate-bounce rounded-full bg-brand/70 [animation-delay:-0.15s]" />
              <i className="size-1.5 animate-bounce rounded-full bg-brand/40" />
            </span>
          </span>
        </div>
      )}

      {estado === "vazio" && (
        <p className="rounded-2xl border border-dashed border-glass-border bg-white/50 p-4 text-[13px] text-ink/60">
          O Vini ainda não preparou o resumo deste artigo.
        </p>
      )}

      {estado === "pronto" && (
        <div className="resumo-borda animar-entrada bg-white p-4">
          <div className="flex items-center gap-2">
            <img src={vini3d} alt="" width={24} height={24} className="size-6 shrink-0 object-contain" />
            <span className="font-display text-[12px] font-bold uppercase tracking-wide text-brand">Resumo do Vini</span>
            <button
              type="button"
              onClick={() => setEstado("fechado")}
              className="ml-auto rounded-lg px-2 py-1 text-[11px] font-semibold text-ink/50 transition hover:bg-ink/5"
            >
              Ocultar
            </button>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-wrap text-ink/85">{texto}</p>
        </div>
      )}
    </div>
  );
}
