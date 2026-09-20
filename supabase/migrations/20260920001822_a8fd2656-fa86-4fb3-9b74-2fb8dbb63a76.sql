CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.site_content (
  id text PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT UPDATE ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view site content" ON public.site_content FOR SELECT TO anon, authenticated USING (id = 'main');
CREATE POLICY "Admins can update site content" ON public.site_content FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER site_content_set_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_content (id, content) VALUES (
  'main',
  '{"perfil":{"marca":"CupomHub","slogan":"ofertas que rendem","nome":"Anerson Ofertas","descricao":"Caço os melhores cupons e ofertas reais pra você economizar todo dia. 💸"},"categorias":[{"id":"c1","nome":"Moda","slug":"moda","descricao":"Roupas, calçados e acessórios com desconto de verdade.","iconId":"roupas","ativa":true,"restrita":false,"aviso":""},{"id":"c2","nome":"Beleza","slug":"beleza","descricao":"Cosméticos e cuidados pessoais das melhores marcas.","iconId":"cosmeticos","ativa":true,"restrita":false,"aviso":""},{"id":"c3","nome":"Perfume","slug":"perfume","descricao":"Perfumaria importada e nacional em promoção.","iconId":"perfumes","ativa":true,"restrita":false,"aviso":""},{"id":"c4","nome":"Saúde","slug":"saude","descricao":"Suplementos, farmácia e bem-estar.","iconId":"suplementos","ativa":true,"restrita":false,"aviso":""},{"id":"c5","nome":"Internet","slug":"internet","descricao":"Planos de internet fixa e móvel com bônus.","iconId":"internet","ativa":true,"restrita":false,"aviso":""},{"id":"c6","nome":"Chips","slug":"chips","descricao":"Chips telefônicos e planos pré e pós-pagos.","iconId":"chips","ativa":true,"restrita":false,"aviso":""},{"id":"c7","nome":"Cartão","slug":"cartao","descricao":"Maquininhas, cartões e contas digitais.","iconId":"maquininha","ativa":true,"restrita":false,"aviso":""},{"id":"c8","nome":"Apostas","slug":"apostas","descricao":"Casas de aposta parceiras e bônus de cadastro.","iconId":"bet","ativa":true,"restrita":true,"aviso":"Conteúdo para maiores de 18 anos. Aposte com responsabilidade — jogo pode causar dependência."}],"lojas":[{"id":"l1","nome":"Loja Bella","descricao":"Roupas femininas · frete grátis acima de R$199","url":"https://exemplo.com/loja-bella","categorias":["c1"],"temCupom":true,"ativa":true,"cupons":[{"id":"k1","codigo":"BELLA20","descricao":"20% OFF em compras acima de R$150."},{"id":"k2","codigo":"FRETEBELLA","descricao":"Frete grátis para todo o Brasil."}]},{"id":"l2","nome":"Moda Urbana","descricao":"Streetwear e sneakers · novo drop toda sexta","url":"https://exemplo.com/moda-urbana","categorias":["c1"],"temCupom":false,"ativa":true,"cupons":[]},{"id":"l3","nome":"Beleza Prime","descricao":"Cosméticos e skincare importados","url":"https://exemplo.com/beleza-prime","categorias":["c2","c3"],"temCupom":true,"ativa":true,"cupons":[{"id":"k3","codigo":"PRIME15","descricao":"15% OFF na primeira compra."}]}],"redes":[{"id":"r1","nome":"Instagram","iconId":"instagram","url":"https://instagram.com"},{"id":"r2","nome":"TikTok","iconId":"music","url":"https://tiktok.com"},{"id":"r3","nome":"YouTube","iconId":"youtube","url":"https://youtube.com"},{"id":"r4","nome":"WhatsApp","iconId":"message-circle","url":"https://wa.me/5500000000000"}],"textos":{"termos":"Este site reúne links de afiliado e cupons de lojas parceiras. Ao clicar em um link você é redirecionado ao site da loja, onde valem os termos e condições dela. Podemos receber comissão pelas compras realizadas, sem custo adicional para você. Cupons podem expirar ou ser alterados pelas lojas sem aviso prévio.","privacidade":"Não coletamos dados pessoais sensíveis. Podemos usar métricas anônimas de navegação para melhorar o site. Ao acessar lojas parceiras, seus dados passam a ser tratados conforme a política de privacidade de cada loja. Dúvidas sobre seus dados podem ser enviadas pelos nossos canais de contato."}}'::jsonb
);