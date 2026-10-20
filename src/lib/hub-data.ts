import { useEffect, useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type Cupom = { id: string; codigo: string; descricao: string };

export type Categoria = {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  iconId: string;
  ativa: boolean;
  restrita: boolean;
  aviso: string;
};

export type Loja = {
  id: string;
  nome: string;
  descricao: string;
  url: string;
  categorias: string[];
  temCupom: boolean;
  cupons: Cupom[];
  ativa: boolean;
  destaque?: boolean;
};

export type RedeSocial = { id: string; nome: string; iconId: string; url: string };

/** Formatos aceitos para os banners. As medidas são as artes indicadas aos anunciantes. */
export type FormatoAnuncio = "barra" | "retangulo" | "quadrado" | "feed" | "grande";

export const FORMATOS: Record<FormatoAnuncio, { label: string; largura: number; altura: number }> = {
  barra: { label: "Barra mobile · 320×50", largura: 320, altura: 50 },
  retangulo: { label: "Retângulo médio · 300×250", largura: 300, altura: 250 },
  quadrado: { label: "Quadrado · 300×300", largura: 300, altura: 300 },
  feed: { label: "Feed (quadrado grande) · 600×600", largura: 600, altura: 600 },
  grande: { label: "Banner grande mobile · 320×600", largura: 320, altura: 600 },
};

/** Níveis de chance no sorteio: padrão, dobro ou quádruplo. */
export type PesoAnuncio = 1 | 2 | 4;

export const PESOS: Record<PesoAnuncio, string> = {
  1: "Padrão",
  2: "Dobro de chance",
  4: "Quádruplo de chance",
};

export type Anuncio = {
  id: string;
  tag: string;
  tipo: "imagem" | "script";
  imagem?: string;
  link?: string;
  codigo?: string;
  ativo: boolean;
  destaque?: boolean;
  peso?: PesoAnuncio;
  formato?: FormatoAnuncio;
  home: boolean;
  blog?: boolean;
  categorias: string[];
};

/** Blocos que formam um artigo do blog. */
export type Bloco =
  | { id: string; tipo: "texto"; texto: string }
  | { id: string; tipo: "titulo"; texto: string }
  | { id: string; tipo: "anuncio"; anuncios: string[]; formato?: FormatoAnuncio }
  | {
      id: string;
      tipo: "link";
      texto: string;
      destino: "categoria" | "direto";
      categoriaSlug?: string;
      url?: string;
    };

export type Artigo = {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  tempoLeitura: number;
  ativo: boolean;
  destaque: boolean;
  imagem?: string;
  categorias: string[];
  blocos: Bloco[];
  textoNarracao: string;
  temAudio: boolean;
  temResumo: boolean;
  criadoEm: string;
};

export type HubData = {
  perfil: { nome: string; descricao: string; marca: string; slogan: string; foto?: string };
  categorias: Categoria[];
  lojas: Loja[];
  redes: RedeSocial[];
  anuncios?: Anuncio[];
  artigos?: Artigo[];
  textos: { termos: string; privacidade: string };
};

export const CATEGORIAS_BLOG = [
  "Dicas de Economia",
  "Internet & Tecnologia",
  "Alimentação & Mercado",
  "Moda & Vestuário",
  "Institucional",
  "Geral",
] as const;

export type CategoriaBlog = (typeof CATEGORIAS_BLOG)[number];

const STORAGE_KEY = "hub-afiliado-v1";

export function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const DEFAULT_DATA: HubData = {
  perfil: {
    marca: "CupomHub",
    slogan: "ofertas que rendem",
    nome: "Anerson Ofertas",
    descricao: "Caço os melhores cupons e ofertas reais pra você economizar todo dia. 💸",
  },
  categorias: [
    {
      id: "c1",
      nome: "Moda",
      slug: "moda",
      descricao: "Roupas, calçados e acessórios com desconto de verdade.",
      iconId: "roupas",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c2",
      nome: "Beleza",
      slug: "beleza",
      descricao: "Cosméticos e cuidados pessoais das melhores marcas.",
      iconId: "cosmeticos",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c3",
      nome: "Perfume",
      slug: "perfume",
      descricao: "Perfumaria importada e nacional em promoção.",
      iconId: "perfumes",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c4",
      nome: "Saúde",
      slug: "saude",
      descricao: "Suplementos, farmácia e bem-estar.",
      iconId: "suplementos",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c5",
      nome: "Internet",
      slug: "internet",
      descricao: "Planos de internet fixa e móvel com bônus.",
      iconId: "internet",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c6",
      nome: "Chips",
      slug: "chips",
      descricao: "Chips telefônicos e planos pré e pós-pagos.",
      iconId: "chips",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c7",
      nome: "Cartão",
      slug: "cartao",
      descricao: "Maquininhas, cartões e contas digitais.",
      iconId: "maquininha",
      ativa: true,
      restrita: false,
      aviso: "",
    },
    {
      id: "c8",
      nome: "Apostas",
      slug: "apostas",
      descricao: "Casas de aposta parceiras e bônus de cadastro.",
      iconId: "bet",
      ativa: true,
      restrita: true,
      aviso: "Conteúdo para maiores de 18 anos. Aposte com responsabilidade — jogo pode causar dependência.",
    },
  ],
  lojas: [
    {
      id: "l1",
      nome: "Loja Bella",
      descricao: "Roupas femininas · frete grátis acima de R$199",
      url: "https://exemplo.com/loja-bella",
      categorias: ["c1"],
      temCupom: true,
      ativa: true,
      cupons: [
        { id: "k1", codigo: "BELLA20", descricao: "20% OFF em compras acima de R$150." },
        { id: "k2", codigo: "FRETEBELLA", descricao: "Frete grátis para todo o Brasil." },
      ],
    },
    {
      id: "l2",
      nome: "Moda Urbana",
      descricao: "Streetwear e sneakers · novo drop toda sexta",
      url: "https://exemplo.com/moda-urbana",
      categorias: ["c1"],
      temCupom: false,
      ativa: true,
      cupons: [],
    },
    {
      id: "l3",
      nome: "Beleza Prime",
      descricao: "Cosméticos e skincare importados",
      url: "https://exemplo.com/beleza-prime",
      categorias: ["c2", "c3"],
      temCupom: true,
      ativa: true,
      cupons: [{ id: "k3", codigo: "PRIME15", descricao: "15% OFF na primeira compra." }],
    },
  ],
  redes: [
    { id: "r1", nome: "Instagram", iconId: "instagram", url: "https://instagram.com" },
    { id: "r2", nome: "TikTok", iconId: "music", url: "https://tiktok.com" },
    { id: "r3", nome: "YouTube", iconId: "youtube", url: "https://youtube.com" },
    { id: "r4", nome: "WhatsApp", iconId: "message-circle", url: "https://wa.me/5500000000000" },
  ],
  artigos: [],
  textos: {
    termos:
      "Este site reúne links de afiliado e cupons de lojas parceiras. Ao clicar em um link você é redirecionado ao site da loja, onde valem os termos e condições dela. Podemos receber comissões por indicações.",
    privacidade:
      "Não coletamos dados pessoais sensíveis. Podemos usar métricas anônimas de navegação para melhorar o site. Ao acessar lojas parceiras, seus dados passam a ser tratados conforme a política da loja correspondente.",
  },
};

let cache: HubData | null = null;
const listeners = new Set<() => void>();

function read(): HubData {
  if (cache) return cache;
  if (typeof window === "undefined") return DEFAULT_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? ({ ...DEFAULT_DATA, ...JSON.parse(raw) } as HubData) : DEFAULT_DATA;
  } catch {
    cache = DEFAULT_DATA;
  }
  return cache;
}

export function getData(): HubData {
  return read();
}

export function setData(updater: (d: HubData) => HubData) {
  const next = updater(read());
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
  void supabase
    .from("site_content")
    .update({ content: next as unknown as Json })
    .eq("id", "main")
    .then(({ error }) => {
      if (error) console.error("Não foi possível salvar o conteúdo no Cloud:", error.message);
    });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Lê os dados do hub. Durante o SSR devolve os dados padrão. */
let primedWith: string | null = null;

function parseInicial(inicial?: string | null): HubData | null {
  if (!inicial) return null;
  try {
    return { ...DEFAULT_DATA, ...(JSON.parse(inicial) as HubData) };
  } catch {
    return null;
  }
}

export function useHubData(inicial?: string | null): HubData {
  const inicialData = parseInicial(inicial);
  if (typeof window !== "undefined" && inicial && inicialData && primedWith !== inicial) {
    primedWith = inicial;
    cache = inicialData;
  }
  const data = useSyncExternalStore(subscribe, read, () => inicialData ?? DEFAULT_DATA);
  useEffect(() => {
    let ativo = true;
    void supabase
      .from("site_content")
      .select("content")
      .eq("id", "main")
      .single()
      .then(({ data: row, error }) => {
        if (!ativo || error || !row) return;
        cache = { ...DEFAULT_DATA, ...(row.content as unknown as HubData) };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        listeners.forEach((l) => l());
      });
    return () => {
      ativo = false;
    };
  }, []);
  return data;
}

export function lojasDaCategoria(d: HubData, categoriaId: string) {
  return d.lojas.filter((l) => l.ativa && l.categorias.includes(categoriaId));
}

export function categoriaPorSlug(d: HubData, slug: string) {
  return d.categorias.find((c) => c.slug === slug);
}

/** Chance real de cada anúncio no sorteio. */
export function pesoDe(a: Anuncio): number {
  return a.peso ?? (a.destaque ? 2 : 1);
}

/**
 * Anúncios ativos disponíveis para um local.
 * "home", "blog", o id de uma categoria, ou "bloco" (dentro de um artigo,
 * onde a lista de anúncios autorizados vem do próprio bloco).
 */
export function anunciosDe(d: HubData, local: string) {
  return (d.anuncios ?? []).filter(
    (a) =>
      a.ativo &&
      (local === "bloco"
        ? true
        : local === "home"
          ? a.home
          : local === "blog"
            ? !!a.blog
            : a.categorias.includes(local)),
  );
}

/** Sorteio ponderado: um anúncio com peso 4 entra 4 vezes mais que um com peso 1. */
export function sortearAnuncio<T extends { peso?: PesoAnuncio; destaque?: boolean }>(lista: T[]): T | null {
  if (lista.length === 0) return null;
  if (lista.length === 1) return lista[0] ?? null;
  const pesos = lista.map((a) => a.peso ?? (a.destaque ? 2 : 1));
  const total = pesos.reduce((s, p) => s + p, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pesos.length; i++) {
    r -= pesos[i] ?? 1;
    if (r < 0) return lista[i] ?? null;
  }
  return lista[lista.length - 1] ?? null;
}

/* ----------------------------- Blog ----------------------------- */

/** Texto puro de um artigo (títulos + parágrafos), usado na leitura estimada e no Vini. */
export function textoDoArtigo(a: Artigo): string {
  return a.blocos
    .filter((b) => b.tipo !== "anuncio")
    .map((b) => ("texto" in b ? b.texto : ""))
    .join("\n\n")
    .trim();
}

/** Tempo de leitura em minutos, contando por 200 palavras por minuto. */
export function tempoDeLeitura(texto: string): number {
  const palavras = texto.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palavras / 200));
}

export function artigoPorSlug(d: HubData, slug: string) {
  return (d.artigos ?? []).find((a) => a.slug === slug);
}

export function artigosAtivos(d: HubData) {
  return (d.artigos ?? []).filter((a) => a.ativo);
}

















































































































































































































































































































































































