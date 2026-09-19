import { useState } from "react";
import { Send } from "lucide-react";
import { ICON_LIBRARY } from "@/lib/icon-library";
import { setData, slugify, uid, type HubData } from "@/lib/hub-data";
import vini3d from "@/assets/vini-3d.png";

type Msg = { autor: "vini" | "voce"; texto: string };

const AJUDA = `Posso fazer tudo no painel. Exemplos:
• criar categoria Perfumes icone perfumes
• criar categoria Bets icone bet restrita
• desativar categoria Perfumes / ativar categoria Perfumes
• excluir categoria Perfumes
• criar loja Natura na categoria Beleza link https://...
• adicionar cupom NATURA20 na loja Natura 20% de desconto
• excluir loja Natura
• adicionar rede Instagram icone instagram link https://instagram.com/...
• excluir rede Instagram
• atualizar termos: texto novo
• atualizar privacidade: texto novo`;

function acharCategoria(d: HubData, nome: string) {
  const alvo = slugify(nome);
  return d.categorias.find((c) => c.slug === alvo || slugify(c.nome) === alvo);
}
function acharLoja(d: HubData, nome: string) {
  const alvo = slugify(nome);
  return d.lojas.find((l) => slugify(l.nome) === alvo);
}

/** Interpreta um comando em linguagem natural e executa a ação no painel. */
export function executarComando(entrada: string): string {
  const texto = entrada.trim();
  const t = texto.toLowerCase();

  if (!t || t.includes("ajuda") || t.includes("o que você faz")) return AJUDA;

  // criar categoria
  let m = t.match(/criar categoria (.+)/);
  if (m) {
    let resto = m[1]!;
    const restrita = /restrit/.test(resto);
    resto = resto.replace(/restrit\w*/g, "").trim();
    let iconId = "cupons";
    const mi = resto.match(/[ií]cone\s+([a-z0-9-]+)/);
    if (mi) {
      const found = ICON_LIBRARY.find((i) => i.id === mi[1]);
      if (found) iconId = found.id;
      resto = resto.replace(/[ií]cone\s+[a-z0-9-]+/, "").trim();
    }
    const nome = resto.trim();
    if (!nome) return "Qual é o nome da categoria?";
    const nomeFmt = nome.charAt(0).toUpperCase() + nome.slice(1);
    setData((d) => ({
      ...d,
      categorias: [
        ...d.categorias,
        {
          id: uid(),
          nome: nomeFmt,
          slug: slugify(nomeFmt),
          descricao: "",
          iconId,
          ativa: true,
          restrita,
          aviso: restrita ? "Conteúdo para maiores de 18 anos." : "",
        },
      ],
    }));
    return `Categoria "${nomeFmt}" criada${restrita ? " como restrita (+18)" : ""}. Ícone: ${iconId}.`;
  }

  // ativar / desativar categoria
  m = t.match(/(ativar|desativar) categoria (.+)/);
  if (m) {
    const ativar = m[1] === "ativar";
    let ok = false;
    setData((d) => {
      const cat = acharCategoria(d, m![2]!);
      if (!cat) return d;
      ok = true;
      return {
        ...d,
        categorias: d.categorias.map((c) => (c.id === cat.id ? { ...c, ativa: ativar } : c)),
      };
    });
    return ok ? `Categoria ${ativar ? "ativada" : "desativada"}.` : "Não encontrei essa categoria.";
  }

  // excluir categoria
  m = t.match(/(excluir|apagar|remover) categoria (.+)/);
  if (m) {
    let ok = false;
    setData((d) => {
      const cat = acharCategoria(d, m![2]!);
      if (!cat) return d;
      ok = true;
      return {
        ...d,
        categorias: d.categorias.filter((c) => c.id !== cat.id),
        lojas: d.lojas.map((l) => ({ ...l, categorias: l.categorias.filter((id) => id !== cat.id) })),
      };
    });
    return ok ? "Categoria excluída." : "Não encontrei essa categoria.";
  }

  // criar loja
  m = texto.match(/criar loja (.+?) na categoria (.+?)(?:\s+link\s+(\S+))?$/i);
  if (m) {
    const nome = m[1]!.trim();
    const catNome = m[2]!.trim();
    const url = m[3] ?? "";
    let ok = false;
    setData((d) => {
      const cat = acharCategoria(d, catNome);
      if (!cat) return d;
      ok = true;
      return {
        ...d,
        lojas: [
          ...d.lojas,
          {
            id: uid(),
            nome,
            descricao: "",
            url,
            categorias: [cat.id],
            temCupom: false,
            cupons: [],
            ativa: true,
          },
        ],
      };
    });
    return ok ? `Loja "${nome}" criada.` : "Não encontrei a categoria informada.";
  }

  // adicionar cupom
  m = texto.match(/adicionar cupom (\S+) na loja (.+?)(?:\s+(.*))?$/i);
  if (m) {
    const codigo = m[1]!.toUpperCase();
    const lojaNome = m[2]!.trim();
    const descricao = m[3] ?? "";
    let ok = false;
    setData((d) => {
      const loja = acharLoja(d, lojaNome);
      if (!loja) return d;
      ok = true;
      return {
        ...d,
        lojas: d.lojas.map((l) =>
          l.id === loja.id
            ? { ...l, temCupom: true, cupons: [...l.cupons, { id: uid(), codigo, descricao }] }
            : l,
        ),
      };
    });
    return ok ? `Cupom ${codigo} adicionado.` : "Não encontrei essa loja.";
  }

  // excluir loja
  m = texto.match(/(?:excluir|apagar|remover) loja (.+)/i);
  if (m) {
    let ok = false;
    setData((d) => {
      const loja = acharLoja(d, m![1]!);
      if (!loja) return d;
      ok = true;
      return { ...d, lojas: d.lojas.filter((l) => l.id !== loja.id) };
    });
    return ok ? "Loja excluída." : "Não encontrei essa loja.";
  }

  // adicionar rede social
  m = texto.match(/adicionar rede (.+?)(?:\s+[ií]cone\s+(\S+))?(?:\s+link\s+(\S+))?$/i);
  if (m && t.startsWith("adicionar rede")) {
    const nome = m[1]!.trim();
    const iconId = m[2] ?? slugify(nome);
    const url = m[3] ?? "";
    setData((d) => ({ ...d, redes: [...d.redes, { id: uid(), nome, iconId, url }] }));
    return `Rede "${nome}" adicionada.`;
  }

  m = texto.match(/(?:excluir|remover) rede (.+)/i);
  if (m) {
    const alvo = slugify(m[1]!);
    let ok = false;
    setData((d) => {
      const rede = d.redes.find((r) => slugify(r.nome) === alvo);
      if (!rede) return d;
      ok = true;
      return { ...d, redes: d.redes.filter((r) => r.id !== rede.id) };
    });
    return ok ? "Rede removida." : "Não encontrei essa rede.";
  }

  m = texto.match(/atualizar (termos|privacidade)[:\s]+([\s\S]+)/i);
  if (m) {
    const campo = m[1]!.toLowerCase() === "termos" ? "termos" : "privacidade";
    const valor = m[2]!.trim();
    setData((d) => ({ ...d, textos: { ...d.textos, [campo]: valor } }));
    return `Texto de ${campo} atualizado.`;
  }

  return `Não entendi esse comando. ${AJUDA}`;
}

export function ViniAssistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { autor: "vini", texto: "Oi! Sou o Vini. Posso criar, editar ou excluir tudo no painel. Digite \"ajuda\" para ver exemplos." },
  ]);
  const [input, setInput] = useState("");

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const texto = input.trim();
    if (!texto) return;
    const resposta = executarComando(texto);
    setMsgs((m) => [...m, { autor: "voce", texto }, { autor: "vini", texto: resposta }]);
    setInput("");
  }

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <img src={vini3d} alt="Vini" width={48} height={48} className="size-12 object-contain" />
        <div>
          <p className="font-display text-sm font-semibold">Vini · Assistente do painel</p>
          <p className="text-[12px] text-ink/55">Executa as ações do admin por comando.</p>
        </div>
      </div>

      <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.autor === "vini"
                ? "rounded-2xl rounded-tl-sm bg-white/70 p-3 text-[13px] leading-snug text-ink/75 whitespace-pre-wrap"
                : "ml-8 rounded-2xl rounded-tr-sm bg-gradient-to-r from-brand to-violet p-3 text-[13px] text-primary-foreground"
            }
          >
            {m.texto}
          </div>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex.: criar categoria Perfumes icone perfumes"
          className="flex-1 rounded-xl border border-glass-border bg-white/70 px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-ring/40"
        />
        <button className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand to-cyan text-primary-foreground transition active:scale-95">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
