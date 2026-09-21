import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FolderCog, Globe2, Lock, LogOut, MessageCircle, Pencil, Plus, Power, ScrollText, Store, Trash2, UserRound, X } from "lucide-react";
import {
  setData,
  slugify,
  uid,
  useHubData,
  type Categoria,
  type Loja,
} from "@/lib/hub-data";
import { ICON_LIBRARY, SOCIAL_ICON_IDS } from "@/lib/icon-library";
import { Icon3D, SocialIcon } from "@/components/Icon3D";
import { ViniAssistant } from "@/components/ViniAssistant";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import vini3d from "@/assets/vini-3d.png";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin · CupomHub" },
      { name: "description", content: "Área administrativa do hub de cupons." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Painel Admin · CupomHub" },
      { property: "og:description", content: "Área administrativa do hub de cupons." },
    ],
  }),
  component: Admin,
});

const campo =
  "w-full rounded-xl border border-glass-border bg-white/70 px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-ring/40";
const botao =
  "rounded-xl bg-gradient-to-r from-brand to-violet px-3 py-2.5 text-[13px] font-semibold text-primary-foreground transition active:scale-95";
const botaoSec =
  "rounded-xl border border-brand/30 bg-white/70 px-3 py-2.5 text-[13px] font-semibold text-brand transition active:scale-95";

function Admin() {
  const [logado, setLogado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("categorias");
  const [viniAberto, setViniAberto] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        setLogado(Boolean(role));
      }
      setVerificando(false);
    })();
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const email = usuario.includes("@") ? usuario.trim() : `${usuario.trim().toLowerCase()}@cupomhub.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error || !data.user) {
      setErro("Usuário ou senha incorretos.");
      return;
    }
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!role) {
      await supabase.auth.signOut();
      setErro("Este acesso não possui permissão de administrador.");
      return;
    }
    setLogado(true);
  }

  if (verificando) return <PageShell><div className="mt-24 text-center text-sm text-ink/55">Verificando acesso…</div></PageShell>;

  if (!logado) {
    return (
      <PageShell>
        <form onSubmit={entrar} className="glass-panel mt-16 space-y-3 rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-brand" />
            <h1 className="font-display text-xl font-bold">Painel Admin</h1>
          </div>
          <input className={campo} placeholder="Usuário" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
          <input
            className={campo}
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {erro ? <p className="text-[12px] font-medium text-destructive">{erro}</p> : null}
          <Button type="submit" className={`${botao} h-auto w-full`}>Entrar</Button>
          <Link to="/" className="block pt-1 text-center text-[12px] font-medium text-ink/55">
            Voltar ao site
          </Link>
        </form>
      </PageShell>
    );
  }

  const abas = [
    ["categorias", "Categorias", FolderCog],
    ["lojas", "Lojas", Store],
    ["redes", "Redes sociais", Globe2],
    ["textos", "Textos legais", ScrollText],
    ["perfil", "Perfil e acesso", UserRound],
  ] as const;

  return (
    <PageShell wide>
      <header className="glass-panel flex items-center justify-between rounded-2xl px-4 py-3">
        <h1 className="font-display text-base font-bold">Painel Admin</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            await supabase.auth.signOut();
            setLogado(false);
          }}
          className="rounded-full border-glass-border bg-background/60 text-brand"
        >
          <LogOut className="size-3.5" /> Sair
        </Button>
      </header>

      <div className="mt-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-5">
        <select value={aba} onChange={(e) => setAba(e.target.value)} className={`${campo} mb-4 md:hidden`} aria-label="Área de configuração">
          {abas.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <nav className="glass-panel hidden h-fit space-y-1 rounded-2xl p-2 md:block" aria-label="Configurações do painel">
          {abas.map(([id, label, Icon]) => (
            <Button key={id} variant="ghost" onClick={() => setAba(id)} className={aba === id ? "w-full justify-start bg-brand/10 text-brand" : "w-full justify-start text-ink/65"}>
              <Icon /> {label}
            </Button>
          ))}
        </nav>
        <main className="min-w-0 space-y-3">
          <div className="mb-3 px-1">
            <p className="text-xs font-semibold uppercase text-brand">Configurações</p>
            <h2 className="font-display text-xl font-bold">{abas.find(([id]) => id === aba)?.[1]}</h2>
          </div>
          {aba === "categorias" && <Categorias />}
          {aba === "lojas" && <Lojas />}
          {aba === "redes" && <Redes />}
          {aba === "textos" && <Textos />}
          {aba === "perfil" && <Perfil />}
        </main>
      </div>

      <Link to="/" className="mt-6 block text-center text-[12px] font-medium text-ink/55">
        Ver o site
      </Link>

      {viniAberto ? (
        <div className="fixed bottom-20 right-4 z-50 w-[min(390px,calc(100vw-2rem))] shadow-card">
          <Button variant="outline" size="icon" aria-label="Fechar Vini" onClick={() => setViniAberto(false)} className="absolute -right-1 -top-11 rounded-full bg-background"><X /></Button>
          <ViniAssistant />
        </div>
      ) : null}
      <Button size="icon" aria-label="Abrir Vini" title="Abrir Vini" onClick={() => setViniAberto((aberto) => !aberto)} className="fixed bottom-5 right-5 z-50 size-14 rounded-full bg-gradient-to-br from-brand to-cyan shadow-card">
        <img src={vini3d} alt="" className="size-12 object-contain" />
      </Button>
    </PageShell>
  );
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-[12px] font-semibold text-ink/60">Escolha o ícone</legend>
      <div className="grid max-h-72 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-glass-border bg-background/40 p-2 sm:grid-cols-6">
        {ICON_LIBRARY.map((i) => (
          <button key={i.id} type="button" title={i.label} aria-label={i.label} aria-pressed={value === i.id} onClick={() => onChange(i.id)} className={value === i.id ? "flex min-w-0 flex-col items-center gap-1 rounded-xl border border-brand bg-brand/10 p-2" : "flex min-w-0 flex-col items-center gap-1 rounded-xl border border-transparent p-2 hover:bg-background/70"}>
            <Icon3D iconId={i.id} className="size-10" />
            <span className="w-full truncate text-[10px] font-medium text-ink/70">{i.label}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Categorias() {
  const { categorias } = useHubData();
  const [editando, setEditando] = useState<Categoria | null>(null);

  function novo() {
    setEditando({
      id: "",
      nome: "",
      slug: "",
      descricao: "",
      iconId: "cupons",
      ativa: true,
      restrita: false,
      aviso: "",
    });
  }

  function salvar(c: Categoria) {
    setData((d) => {
      const slug = slugify(c.nome);
      if (!c.id) return { ...d, categorias: [...d.categorias, { ...c, id: uid(), slug }] };
      return { ...d, categorias: d.categorias.map((x) => (x.id === c.id ? { ...c, slug } : x)) };
    });
    setEditando(null);
  }

  return (
    <>
      <button onClick={novo} className={`${botao} flex w-full items-center justify-center gap-1.5`}>
        <Plus className="size-4" /> Nova categoria
      </button>

      {editando ? (
        <div className="glass-panel space-y-2 rounded-2xl p-4">
          <p className="font-display text-sm font-semibold">{editando.id ? "Editar" : "Nova"} categoria</p>
          <input
            className={campo}
            placeholder="Nome"
            value={editando.nome}
            onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
          />
          <textarea
            className={campo}
            placeholder="Descrição"
            rows={2}
            value={editando.descricao}
            onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
          />
          <IconPicker value={editando.iconId} onChange={(v) => setEditando({ ...editando, iconId: v })} />
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={editando.restrita}
              onChange={(e) => setEditando({ ...editando, restrita: e.target.checked })}
            />
            Categoria restrita (+18)
          </label>
          {editando.restrita ? (
            <textarea
              className={campo}
              rows={2}
              placeholder="Aviso exibido no topo da categoria"
              value={editando.aviso}
              onChange={(e) => setEditando({ ...editando, aviso: e.target.value })}
            />
          ) : null}
          <div className="flex gap-2">
            <button onClick={() => salvar(editando)} className={`${botao} flex-1`}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} className={`${botaoSec} flex-1`}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {categorias.map((c) => (
        <div key={c.id} className="glass-panel flex items-center gap-3 rounded-2xl p-3">
          <Icon3D iconId={c.iconId} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{c.nome}</p>
            <p className="text-[11px] text-ink/50">
              {c.ativa ? "ativa" : "desativada"}
              {c.restrita ? " · restrita +18" : ""}
            </p>
          </div>
          <button
            title={c.ativa ? "Desativar" : "Ativar"}
            onClick={() =>
              setData((d) => ({
                ...d,
                categorias: d.categorias.map((x) => (x.id === c.id ? { ...x, ativa: !x.ativa } : x)),
              }))
            }
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
          >
            <Power className="size-4" />
          </button>
           <button title="Editar categoria" aria-label="Editar categoria" onClick={() => setEditando({ ...c })} className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand">
             <Pencil className="size-4" />
          </button>
          <button
            onClick={() =>
              setData((d) => ({
                ...d,
                categorias: d.categorias.filter((x) => x.id !== c.id),
                lojas: d.lojas.map((l) => ({ ...l, categorias: l.categorias.filter((id) => id !== c.id) })),
              }))
            }
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </>
  );
}

function Lojas() {
  const { lojas, categorias } = useHubData();
  const [editando, setEditando] = useState<Loja | null>(null);

  function novo() {
    setEditando({
      id: "",
      nome: "",
      descricao: "",
      url: "",
      categorias: [],
      temCupom: false,
      cupons: [],
      ativa: true,
    });
  }

  function salvar(l: Loja) {
    setData((d) => {
      if (!l.id) return { ...d, lojas: [...d.lojas, { ...l, id: uid() }] };
      return { ...d, lojas: d.lojas.map((x) => (x.id === l.id ? l : x)) };
    });
    setEditando(null);
  }

  return (
    <>
      <button onClick={novo} className={`${botao} flex w-full items-center justify-center gap-1.5`}>
        <Plus className="size-4" /> Nova loja
      </button>

      {editando ? (
        <div className="glass-panel space-y-2 rounded-2xl p-4">
          <p className="font-display text-sm font-semibold">{editando.id ? "Editar" : "Nova"} loja</p>
          <input
            className={campo}
            placeholder="Nome da loja"
            value={editando.nome}
            onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
          />
          <input
            className={campo}
            placeholder="Descrição curta"
            value={editando.descricao}
            onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
          />
          <input
            className={campo}
            placeholder="Link de afiliado (https://...)"
            value={editando.url}
            onChange={(e) => setEditando({ ...editando, url: e.target.value })}
          />
          <p className="pt-1 text-[12px] font-semibold text-ink/60">Categorias</p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => {
              const ativo = editando.categorias.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    setEditando({
                      ...editando,
                      categorias: ativo
                        ? editando.categorias.filter((id) => id !== c.id)
                        : [...editando.categorias, c.id],
                    })
                  }
                  className={
                    ativo
                      ? "rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      : "rounded-full border border-glass-border bg-white/60 px-3 py-1.5 text-xs font-medium text-ink/60"
                  }
                >
                  {c.nome}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-2 pt-1 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={editando.temCupom}
              onChange={(e) => setEditando({ ...editando, temCupom: e.target.checked })}
            />
            Esta loja tem cupom
          </label>

          {editando.temCupom ? (
            <div className="space-y-2">
              {editando.cupons.map((cp, i) => (
                <div key={cp.id} className="rounded-xl border border-glass-border bg-white/60 p-2">
                  <input
                    className={campo}
                    placeholder="Código do cupom"
                    value={cp.codigo}
                    onChange={(e) => {
                      const cupons = [...editando.cupons];
                      cupons[i] = { ...cp, codigo: e.target.value.toUpperCase() };
                      setEditando({ ...editando, cupons });
                    }}
                  />
                  <textarea
                    className={`${campo} mt-2`}
                    rows={2}
                    placeholder="Descrição / regras (opcional)"
                    value={cp.descricao}
                    onChange={(e) => {
                      const cupons = [...editando.cupons];
                      cupons[i] = { ...cp, descricao: e.target.value };
                      setEditando({ ...editando, cupons });
                    }}
                  />
                  <button
                    onClick={() =>
                      setEditando({ ...editando, cupons: editando.cupons.filter((x) => x.id !== cp.id) })
                    }
                    className="mt-2 text-[12px] font-semibold text-destructive"
                  >
                    Remover cupom
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setEditando({
                    ...editando,
                    cupons: [...editando.cupons, { id: uid(), codigo: "", descricao: "" }],
                  })
                }
                className={`${botaoSec} w-full`}
              >
                + Adicionar cupom
              </button>
            </div>
          ) : null}

          <div className="flex gap-2 pt-1">
            <button onClick={() => salvar(editando)} className={`${botao} flex-1`}>
              Salvar
            </button>
            <button onClick={() => setEditando(null)} className={`${botaoSec} flex-1`}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      {lojas.map((l) => (
        <div key={l.id} className="glass-panel flex items-center gap-3 rounded-2xl p-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{l.nome}</p>
            <p className="text-[11px] text-ink/50">
              {l.categorias.length} categoria(s) · {l.cupons.length} cupom(ns)
            </p>
          </div>
          <button
            title={l.ativa ? "Desativar" : "Ativar"}
            onClick={() =>
              setData((d) => ({ ...d, lojas: d.lojas.map((x) => (x.id === l.id ? { ...x, ativa: !x.ativa } : x)) }))
            }
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
          >
            <Power className="size-4" />
          </button>
           <button title="Editar loja" aria-label="Editar loja" onClick={() => setEditando({ ...l, categorias: [...l.categorias], cupons: l.cupons.map((c) => ({ ...c })) })} className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand">
             <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setData((d) => ({ ...d, lojas: d.lojas.filter((x) => x.id !== l.id) }))}
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </>
  );
}

function Redes() {
  const { redes } = useHubData();
  const [nome, setNome] = useState("");
  const [iconId, setIconId] = useState<string>(SOCIAL_ICON_IDS[0]);
  const [url, setUrl] = useState("");

  function adicionar() {
    if (!nome.trim()) return;
    setData((d) => ({ ...d, redes: [...d.redes, { id: uid(), nome, iconId, url }] }));
    setNome("");
    setUrl("");
  }

  return (
    <>
      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Nova rede social</p>
        <input className={campo} placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
        <select className={campo} value={iconId} onChange={(e) => setIconId(e.target.value)}>
          {SOCIAL_ICON_IDS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <input className={campo} placeholder="Link" value={url} onChange={(e) => setUrl(e.target.value)} />
        <button onClick={adicionar} className={`${botao} w-full`}>
          Adicionar
        </button>
      </div>

      {redes.map((r) => (
        <div key={r.id} className="glass-panel flex items-center gap-3 rounded-2xl p-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand">
            <SocialIcon iconId={r.iconId} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{r.nome}</p>
            <p className="truncate text-[11px] text-ink/50">{r.url}</p>
          </div>
          <button
            onClick={() => setData((d) => ({ ...d, redes: d.redes.filter((x) => x.id !== r.id) }))}
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
    </>
  );
}

function Textos() {
  const { textos } = useHubData();
  const [termos, setTermos] = useState(textos.termos);
  const [privacidade, setPrivacidade] = useState(textos.privacidade);
  const [ok, setOk] = useState(false);

  return (
    <div className="glass-panel space-y-2 rounded-2xl p-4">
      <p className="font-display text-sm font-semibold">Termos de uso</p>
      <textarea className={campo} rows={6} value={termos} onChange={(e) => setTermos(e.target.value)} />
      <p className="pt-2 font-display text-sm font-semibold">Política de privacidade</p>
      <textarea className={campo} rows={6} value={privacidade} onChange={(e) => setPrivacidade(e.target.value)} />
      <button
        onClick={() => {
          setData((d) => ({ ...d, textos: { termos, privacidade } }));
          setOk(true);
          setTimeout(() => setOk(false), 1800);
        }}
        className={`${botao} w-full`}
      >
        {ok ? "Salvo!" : "Salvar textos"}
      </button>
    </div>
  );
}

function Perfil() {
  const { perfil, admin } = useHubData();
  const [p, setP] = useState(perfil);
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <>
      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Perfil do site</p>
        <input className={campo} placeholder="Marca" value={p.marca} onChange={(e) => setP({ ...p, marca: e.target.value })} />
        <input className={campo} placeholder="Slogan" value={p.slogan} onChange={(e) => setP({ ...p, slogan: e.target.value })} />
        <input className={campo} placeholder="Nome" value={p.nome} onChange={(e) => setP({ ...p, nome: e.target.value })} />
        <textarea
          className={campo}
          rows={3}
          placeholder="Descrição"
          value={p.descricao}
          onChange={(e) => setP({ ...p, descricao: e.target.value })}
        />
        <button onClick={() => setData((d) => ({ ...d, perfil: p }))} className={`${botao} w-full`}>
          Salvar perfil
        </button>
      </div>

      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Acesso do admin</p>
        <p className="text-[12px] text-ink/55">Usuário atual: {admin.usuario}</p>
        <input
          className={campo}
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <button
          onClick={() => {
            if (novaSenha.length < 6) {
              setMsg("A senha precisa ter ao menos 6 caracteres.");
              return;
            }
            setData((d) => ({ ...d, admin: { ...d.admin, senha: novaSenha } }));
            setNovaSenha("");
            setMsg("Senha alterada com sucesso.");
          }}
          className={`${botao} w-full`}
        >
          Alterar senha
        </button>
        {msg ? <p className="text-[12px] font-medium text-ink/60">{msg}</p> : null}
      </div>
    </>
  );
}
