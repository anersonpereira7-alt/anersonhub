import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

/** Lê o conteúdo público atual do hub no servidor (evita flash de dados antigos). */
export const getHubContent = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env["SUPABASE_URL"] || import.meta.env["VITE_SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"] || import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return null;
  try {
    const sb = createClient(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await sb.from("site_content").select("content").eq("id", "main").single();
    if (error || !data) return null;
    return JSON.stringify(data.content);
  } catch {
    return null;
  }
});
