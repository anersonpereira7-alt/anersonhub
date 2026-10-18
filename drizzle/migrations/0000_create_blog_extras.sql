CREATE TABLE public.blog_extras (
  artigo_id text PRIMARY KEY,
  resumo text NOT NULL DEFAULT '',
  audio text NOT NULL DEFAULT '',
  mime text NOT NULL DEFAULT 'audio/wav',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_extras TO anon, authenticated;
GRANT INSERT, UPDATE ON public.blog_extras TO authenticated;
GRANT ALL ON public.blog_extras TO service_role;
ALTER TABLE public.blog_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view blog extras" ON public.blog_extras FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert blog extras" ON public.blog_extras FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update blog extras" ON public.blog_extras FOR UPDATE TO authenticated USING (private.has_role(auth.uid(), 'admin')) WITH CHECK (private.has_role(auth.uid(), 'admin'));