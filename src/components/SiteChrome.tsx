import { Link } from "@tanstack/react-router";
import { useHubData } from "@/lib/hub-data";
import { SocialIcon } from "@/components/Icon3D";
import cupom3d from "@/assets/coupon-3d.png";

export function SiteHeader() {
  const { perfil } = useHubData();
  return (
    <header className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
      <Link to="/" className="flex items-center gap-2.5">
        <img
          src={cupom3d}
          alt=""
          width={40}
          height={40}
          className="size-10 rounded-xl object-contain"
        />
        <span className="block">
          <span className="block font-display text-base font-bold leading-none">{perfil.marca}</span>
          <span className="block text-[11px] text-ink/50">{perfil.slogan}</span>
        </span>
      </Link>
      <Link
        to="/admin"
        className="rounded-full border border-glass-border bg-white/60 px-3 py-1.5 text-xs font-semibold text-brand shadow-sm transition active:scale-95"
      >
        Painel Admin
      </Link>
    </header>
  );
}

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
      </div>
    </footer>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-ink">
      <div className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-violet/30 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-44 size-52 rounded-full bg-cyan/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 left-1/2 size-56 rounded-full bg-brand/20 blur-3xl" />
      <div className="relative mx-auto w-full max-w-[430px] px-4 pb-12 pt-4 sm:max-w-2xl">{children}</div>
    </div>
  );
}
