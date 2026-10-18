import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase com a chave publishable, para leituras anônimas.
 * A chave nova (sb_...) é opaca, então vai apenas em `apikey`, sem o bearer.
 */
function clientePublico() {
  const url = process.env["SUPABASE_URL"] || (import.meta.env["VITE_SUPABASE_URL"] as string | undefined);
  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ||
    (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string | undefined);
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/**
 * Lê o conteúdo do hub ainda no servidor, para a primeira tela já sair
 * com os dados atuais (evita o flash de conteúdo padrão ao recarregar).
 */
export const getHubContent = createServerFn({ method: "GET" }).handler(async () => {
  const supabasePublic = clientePublico();
  if (!supabasePublic) return null;
  const { data: row } = await supabasePublic.from("site_content").select("content").eq("id", "main").maybeSingle();
  return row ? JSON.stringify(row.content) : null;
});

export type Extras = { resumo: string; audio: string; mime: string };

/**
 * Resumo do Vini e narração em áudio de um artigo. Ficam fora do conteúdo
 * principal para não pesar em cada página: só quem aperta o botão é que busca.
 */
export const pegarExtras = createServerFn({ method: "GET" })
  .inputValidator((d: { artigoId: string }) => ({ artigoId: String(d?.artigoId ?? "").slice(0, 64) }))
  .handler(async ({ data }): Promise<Extras | null> => {
    const supabasePublic = clientePublico();
    if (!supabasePublic || !data.artigoId) return null;
    const { data: row } = await supabasePublic
      .from("blog_extras")
      .select("resumo, audio, mime")
      .eq("artigo_id", data.artigoId)
      .maybeSingle();
    if (!row) return null;
    return {
      resumo: String(row.resumo ?? ""),
      audio: String(row.audio ?? ""),
      mime: String(row.mime ?? "audio/wav"),
    };
  });
