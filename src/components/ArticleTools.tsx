import { useEffect, useRef, useState } from "react";
import { buscarExtras, urlDoAudio } from "@/lib/extras";

const ESCALA_MIN = 0.9;
const ESCALA_MAX = 1.5;

/**
 * Barra de leitura do artigo: tamanho da letra, Libras e áudio.
 * Fica fixa no topo do texto, sempre no mesmo lugar, sem cobrir nada.
 */
export function BarraAcessibilidade({
  escala,
  setEscala,
  artigoId,
  temAudio,
  minutos,
}: {
  escala: number;
  setEscala: (v: number) => void;
  artigoId: string;
  temAudio: boolean;
  minutos: number;
}) {
  const [audio, setAudio] = useState<string | null>(null);
  const [preparando, setPreparando] = useState(false);
  const [aviso, setAviso] = useState("");
  const [libras, setLibras] = useState<"off" | "carregando" | "on">("off");
  const urlAudio = useRef<string | null>(null);

  useEffect(() => () => { if (urlAudio.current) URL.revokeObjectURL(urlAudio.current); }, []);

  function ajustar(passo: number) {
    const v = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, Math.round((escala + passo) * 10) / 10));
    setEscala(v);
  }

  async function ouvir() {
    if (audio) {
      setAudio(null);
      return;
    }
    setPreparando(true);
    setAviso("");
    const ex = await buscarExtras(artigoId);
    if (!ex?.audio) {
      setAviso("Este artigo ainda não tem versão em áudio.");
      setPreparando(false);
      return;
    }
    const url = urlDoAudio(ex);
    urlAudio.current = url;
    setAudio(url);
    setPreparando(false);
  }

  async function alternarLibras() {
    if (libras === "on") {
      fecharLibras();
      setLibras("off");
      return;
    }
    setLibras("carregando");
    try {
      await carregarVLibras();
      document.querySelector<HTMLElement>(".vw-a11y-access-button")?.click();
      setLibras("on");
    } catch {
      setAviso("Não foi possível abrir as Libras agora. Tente novamente.");
      setLibras("off");
    }
  }

  return (
    <div className="glass-panel sticky top-2 z-20 mt-4 rounded-2xl p-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="flex items-center gap-1 rounded-xl bg-white/70 p-1" role="group" aria-label="Tamanho da letra">
          <button
            type="button"
            onClick={() => ajustar(-0.1)}
            disabled={escala <= ESCALA_MIN}
            className="grid size-8 place-items-center rounded-lg text-[13px] font-bold text-ink/70 transition active:scale-95 disabled:opacity-35"
            aria-label="Diminuir a letra"
          >
            A−
          </button>
          <span className="min-w-[34px] text-center text-[11px] font-semibold tabular-nums text-ink/45">
            {Math.round(escala * 100)}%
          </span>
          <button
            type="button"
            onClick={() => ajustar(0.1)}
            disabled={escala >= ESCALA_MAX}
            className="grid size-8 place-items-center rounded-lg text-[16px] font-bold text-ink/70 transition active:scale-95 disabled:opacity-35"
            aria-label="Aumentar a letra"
          >
            A+
          </button>
        </div>

        <span className="rounded-xl bg-white/70 px-2.5 py-1.5 text-[11px] font-medium text-ink/55">
          {minutos} min de leitura
        </span>

        <button
          type="button"
          onClick={alternarLibras}
          aria-pressed={libras === "on"}
          className="rounded-xl bg-white/70 px-3 py-1.5 text-[12px] font-semibold text-ink/75 transition active:scale-95 hover:bg-white"
        >
          🤟 Libras{libras === "carregando" ? "…" : libras === "on" ? " ✓" : ""}
        </button>

        {temAudio && (
          <button
            type="button"
            onClick={ouvir}
            aria-pressed={!!audio}
            className="ml-auto rounded-xl bg-brand px-3 py-1.5 text-[12px] font-semibold text-white transition active:scale-95"
          >
            {audio ? "■ Parar de ouvir" : preparando ? "Preparando áudio…" : "▶ Ouvir este artigo"}
          </button>
        )}
      </div>

      {audio && (
        <audio controls autoPlay src={audio} className="mt-2 h-9 w-full" aria-label="Áudio do artigo" />
      )}
      {aviso && <p className="mt-1.5 px-1 text-[11px] text-ink/50">{aviso}</p>}
    </div>
  );
}

/* ------------------------------ VLibras ------------------------------ */

declare global {
  interface Window {
    VLibras?: new (source: string, target?: string, opts?: unknown) => { open?: () => void };
  }
}

const SCRIPT_VLIBRAS = "https://vlibras.gov.br/app/vlibras-plugin.js";

function carregarVLibras(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    if (document.querySelector("[data-vlibras]") && window.VLibras) {
      resolver();
      return;
    }
    if (!document.querySelector("[data-vlibras]")) {
      const caixa = document.createElement("div");
      caixa.setAttribute("data-vlibras", "");
      caixa.className = "enabled";
      caixa.setAttribute("vw", "");
      caixa.innerHTML =
        '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
      document.body.appendChild(caixa);
    }
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_VLIBRAS}"]`);
    if (existente) {
      existente.addEventListener("load", () => resolver());
      existente.addEventListener("error", () => rejeitar(new Error("script falhou")));
      if (window.VLibras) resolver();
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT_VLIBRAS;
    s.async = true;
    s.onload = () => {
      try {
        new window.VLibras!("https://vlibras.gov.br/app");
        window.setTimeout(() => resolver(), 900);
      } catch {
        rejeitar(new Error("widget falhou"));
      }
    };
    s.onerror = () => rejeitar(new Error("script falhou"));
    document.head.appendChild(s);
  });
}

function fecharLibras() {
  const botao = document.querySelector<HTMLElement>(".vw-a11y-access-button");
  const janela = document.querySelector<HTMLElement>(".vw-a11y-widget-container");
  if (janela?.style.display !== "none") botao?.click();
}
