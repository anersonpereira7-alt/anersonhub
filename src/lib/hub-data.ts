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
};

export type RedeSocial = { id: string; nome: string; iconId: string; url: string };

export type HubData = {
  perfil: { nome: string; descricao: string; marca: string; slogan: string };
  categorias: Categoria[];
  lojas: Loja[];
  redes: RedeSocial[];
  textos: { termos: string; privacidade: string };
  admin: { usuario: string; senha: string };
};

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
  textos: {
    termos:
      "Este site reúne links de afiliado e cupons de lojas parceiras. Ao clicar em um link você é redirecionado ao site da loja, onde valem os termos e condições dela. Podemos receber comissão pelas compras realizadas, sem custo adicional para você. Cupons podem expirar ou ser alterados pelas lojas sem aviso prévio.",
    privacidade:
      "Não coletamos dados pessoais sensíveis. Podemos usar métricas anônimas de navegação para melhorar o site. Ao acessar lojas parceiras, seus dados passam a ser tratados conforme a política de privacidade de cada loja. Dúvidas sobre seus dados podem ser enviadas pelos nossos canais de contato.",
  },
  admin: { usuario: "admin", senha: "Cupom@2026" },
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
export function useHubData(): HubData {
  const data = useSyncExternalStore(subscribe, read, () => DEFAULT_DATA);
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
