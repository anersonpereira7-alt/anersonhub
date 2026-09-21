import { Link } from "@tanstack/react-router";
import { useHubData } from "@/lib/hub-data";
import { SocialIcon } from "@/components/Icon3D";

export function SiteFooter() {
  const { redes } = useHubData();
  return (
    <footer className="glass-panel mt-6 rounded-2xl p-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {redes.map((r) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={r.nome}
            title={r.nome}
            className="grid size-10 place-items-center rounded-xl bg-white/70 text-ink/70 shadow-sm transition active:scale-95"
          >
            <SocialIcon iconId={r.iconId} />
          </a>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-center gap-4 text-[12px] font-medium text-ink/55">
        <Link to="/termos">Termos</Link>
        <span className="size-1 rounded-full bg-ink/20" />
        <Link to="/privacidade">Privacidade</Link>
        <span className="size-1 rounded-full bg-ink/20" />
        <Link to="/admin" className="font-semibold text-brand">Admin</Link>
      </div>
    </footer>
  );
}

export function PageShell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-ink">
      <div className={wide ? "relative mx-auto w-full max-w-6xl px-4 pb-12 pt-4" : "relative mx-auto w-full max-w-[430px] px-4 pb-12 pt-4 sm:max-w-2xl"}>{children}</div>
    </div>
  );
}
