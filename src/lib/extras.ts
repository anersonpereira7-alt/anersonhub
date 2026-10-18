import { pegarExtras, type Extras } from "@/lib/hub.functions";

const cache = new Map<string, Promise<Extras | null>>();

/**
 * Resumo e narração de um artigo, buscados uma única vez por visita.
 * O áudio é grande, então só chega quando a pessoa aperta o botão.
 */
export function buscarExtras(artigoId: string): Promise<Extras | null> {
  let p = cache.get(artigoId);
  if (!p) {
    p = pegarExtras({ data: { artigoId } }).catch(() => null);
    cache.set(artigoId, p);
  }
  return p;
}

/** Transforma o áudio guardado em texto (base64) num endereço que o player entende. */
export function urlDoAudio(ex: Extras): string {
  const bin = atob(ex.audio);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: ex.mime || "audio/wav" }));
}
