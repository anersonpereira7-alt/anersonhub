import { useState } from "react";
import { Check, Copy, Ticket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Loja } from "@/lib/hub-data";

export function CouponDialog({
  loja,
  onOpenChange,
}: {
  loja: Loja | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      /* ignora */
    }
    setCopiado(codigo);
    setTimeout(() => setCopiado(null), 1800);
  }

  return (
    <Dialog open={!!loja} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[360px] rounded-3xl border-glass-border bg-white/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Ticket className="size-5 text-brand" />
            Cupons · {loja?.nome}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {loja?.cupons.map((c) => (
            <div key={c.id} className="rounded-2xl border border-glass-border bg-white/70 p-3">
              <div className="flex items-center gap-2 rounded-xl bg-brand/10 p-1.5">
                <span className="flex-1 px-2 font-display text-base font-bold tracking-widest text-ink">
                  {c.codigo}
                </span>
                <button
                  onClick={() => copiar(c.codigo)}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-brand to-violet px-3 py-2 text-xs font-semibold text-primary-foreground transition active:scale-95"
                >
                  {copiado === c.codigo ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  {copiado === c.codigo ? "Copiado" : "Copiar"}
                </button>
              </div>
              {c.descricao ? <p className="mt-2 text-[12px] text-ink/55">{c.descricao}</p> : null}
            </div>
          ))}
          {loja && loja.cupons.length === 0 ? (
            <p className="text-sm text-ink/55">Nenhum cupom disponível no momento.</p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
