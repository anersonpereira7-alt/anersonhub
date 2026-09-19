import { Ticket } from "lucide-react";
import type { Loja } from "@/lib/hub-data";

export function StoreCard({ loja, onVerCupons }: { loja: Loja; onVerCupons: (l: Loja) => void }) {
  const temCupom = loja.temCupom && loja.cupons.length > 0;
  return (
    <div
      className={
        temCupom
          ? "glass-panel rounded-2xl p-4"
          : "rounded-2xl border border-glass-border bg-white/40 p-4 backdrop-blur-xl"
      }
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-lg font-bold">{loja.nome}</span>
        {temCupom ? (
          <span className="relative inline-block">
            <span className="coupon-pulse grid size-8 place-items-center rounded-xl bg-gradient-to-br from-pink-400 to-brand text-white">
              <Ticket className="size-4" />
            </span>
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-white" />
          </span>
        ) : (
          <span className="text-[11px] text-ink/40">sem cupom hoje</span>
        )}
      </div>
      {loja.descricao ? <p className="mt-0.5 text-[12px] text-ink/55">{loja.descricao}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          disabled={!temCupom}
          onClick={() => onVerCupons(loja)}
          className={
            temCupom
              ? "flex-1 rounded-xl bg-gradient-to-r from-brand to-violet px-3 py-2.5 text-[13px] font-semibold text-primary-foreground transition active:scale-95"
              : "flex-1 cursor-not-allowed rounded-xl bg-muted px-3 py-2.5 text-[13px] font-semibold text-muted-foreground/60"
          }
        >
          Ver cupons
        </button>
        <a
          href={loja.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-xl border border-brand/30 bg-white/70 px-3 py-2.5 text-center text-[13px] font-semibold text-brand transition active:scale-95"
        >
          Acessar loja
        </a>
      </div>
    </div>
  );
}
