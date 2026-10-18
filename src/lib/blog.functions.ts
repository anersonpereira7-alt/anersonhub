import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev";
const MODELO_RESUMO = "openai/gpt-6-astra";
const MODELO_VOZ = "google/gemini-3.1-flash-tts-preview";
const VOZES = ["Kore", "Puck", "Charon", "Fenrir", "Aoede", "Leda", "Zephyr", "Orus"];

const PROMPT_RESUMO = `Você é o Vini, assistente do Anerson Hub de Ofertas.
Você vai ler um artigo e escrever um resumo curto para o leitor decidir se quer continuar.
Regras:
- Até 3 frases curtas, português do Brasil.
- Palavras do dia a dia, de conversa de padaria. Nada de termo técnico e nada de palavra em inglês quando existir a palavra em português (celular, não smartphone; nuvem, não cloud).
- Diga sobre o que é o artigo e por que vale a leitura, sem entregar a conclusão e sem clickbait.
- Sem saudação, sem título, sem aspas, sem markdown. Só o texto corrido do resumo.`;

async function lerSSE(res: Response): Promise<string> {
  if (!res.ok || !res.body) throw new Error(`Falha ao gerar o resumo (${res.status})`);
  const leitor = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let saida = "";
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const linhas = buf.split("\n");
    buf = linhas.pop() ?? "";
    for (const linha of linhas) {
      if (!linha.startsWith("data:")) continue;
      const json = linha.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const obj = JSON.parse(json) as { type?: string; delta?: string };
        if (obj.type === "response.output_text.delta" && typeof obj.delta === "string") saida += obj.delta;
      } catch {
        /* linha incompleta — espera o próximo pedaço */
      }
    }
  }
  return saida.trim();
}

/** Vini lê o artigo e devolve um resumo curto em linguagem simples. */
export const resumirComVini = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { texto: string }) => ({ texto: String(d?.texto ?? "").slice(0, 12000) }))
  .handler(async ({ data }) => {
    if (!data.texto.trim()) throw new Error("O artigo ainda não tem texto para o Vini ler.");
    const res = await fetch(`${GATEWAY}/v1/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODELO_RESUMO,
        store: false,
        stream: true,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: PROMPT_RESUMO },
          { role: "user", content: data.texto },
        ],
      }),
    });
    const texto = await lerSSE(res);
    if (!texto) throw new Error("O Vini não conseguiu resumir agora. Tente de novo.");
    return { texto };
  });

/** Salva o resumo escolhido (o admin pode editar antes de gravar). */
export const salvarResumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { artigoId: string; resumo: string }) => ({
    artigoId: String(d?.artigoId ?? "").slice(0, 64),
    resumo: String(d?.resumo ?? "").slice(0, 2000),
  }))
  .handler(async ({ data, context }) => {
    if (!data.artigoId) throw new Error("Artigo não identificado.");
    const { data: atual } = await context.supabase
      .from("blog_extras")
      .select("audio, mime")
      .eq("artigo_id", data.artigoId)
      .maybeSingle();
    const { error } = await context.supabase.from("blog_extras").upsert(
      {
        artigo_id: data.artigoId,
        resumo: data.resumo,
        audio: atual?.audio ?? "",
        mime: atual?.mime ?? "audio/wav",
      },
      { onConflict: "artigo_id" },
    );
    if (error) throw new Error(`Não foi possível guardar o resumo: ${error.message}`);
    return { ok: true };
  });

const PROMPT_ROTEIRO = `Você é o Vini, assistente do Anerson Hub de Ofertas.
Você vai transformar um artigo em roteiro de áudio, para ser lido em voz alta.
Regras:
- Português do Brasil, tom de conversa, acolhedor.
- Comece com uma saudação curta e diga o nome do site (Anerson Hub de Ofertas).
- Explique o assunto com palavras simples, de conversa de padaria. Nada de termo técnico e nada de inglês quando existir a palavra em português.
- Frases curtas. Sem listas, sem markdown, sem títulos, sem asteriscos.
- Termine com uma despedida curta.
- No máximo 250 palavras.`;

/** O Vini escreve o roteiro que será lido no áudio (com saudação e despedida). */
export const gerarRoteiro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { texto: string }) => ({ texto: String(d?.texto ?? "").slice(0, 12000) }))
  .handler(async ({ data }) => {
    if (!data.texto.trim()) throw new Error("O artigo ainda não tem texto para o Vini ler.");
    const res = await fetch(`${GATEWAY}/v1/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODELO_RESUMO,
        store: false,
        stream: true,
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: PROMPT_ROTEIRO },
          { role: "user", content: data.texto },
        ],
      }),
    });
    const texto = await lerSSE(res);
    if (!texto) throw new Error("O Vini não conseguiu escrever o roteiro agora. Tente de novo.");
    return { texto: texto.slice(0, 2600) };
  });

/**
 * Converte o roteiro do artigo em fala e guarda na nuvem.
 * Gera uma vez só: depois é só apertar play, sem gastar créditos de novo.
 */
export const gerarNarracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { artigoId: string; texto: string; voz?: string }) => ({
    artigoId: String(d?.artigoId ?? "").slice(0, 64),
    texto: String(d?.texto ?? "").slice(0, 2600),
    voz: VOZES.includes(String(d?.voz)) ? String(d?.voz) : "Kore",
  }))
  .handler(async ({ data, context }) => {
    if (!data.artigoId) throw new Error("Artigo não identificado.");
    if (!data.texto.trim()) throw new Error("Escreva o roteiro que o Vini deve ler.");

    const res = await fetch(`${GATEWAY}/v1/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "Content-Type": "application/json",
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: MODELO_VOZ,
        contents: [{ role: "user", parts: [{ text: data.texto }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: data.voz } } },
        },
      }),
    });
    if (!res.ok) throw new Error(`Não consegui gerar o áudio (${res.status}). Tente de novo.`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > 9_000_000) {
      throw new Error("O roteiro ficou longo demais para um áudio só. Divida em duas partes.");
    }

    let base64 = "";
    const FAIXA = 0x8000;
    for (let i = 0; i < bytes.length; i += FAIXA) {
      base64 += String.fromCharCode(...bytes.subarray(i, i + FAIXA));
    }
    base64 = btoa(base64);

    const { data: atual } = await context.supabase
      .from("blog_extras")
      .select("resumo")
      .eq("artigo_id", data.artigoId)
      .maybeSingle();
    const { error } = await context.supabase.from("blog_extras").upsert(
      {
        artigo_id: data.artigoId,
        resumo: atual?.resumo ?? "",
        audio: base64,
        mime: "audio/wav",
      },
      { onConflict: "artigo_id" },
    );
    if (error) throw new Error(`O áudio foi gerado, mas não deu para guardar: ${error.message}`);
    return { ok: true, tamanho: bytes.byteLength };
  });

/** Apaga o áudio de um artigo (o resumo continua no lugar). */
export const removerNarracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { artigoId: string }) => ({ artigoId: String(d?.artigoId ?? "").slice(0, 64) }))
  .handler(async ({ data, context }) => {
    const { data: atual } = await context.supabase
      .from("blog_extras")
      .select("resumo")
      .eq("artigo_id", data.artigoId)
      .maybeSingle();
    const { error } = await context.supabase.from("blog_extras").upsert(
      { artigo_id: data.artigoId, resumo: atual?.resumo ?? "", audio: "", mime: "audio/wav" },
      { onConflict: "artigo_id" },
    );
    if (error) throw new Error(`Não foi possível remover o áudio: ${error.message}`);
    return { ok: true };
  });
