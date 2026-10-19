function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[12px] font-semibold text-ink/60">Escolha o ícone</legend>
      <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-glass-border bg-background/40 p-2 sm:grid-cols-6">
        {ICON_LIBRARY.map((i) => (
          <button
            key={i.id}
            type="button"
            title={i.label}
            aria-label={i.label}
            aria-pressed={value === i.id}
            onClick={() => onChange(i.id)}
            className={
              value === i.id
                ? "flex min-w-0 flex-col items-center gap-2 rounded-xl bg-brand/10 p-2"
                : "flex min-w-0 flex-col items-center gap-2 rounded-xl bg-white/60 p-2"
            }
          >
            <Icon3D iconId={i.id} className="size-10" />
            <span className="w-full truncate text-[10px] font-medium text-ink/70">{i.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
