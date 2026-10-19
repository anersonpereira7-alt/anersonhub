import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, FolderCog, Globe2, Lock, LogOut, Megaphone, MessageCircle, Newspaper, Pencil, Plus, Power, ScrollText, Store, Trash2, Upload, UserRound } from "lucide-react";
import perfilPadrao from "@/assets/perfil.jpg";
import {
  setData,
  slugify,
  uid,
  useHubData,
  FORMATOS,
  PESOS,
  textoDoArtigo,
  tempoDeLeitura,
  type Anuncio,
  type Artigo,
  type Bloco,
  type Categoria,
  type FormatoAnuncio,
  type Loja,
  type PesoAnuncio,
} from "@/lib/hub-data";
import { ICON_LIBRARY, SOCIAL_ICON_IDS } from "@/lib/icon-library";
import { Icon3D, SocialIcon } from "@/components/Icon3D";
import { ViniAssistant } from "@/components/ViniAssistant";
import { buscarExtras } from "@/lib/extras";
import {
  gerarNarracao,
  gerarRoteiro,
  removerNarracao,
  resumirComVini,
  salvarResumo,
} from "@/lib/blog.functions";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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

/** Lê a imagem enviada e devolve um JPEG quadrado reduzido em data URL. */
async function redimensionarImagem(file: File, lado: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const corte = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(
    bitmap,
    (bitmap.width - corte) / 2,
    (bitmap.height - corte) / 2,
    corte,
    corte,
    0,
    0,
    lado,
    lado,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}


function Admin() {
  const [logado, setLogado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState("categorias");

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
    ["publicidade", "Publicidade", Megaphone],
    ["blog", "Blog", Newspaper],
    ["textos", "Textos legais", ScrollText],
    ["perfil", "Perfil e acesso", UserRound],
    ["vini", "Vini", MessageCircle],
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
          {aba === "publicidade" && <Anuncios />}
          {aba === "blog" && <Blog />}
          {aba === "textos" && <Textos />}
          {aba === "perfil" && <Perfil />}
          {aba === "vini" && <ViniAssistant />}
        </main>
      </div>

      <Link to="/" className="mt-6 block text-center text-[12px] font-medium text-ink/55">
        Ver o site
      </Link>

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

  /** Move a categoria da posição i em `delta` posições. */
  function mover(i: number, delta: number) {
    setData((d) => {
      const lista = [...d.categorias];
      const alvo = i + delta;
      if (alvo < 0 || alvo >= lista.length) return d;
      const [item] = lista.splice(i, 1);
      lista.splice(alvo, 0, item!);
      return { ...d, categorias: lista };
    });
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

      {categorias.map((c, i) => (
        <div key={c.id} className="glass-panel flex flex-wrap items-center gap-2 rounded-2xl p-3 sm:gap-3">
          <Icon3D iconId={c.iconId} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{c.nome}</p>
            <p className="text-[11px] text-ink/50">
              {i + 1}º · {c.ativa ? "ativa" : "desativada"}
              {c.restrita ? " · restrita +18" : ""}
            </p>
          </div>
          <button
            title="Mover para cima"
            aria-label="Mover categoria para cima"
            disabled={i === 0}
            onClick={() => mover(i, -1)}
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand disabled:opacity-35"
          >
            <ArrowUp className="size-4" />
          </button>
          <button
            title="Mover para baixo"
            aria-label="Mover categoria para baixo"
            disabled={i === categorias.length - 1}
            onClick={() => mover(i, 1)}
            className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand disabled:opacity-35"
          >
            <ArrowDown className="size-4" />
          </button>
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
      destaque: false,
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
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={!!editando.destaque}
              onChange={(e) => setEditando({ ...editando, destaque: e.target.checked })}
            />
            Mostrar em "Lojas em destaque" na home
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
              {l.destaque ? " · ⭐ destaque" : ""}
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
  const { perfil } = useHubData();
  const [p, setP] = useState(perfil);
  const [nomeAdmin, setNomeAdmin] = useState("");
  const [fotoAdmin, setFotoAdmin] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", auth.user.id).maybeSingle();
      if (data) {
        setNomeAdmin(data.display_name);
        setFotoAdmin(data.avatar_url ?? "");
      }
    })();
  }, []);

  async function salvarPerfilAdmin() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("profiles").upsert({ id: auth.user.id, display_name: nomeAdmin, avatar_url: fotoAdmin || null });
    setMsg(error ? "Não foi possível salvar o perfil." : "Perfil do administrador salvo.");
  }

  async function alterarSenha() {
    if (!senhaAtual || novaSenha.length < 6) {
      setMsg("Informe a senha atual e uma nova senha com ao menos 6 caracteres.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: novaSenha, current_password: senhaAtual });
    setMsg(error ? "A senha atual está incorreta ou a nova senha não foi aceita." : "Senha alterada com sucesso.");
    if (!error) {
      setSenhaAtual("");
      setNovaSenha("");
    }
  }

  async function enviarFoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setMsg("Escolha um arquivo de imagem (JPG ou PNG).");
      return;
    }
    try {
      const foto = await redimensionarImagem(file, 320);
      setP((atual) => ({ ...atual, foto }));
      setMsg("Foto carregada. Clique em “Salvar perfil” para publicar.");
    } catch {
      setMsg("Não foi possível ler essa imagem.");
    }
  }

  return (
    <>
      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Perfil do site</p>
        <div className="flex items-center gap-3">
          <img
            src={p.foto || perfilPadrao}
            alt="Foto do perfil"
            className="size-16 shrink-0 rounded-2xl object-cover"
          />
          <div className="min-w-0 flex-1 space-y-1.5">
            <label className={`${botaoSec} flex cursor-pointer items-center justify-center gap-1.5`}>
              <Upload className="size-4" /> Enviar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void enviarFoto(f);
                  e.target.value = "";
                }}
              />
            </label>
            {p.foto ? (
              <button onClick={() => setP({ ...p, foto: "" })} className="text-[12px] font-semibold text-destructive">
                Remover foto
              </button>
            ) : null}
          </div>
        </div>
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
        <button onClick={() => { setData((d) => ({ ...d, perfil: p })); setMsg("Perfil do site salvo."); }} className={`${botao} w-full`}>
          Salvar perfil
        </button>
        {msg ? <p className="text-[12px] font-medium text-ink/60">{msg}</p> : null}
      </div>

      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Perfil do administrador</p>
        <input className={campo} placeholder="Nome de exibição" value={nomeAdmin} onChange={(e) => setNomeAdmin(e.target.value)} />
        <input className={campo} placeholder="Link da foto (opcional)" value={fotoAdmin} onChange={(e) => setFotoAdmin(e.target.value)} />
        <Button onClick={salvarPerfilAdmin} className={`${botao} h-auto w-full`}>Salvar perfil do administrador</Button>
      </div>

      <div className="glass-panel space-y-2 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">Alterar senha</p>
        <input
          className={campo}
          type="password"
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
        />
        <input
          className={campo}
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
        />
        <Button onClick={alterarSenha} className={`${botao} h-auto w-full`}>
          Alterar senha
        </Button>
        {msg ? <p className="text-[12px] font-medium text-ink/60">{msg}</p> : null}
      </div>
    </>
  );
}

/** Reduz a imagem enviada mantendo a proporção, para guardar como banner. */
async function redimensionarBanner(file: File, larguraMax: number): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, larguraMax / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas indisponível");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

const ANUNCIO_NOVO = (): Anuncio => ({
  id: uid(),
  tag: "",
  tipo: "imagem",
  imagem: "",
  link: "",
  codigo: "",
  ativo: true,
  home: true,
  peso: 1,
  formato: "barra",
  blog: false,
  categorias: [],
});

function Anuncios() {
  const data = useHubData();
  const anuncios = data.anuncios ?? [];
  const [edit, setEdit] = useState<Anuncio | null>(null);
  const [msg, setMsg] = useState("");

  function salvar(a: Anuncio) {
    if (!a.tag.trim()) return;
    setData((d) => {
      const lista = d.anuncios ?? [];
      const existe = lista.some((x) => x.id === a.id);
      return { ...d, anuncios: existe ? lista.map((x) => (x.id === a.id ? a : x)) : [...lista, a] };
    });
    setEdit(null);
    setMsg("Anúncio salvo.");
  }

  function remover(id: string) {
    setData((d) => ({ ...d, anuncios: (d.anuncios ?? []).filter((x) => x.id !== id) }));
  }

  function alternar(id: string) {
    setData((d) => ({
      ...d,
      anuncios: (d.anuncios ?? []).map((x) => (x.id === id ? { ...x, ativo: !x.ativo } : x)),
    }));
  }

  return (
    <>
      {edit ? (
        <div className="glass-panel space-y-3 rounded-2xl p-4">
          <p className="font-display text-sm font-semibold">
            {anuncios.some((x) => x.id === edit.id) ? "Editar anúncio" : "Novo anúncio"}
          </p>
          <input
            className={campo}
            placeholder="Identificação interna (ex.: Loja Silva · outubro)"
            value={edit.tag}
            onChange={(e) => setEdit({ ...edit, tag: e.target.value })}
          />
          <select
            className={campo}
            value={edit.tipo}
            onChange={(e) => setEdit({ ...edit, tipo: e.target.value as Anuncio["tipo"] })}
          >
            <option value="imagem">Banner próprio (imagem + link)</option>
            <option value="script">Código / script do anunciante</option>
          </select>

          {edit.tipo === "imagem" ? (
            <>
              {edit.imagem ? (
                <img src={edit.imagem} alt="Prévia do banner" className="mx-auto block max-w-full rounded-xl" />
              ) : null}
              <label className={`${botaoSec} flex cursor-pointer items-center justify-center gap-2`}>
                <Upload className="size-4" /> Enviar imagem
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await redimensionarBanner(file, 720);
                      setEdit({ ...edit, imagem: url });
                      setMsg("Imagem carregada.");
                    } catch {
                      setMsg("Não foi possível carregar a imagem.");
                    }
                  }}
                />
              </label>
              <input
                className={campo}
                placeholder="Link de destino (https://…)"
                value={edit.link ?? ""}
                onChange={(e) => setEdit({ ...edit, link: e.target.value })}
              />
            </>
          ) : (
            <textarea
              className={`${campo} min-h-32 font-mono text-[12px]`}
              placeholder="Cole aqui o código/script do anunciante"
              value={edit.codigo ?? ""}
              onChange={(e) => setEdit({ ...edit, codigo: e.target.value })}
            />
          )}

          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input type="checkbox" checked={edit.ativo} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} />
            Anúncio ativo
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input type="checkbox" checked={edit.home} onChange={(e) => setEdit({ ...edit, home: e.target.checked })} />
            Exibir na página inicial
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-ink/60">Tamanho da arte</span>
              <select
                className={campo}
                value={edit.formato ?? "barra"}
                onChange={(e) => setEdit({ ...edit, formato: e.target.value as FormatoAnuncio })}
              >
                {(Object.keys(FORMATOS) as FormatoAnuncio[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMATOS[f].label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-ink/60">Chance no sorteio</span>
              <select
                className={campo}
                value={String(edit.peso ?? (edit.destaque ? 2 : 1))}
                onChange={(e) => {
                  const p = Number(e.target.value) as PesoAnuncio;
                  setEdit({ ...edit, peso: p, destaque: p > 1 });
                }}
              >
                {([1, 2, 4] as PesoAnuncio[]).map((p) => (
                  <option key={p} value={p}>
                    {PESOS[p]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={!!edit.blog}
              onChange={(e) => setEdit({ ...edit, blog: e.target.checked })}
            />
            Exibir no blog
          </label>

          <fieldset>
            <legend className="mb-1.5 text-[12px] font-semibold text-ink/60">Categorias onde pode aparecer</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {data.categorias.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-[13px] text-ink/70">
                  <input
                    type="checkbox"
                    checked={edit.categorias.includes(c.id)}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        categorias: e.target.checked
                          ? [...edit.categorias, c.id]
                          : edit.categorias.filter((x) => x !== c.id),
                      })
                    }
                  />
                  {c.nome}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex gap-2">
            <button onClick={() => salvar(edit)} className={`${botao} flex-1`}>
              Salvar
            </button>
            <button onClick={() => setEdit(null)} className={botaoSec}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEdit(ANUNCIO_NOVO())} className={`${botao} flex w-full items-center justify-center gap-2`}>
          <Plus className="size-4" /> Novo anúncio
        </button>
      )}

      {msg ? <p className="px-1 text-[12px] font-medium text-ink/60">{msg}</p> : null}

      {anuncios.map((a) => (
        <div key={a.id} className="glass-panel space-y-2 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{a.tag || "Sem identificação"}</p>
              <p className="truncate text-[11px] text-ink/50">
                {a.tipo === "imagem" ? "Banner próprio" : "Código do anunciante"} ·{" "}
                {(FORMATOS[a.formato ?? "barra"] ?? FORMATOS.barra).label} ·{" "}
                {PESOS[(a.peso ?? (a.destaque ? 2 : 1)) as PesoAnuncio]} ·{" "}
                {a.ativo ? "ativo" : "pausado"} · {a.home ? "home" : "sem home"} ·{" "}
                {a.blog ? "blog" : "sem blog"} · {a.categorias.length} categoria(s)
              </p>
            </div>
            <button
              onClick={() => alternar(a.id)}
              title={a.ativo ? "Pausar" : "Ativar"}
              aria-label={a.ativo ? "Pausar anúncio" : "Ativar anúncio"}
              className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
            >
              <Power className="size-4" />
            </button>
            <button
              onClick={() => setEdit(a)}
              title="Editar"
              aria-label="Editar anúncio"
              className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
            >
              <Pencil className="size-4" />
            </button>
            <button
              onClick={() => remover(a.id)}
              title="Excluir"
              aria-label="Excluir anúncio"
              className="grid size-9 place-items-center rounded-xl bg-white/70 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}

const ARTIGO_NOVO = (): Artigo => ({
  id: uid(),
  titulo: "",
  slug: "",
  resumo: "",
  tempoLeitura: 1,
  ativo: false,
  destaque: false,
  imagem: "",
  categorias: [],
  blocos: [{ id: uid(), tipo: "texto", texto: "" }],
  textoNarracao: "",
  temAudio: false,
  temResumo: false,
  criadoEm: new Date().toISOString(),
});

function novoBloco(tipo: Bloco["tipo"], atual?: Bloco): Bloco {
  const id = atual?.id ?? uid();
  if (tipo === "anuncio") return { id, tipo: "anuncio", anuncios: [] };
  return { id, tipo, texto: atual && "texto" in atual ? atual.texto : "" };
}

const erroDe = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente de novo.");

function Blog() {
  const data = useHubData();
  const artigos = data.artigos ?? [];
  const disponiveis = (data.anuncios ?? []).filter((a) => a.ativo);
  const [edit, setEdit] = useState<Artigo | null>(null);
  const [resumoVini, setResumoVini] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState<"" | "resumo" | "roteiro" | "audio">("");

  function marcar(id: string, campo: "temResumo" | "temAudio", valor: boolean) {
    setData((d) => ({
      ...d,
      artigos: (d.artigos ?? []).map((a) => (a.id === id ? { ...a, [campo]: valor } : a)),
    }));
  }

  async function abrir(a: Artigo) {
    setEdit(a);
    setResumoVini("");
    setMsg("");
    const ex = await buscarExtras(a.id);
    if (ex?.resumo) setResumoVini(ex.resumo);
  }

  function salvar(a: Artigo) {
    if (!a.titulo.trim()) {
      setMsg("Dê um título para o artigo.");
      return;
    }
    const base = a.slug.trim() || slugify(a.titulo);
    let slug = base;
    let n = 2;
    while ((data.artigos ?? []).some((x) => x.slug === slug && x.id !== a.id)) slug = `${base}-${n++}`;
    const salvo: Artigo = {
      ...a,
      slug,
      resumo: a.resumo.trim() || textoDoArtigo(a).replace(/\s+/g, " ").slice(0, 150),
      tempoLeitura: tempoDeLeitura(textoDoArtigo(a)),
    };
    setData((d) => {
      const l = d.artigos ?? [];
      return { ...d, artigos: l.some((x) => x.id === salvo.id) ? l.map((x) => (x.id === salvo.id ? salvo : x)) : [salvo, ...l] };
    });
    setEdit(null);
    setMsg("Artigo salvo.");
  }

  function remover(id: string) {
    if (!window.confirm("Excluir este artigo?")) return;
    setData((d) => ({ ...d, artigos: (d.artigos ?? []).filter((x) => x.id !== id) }));
  }

  function alternar(id: string, campo: "ativo" | "destaque") {
    setData((d) => ({
      ...d,
      artigos: (d.artigos ?? []).map((a) => (a.id === id ? { ...a, [campo]: !a[campo] } : a)),
    }));
  }

  function mexerBloco(i: number, passo: number) {
    setEdit((e) => {
      if (!e) return e;
      const j = i + passo;
      if (j < 0 || j >= e.blocos.length) return e;
      const blocos = [...e.blocos];
      [blocos[i], blocos[j]] = [blocos[j]!, blocos[i]!];
      return { ...e, blocos };
    });
  }

  async function fazerResumo() {
    if (!edit) return;
    const texto = textoDoArtigo(edit);
    if (!texto.trim()) {
      setMsg("Escreva o artigo antes de pedir o resumo.");
      return;
    }
    setOcupado("resumo");
    setMsg("");
    try {
      const r = await resumirComVini({ data: { texto } });
      setResumoVini(r.texto);
      setMsg("Resumo pronto. Revise o texto e salve.");
    } catch (e) {
      setMsg(erroDe(e));
    } finally {
      setOcupado("");
    }
  }

  async function gravarResumo() {
    if (!edit) return;
    setOcupado("resumo");
    try {
      await salvarResumo({ data: { artigoId: edit.id, resumo: resumoVini } });
      const tem = resumoVini.trim().length > 0;
      setEdit({ ...edit, temResumo: tem });
      marcar(edit.id, "temResumo", tem);
      setMsg("Resumo guardado.");
    } catch (e) {
      setMsg(erroDe(e));
    } finally {
      setOcupado("");
    }
  }

  async function fazerRoteiro() {
    if (!edit) return;
    const texto = textoDoArtigo(edit);
    if (!texto.trim()) {
      setMsg("Escreva o artigo antes de pedir o roteiro.");
      return;
    }
    setOcupado("roteiro");
    setMsg("");
    try {
      const r = await gerarRoteiro({ data: { texto } });
      setEdit({ ...edit, textoNarracao: r.texto });
      setMsg("Roteiro pronto. Ajuste como quiser e gere o áudio.");
    } catch (e) {
      setMsg(erroDe(e));
    } finally {
      setOcupado("");
    }
  }

  async function gerarAudio() {
    if (!edit) return;
    setOcupado("audio");
    setMsg("");
    try {
      await gerarNarracao({ data: { artigoId: edit.id, texto: edit.textoNarracao } });
      setEdit({ ...edit, temAudio: true });
      marcar(edit.id, "temAudio", true);
      setMsg("Áudio pronto e guardado.");
    } catch (e) {
      setMsg(erroDe(e));
    } finally {
      setOcupado("");
    }
  }

  async function tirarAudio() {
    if (!edit) return;
    setOcupado("audio");
    try {
      await removerNarracao({ data: { artigoId: edit.id } });
      setEdit({ ...edit, temAudio: false });
      marcar(edit.id, "temAudio", false);
      setMsg("Áudio removido.");
    } catch (e) {
      setMsg(erroDe(e));
    } finally {
      setOcupado("");
    }
  }

  if (edit) {
    return (
      <div className="glass-panel space-y-3 rounded-2xl p-4">
        <p className="font-display text-sm font-semibold">
          {artigos.some((x) => x.id === edit.id) ? "Editar artigo" : "Novo artigo"}
        </p>
        <input
          className={campo}
          placeholder="Título do artigo"
          value={edit.titulo}
          onChange={(e) => setEdit({ ...edit, titulo: e.target.value })}
        />
        <textarea
          className={`${campo} min-h-16`}
          placeholder="Frase curta que aparece na lista de artigos"
          value={edit.resumo}
          onChange={(e) => setEdit({ ...edit, resumo: e.target.value })}
        />

        {edit.imagem ? (
          <img src={edit.imagem} alt="Prévia da capa" className="mx-auto block max-w-full rounded-xl" />
        ) : null}
        <label className={`${botaoSec} flex cursor-pointer items-center justify-center gap-2`}>
          <Upload className="size-4" /> Enviar capa
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                setEdit({ ...edit, imagem: await redimensionarBanner(file, 1200) });
              } catch {
                setMsg("Não foi possível carregar a capa.");
              }
            }}
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input type="checkbox" checked={edit.ativo} onChange={(e) => setEdit({ ...edit, ativo: e.target.checked })} />
            Publicado
          </label>
          <label className="flex items-center gap-2 text-[13px] text-ink/70">
            <input
              type="checkbox"
              checked={edit.destaque}
              onChange={(e) => setEdit({ ...edit, destaque: e.target.checked })}
            />
            Mostrar primeiro na lista
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-[12px] font-semibold text-ink/60">Texto do artigo</p>
          {edit.blocos.map((b, i) => (
            <div key={b.id} className="rounded-xl border border-glass-border bg-background/40 p-2">
              <div className="mb-1.5 flex items-center gap-1">
                <select
                  className="rounded-lg border border-glass-border bg-white/70 px-2 py-1 text-[11px]"
                  value={b.tipo}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      blocos: edit.blocos.map((x) => (x.id === b.id ? novoBloco(e.target.value as Bloco["tipo"], x) : x)),
                    })
                  }
                >
                  <option value="texto">Parágrafo</option>
                  <option value="titulo">Título</option>
                  <option value="anuncio">Bloco de anúncio</option>
                </select>
                <span className="ml-auto flex gap-1">
                  <button
                    type="button"
                    onClick={() => mexerBloco(i, -1)}
                    aria-label="Subir bloco"
                    className="grid size-7 place-items-center rounded-lg bg-white/70 text-ink/60"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mexerBloco(i, 1)}
                    aria-label="Descer bloco"
                    className="grid size-7 place-items-center rounded-lg bg-white/70 text-ink/60"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEdit({ ...edit, blocos: edit.blocos.filter((x) => x.id !== b.id) })}
                    aria-label="Excluir bloco"
                    className="grid size-7 place-items-center rounded-lg bg-white/70 text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </span>
              </div>

              {b.tipo === "anuncio" ? (
                <fieldset>
                  <legend className="mb-1 text-[11px] font-semibold text-ink/60">
                    Anúncios que podem aparecer aqui
                  </legend>
                  {disponiveis.length === 0 ? (
                    <p className="text-[11px] text-ink/45">Nenhum anúncio ativo na central de publicidade.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-1">
                      {disponiveis.map((a) => (
                        <label key={a.id} className="flex items-center gap-1.5 text-[12px] text-ink/70">
                          <input
                            type="checkbox"
                            checked={b.anuncios.includes(a.id)}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                blocos: edit.blocos.map((x) =>
                                  x.id === b.id
                                    ? {
                                        ...x,
                                        anuncios: e.target.checked
                                          ? [...(x.tipo === "anuncio" ? x.anuncios : []), a.id]
                                          : x.tipo === "anuncio"
                                            ? x.anuncios.filter((y) => y !== a.id)
                                            : [],
                                      }
                                    : x,
                                ),
                              })
                            }
                          />
                          <span className="truncate">{a.tag || "sem nome"}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              ) : b.tipo === "titulo" ? (
                <input
                  className={campo}
                  placeholder="Subtítulo do artigo"
                  value={b.texto}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      blocos: edit.blocos.map((x) => (x.id === b.id ? { ...x, texto: e.target.value } : x)),
                    })
                  }
                />
              ) : (
                <textarea
                  className={`${campo} min-h-24`}
                  placeholder="Escreva o parágrafo"
                  value={b.texto}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      blocos: edit.blocos.map((x) => (x.id === b.id ? { ...x, texto: e.target.value } : x)),
                    })
                  }
                />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEdit({ ...edit, blocos: [...edit.blocos, novoBloco("texto")] })}
              className={botaoSec}
            >
              + Parágrafo
            </button>
            <button
              type="button"
              onClick={() => setEdit({ ...edit, blocos: [...edit.blocos, novoBloco("titulo")] })}
              className={botaoSec}
            >
              + Título
            </button>
            <button
              type="button"
              onClick={() => setEdit({ ...edit, blocos: [...edit.blocos, novoBloco("anuncio")] })}
              className={botaoSec}
            >
              + Bloco de anúncio
            </button>
          </div>
        </div>

        <fieldset className="rounded-xl border border-glass-border bg-background/40 p-3">
          <legend className="px-1 text-[12px] font-semibold text-ink/60">Resumo do Vini</legend>
          <textarea
            className={`${campo} min-h-20`}
            placeholder="O Vini escreve aqui, e você ajusta antes de guardar."
            value={resumoVini}
            onChange={(e) => setResumoVini(e.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={fazerResumo} disabled={!!ocupado} className={botao}>
              {ocupado === "resumo" ? "Vini está lendo…" : "✨ Gerar resumo com o Vini"}
            </button>
            <button type="button" onClick={gravarResumo} disabled={!!ocupado || !resumoVini.trim()} className={botaoSec}>
              Guardar resumo
            </button>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-glass-border bg-background/40 p-3">
          <legend className="px-1 text-[12px] font-semibold text-ink/60">Áudio do artigo</legend>
          <textarea
            className={`${campo} min-h-24`}
            placeholder="Roteiro que será lido em voz alta (o Vini pode escrever, e você ajusta)."
            value={edit.textoNarracao}
            onChange={(e) => setEdit({ ...edit, textoNarracao: e.target.value })}
          />
          <p className="mt-1 text-[11px] text-ink/45">
            {edit.textoNarracao.length} caracteres — o áudio leva alguns segundos para ser pronto.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={fazerRoteiro} disabled={!!ocupado} className={botao}>
              {ocupado === "roteiro" ? "Vini está escrevendo…" : "✨ Criar roteiro com o Vini"}
            </button>
            <button
              type="button"
              onClick={gerarAudio}
              disabled={!!ocupado || !edit.textoNarracao.trim()}
              className={botaoSec}
            >
              {ocupado === "audio" ? "Gerando áudio…" : "🎙️ Gerar áudio"}
            </button>
            {edit.temAudio && (
              <button type="button" onClick={tirarAudio} disabled={!!ocupado} className={botaoSec}>
                Remover áudio
              </button>
            )}
          </div>
        </fieldset>

        {msg ? <p className="text-[12px] font-medium text-ink/60">{msg}</p> : null}

        <div className="flex gap-2">
          <button onClick={() => salvar(edit)} className={`${botao} flex-1`}>
            Salvar artigo
          </button>
          <button onClick={() => setEdit(null)} className={botaoSec}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setEdit(ARTIGO_NOVO());
          setResumoVini("");
          setMsg("");
        }}
        className={`${botao} flex w-full items-center justify-center gap-2`}
      >
        <Plus className="size-4" /> Novo artigo
      </button>
      {msg ? <p className="px-1 text-[12px] font-medium text-ink/60">{msg}</p> : null}
      {artigos.length === 0 ? (
        <p className="px-1 text-[12px] text-ink/50">Nenhum artigo ainda. Comece pelo botão acima.</p>
      ) : (
        artigos.map((a) => (
          <div key={a.id} className="glass-panel rounded-2xl p-3">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{a.titulo || "Sem título"}</p>
                <p className="truncate text-[11px] text-ink/50">
                  {a.tempoLeitura || 1} min · {a.ativo ? "publicado" : "rascunho"}
                  {a.temResumo ? " · resumo do Vini" : ""}
                  {a.temAudio ? " · áudio" : ""}
                </p>
              </div>
              <button
                onClick={() => alternar(a.id, "ativo")}
                title={a.ativo ? "Despublicar" : "Publicar"}
                aria-label={a.ativo ? "Despublicar artigo" : "Publicar artigo"}
                className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
              >
                <Power className="size-4" />
              </button>
              <button
                onClick={() => alternar(a.id, "destaque")}
                title={a.destaque ? "Tirar da frente" : "Mostrar primeiro"}
                aria-label={a.destaque ? "Tirar artigo da frente" : "Mostrar artigo primeiro"}
                className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                onClick={() => abrir(a)}
                title="Editar"
                aria-label="Editar artigo"
                className="grid size-9 place-items-center rounded-xl bg-white/70 text-brand"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remover(a.id)}
                title="Excluir"
                aria-label="Excluir artigo"
                className="grid size-9 place-items-center rounded-xl bg-white/70 text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))
      )}
    </>
  );
}
