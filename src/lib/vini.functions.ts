import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Turno = { role: "user" | "assistant"; content: string };

/** Conversa livre com o Vini (somente administradores). */
export const conversarVini = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { mensagens: Turno[]; contexto: string }) => ({
    mensagens: (d.mensagens ?? []).slice(-16).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content).slice(0, 4000),
    })) as Turno[],
    contexto: String(d.contexto ?? "").slice(0, 12000),
  }))
  .handler(async ({ data, context }) => {
    const { data: papel } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!papel) return { texto: "Somente administradores podem conversar com o Vini." };

    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { texto: "O assistente está indisponível no momento." };

    const sistema = `Você é o Vini, assistente simpático do painel de um hub de cupons e links de afiliado no Brasil. Responda em português do Brasil, de forma curta, prática e amigável, em texto simples (sem markdown pesado). Ajude o administrador a: tirar dúvidas, ter ideias de divulgação, escolher categorias, escrever descrições e explicar o que uma loja vende e para quem ela é (se não tiver certeza sobre a loja, diga isso e dê pistas de como confirmar). Você também executa ações no painel quando o usuário escreve comandos como "criar categoria X icone Y", "criar loja X na categoria Y link URL", "adicionar cupom CODIGO na loja X descrição", "ativar/desativar/excluir categoria X", "excluir loja X", "adicionar rede X icone Y link URL", "atualizar termos: texto". Quando sugerir uma ação, mostre o comando exato para o usuário copiar.

Dados atuais do site:
${data.contexto}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sistema }, ...data.mensagens],
      }),
    });
    if (r.status === 429) return { texto: "Muitas mensagens seguidas. Espere um pouquinho e tente de novo." };
    if (r.status === 402) return { texto: "Os créditos de IA acabaram. Adicione créditos no workspace para continuar." };
    if (!r.ok) return { texto: "Não consegui responder agora. Tente de novo." };
    const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    return { texto: j.choices?.[0]?.message?.content?.trim() || "Hmm, fiquei sem resposta. Pode repetir?" };
  });
