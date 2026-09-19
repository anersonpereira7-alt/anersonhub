import { ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AgeGate({
  open,
  bloqueado,
  onMaior,
  onMenor,
}: {
  open: boolean;
  bloqueado: boolean;
  onMaior: () => void;
  onMenor: () => void;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[340px] rounded-3xl border-glass-border bg-white/95 backdrop-blur-xl [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <ShieldAlert className="size-5 text-brand" />
            {bloqueado ? "Acesso bloqueado" : "Confirme sua idade"}
          </DialogTitle>
        </DialogHeader>
        {bloqueado ? (
          <p className="text-sm text-ink/65">
            Esta categoria é exclusiva para maiores de 18 anos. Volte para a página inicial.
          </p>
        ) : (
          <>
            <p className="text-sm text-ink/65">
              Esta categoria tem conteúdo restrito. Você tem 18 anos ou mais?
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={onMenor}
                className="flex-1 rounded-xl border border-brand/30 bg-white/70 py-2.5 text-sm font-semibold text-brand transition active:scale-95"
              >
                Sou menor de 18
              </button>
              <button
                onClick={onMaior}
                className="flex-1 rounded-xl bg-gradient-to-r from-brand to-violet py-2.5 text-sm font-semibold text-primary-foreground transition active:scale-95"
              >
                Tenho 18 ou mais
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
