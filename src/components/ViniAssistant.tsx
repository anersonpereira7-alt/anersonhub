import { useEffect, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,

} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ICON_LIBRARY } from "@/lib/icon-library";
import { getData, setData, slugify, uid, type HubData } from "@/lib/hub-data";
import { conversarVini } from "@/lib/vini.functions";
import vini3d from "@/assets/vini-3d.png";

type Msg = { autor: "vini" | "voce"; texto: string };

const RE_COMANDO =
  /^(criar (categoria|loja)|(ativar|desativar) categoria|(excluir|apagar|remover) (categoria|loja|rede)|adicionar (cupom|rede))\s/;

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

/** Remove acentos para comparar comandos escritos com ou sem acentuação. */
function semAcento(v: string) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/** Executa uma única linha de comando. */
function executarLinha(entrada: string): string {
  const texto = entrada.replace(/^[\s•\-*]+/, "").trim();
  const t = semAcento(texto.toLowerCase());

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

  return `Não entendi "${texto}".\n\n${AJUDA}`;
}

/**
 * Interpreta um comando em linguagem natural. Aceita várias linhas:
 * cada linha vira um comando, exceto textos legais (que podem ter parágrafos).
 */
export function executarComando(entrada: string): string {
  const texto = entrada.trim();
  if (!texto) return AJUDA;
  if (/^atualizar\s+(termos|privacidade)/i.test(semAcento(texto))) return executarLinha(texto);

  const linhas = texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (linhas.length <= 1) return executarLinha(texto);
  return linhas.map((l) => `• ${executarLinha(l)}`).join("\n");
}


export function ViniAssistant() {
  const [msgs, setMsgs] = useState<Msg[]>([
    { autor: "vini", texto: "Oi! Sou o Vini. Pode bater papo comigo, tirar dúvidas sobre lojas e categorias, pedir ideias de divulgação — ou me dar comandos para mexer no painel. Digite \"ajuda\" para ver os comandos." },
  ]);
  const [input, setInput] = useState("");
  const [pensando, setPensando] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function enviar(message: PromptInputMessage) {
    const texto = (message.text?.trim() ? message.text : input).trim();
    if (!texto || pensando) return;
    setInput("");
    const linhas = texto.split("\n").map((l) => semAcento(l.trim().toLowerCase())).filter(Boolean);
    const soComandos =
      /^ajuda$/.test(linhas[0] ?? "") ||
      /^atualizar\s+(termos|privacidade)/.test(linhas[0] ?? "") ||
      linhas.every((l) => RE_COMANDO.test(l.replace(/^[\s•\-*]+/, "")));
    const historico = [...msgs, { autor: "voce" as const, texto }];
    setMsgs(historico);
    if (soComandos) {
      setMsgs([...historico, { autor: "vini", texto: executarComando(texto) }]);
    } else {
      setPensando(true);
      try {
        const d = getData();
        const contexto = JSON.stringify({
          perfil: d.perfil,
          categorias: d.categorias.map((c) => ({ nome: c.nome, descricao: c.descricao, restrita: c.restrita, ativa: c.ativa })),
          lojas: d.lojas.map((l) => ({
            nome: l.nome,
            descricao: l.descricao,
            url: l.url,
            categorias: l.categorias.map((id) => d.categorias.find((c) => c.id === id)?.nome).filter(Boolean),
            cupons: l.cupons.map((c) => c.codigo),
          })),
          icones: ICON_LIBRARY.map((i) => i.id),
        });
        const r = await conversarVini({
          data: {
            contexto,
            mensagens: historico.slice(1).map((m) => ({ role: m.autor === "voce" ? "user" : "assistant", content: m.texto })),
          },
        });
        setMsgs([...historico, { autor: "vini", texto: r.texto }]);
      } catch {
        setMsgs([...historico, { autor: "vini", texto: "Não consegui responder agora. Tente de novo." }]);
      } finally {
        setPensando(false);
      }
    }
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <section className="flex h-[calc(100dvh-15rem)] min-h-[340px] max-h-[680px] flex-col overflow-hidden rounded-2xl border border-border bg-chat-surface shadow-card md:h-[min(680px,calc(100dvh-9rem))]" aria-label="Chat com Vini">
      <header className="flex shrink-0 items-center gap-3 border-b border-border bg-chat-surface p-4">
        <img src={vini3d} alt="Vini" width={48} height={48} className="size-12 object-contain" />
        <div>
          <p className="font-display text-sm font-semibold">Vini · Assistente do painel</p>
          <p className="text-[12px] text-ink/55">Executa as ações do admin por comando.</p>
        </div>
      </header>

      <Conversation className="min-h-0 overscroll-contain bg-chat-surface">
        <ConversationContent className="gap-4 p-4">
          {msgs.map((m, i) => (
            <Message key={`${m.autor}-${i}`} from={m.autor === "voce" ? "user" : "assistant"}>
              <MessageContent
                className={
                  m.autor === "voce"
                    ? "rounded-xl bg-primary px-4 py-3 text-primary-foreground"
                    : "text-[13px] leading-relaxed text-foreground"
                }
              >
                {m.autor === "voce" ? <p className="whitespace-pre-wrap">{m.texto}</p> : <MessageResponse>{m.texto}</MessageResponse>}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton aria-label="Ir para a mensagem mais recente" />
      </Conversation>

      <div className="shrink-0 border-t border-border bg-chat-surface p-3">
        <PromptInput onSubmit={enviar} className="bg-chat-surface shadow-none">
          <PromptInputTextarea
            ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex.: criar categoria Perfumes icone perfumes"
            className="max-h-28 min-h-16 text-[13px]"
            aria-label="Mensagem para o Vini"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={pensando ? "submitted" : "ready"} disabled={pensando || !input.trim()} aria-label="Enviar mensagem" className="rounded-lg bg-primary text-primary-foreground" />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
