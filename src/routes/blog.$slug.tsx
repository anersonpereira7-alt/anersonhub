          {artigo.blocos.map((b) => {
            if (b.tipo === "titulo") return <h2 key={b.id}>{b.texto}</h2>;
            if (b.tipo === "texto") return <p key={b.id}>{b.texto}</p>;
            if (b.tipo === "link") {
              const buttonClass =
                "mt-3 inline-flex w-full items-center justify-between gap-3 rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/10 via-violet/10 to-brand/5 px-4 py-3 text-left text-[15px] font-semibold text-ink";

              if (b.destino === "categoria") {
                return (
                  <Link
                    key={b.id}
                    to="/categoria/$slug"
                    params={{ slug: b.categoriaSlug || "" }}
                    className={buttonClass}
                  >
                    <span>{b.texto || "Ver ofertas"}</span>
                    <span aria-hidden="true" className="text-lg">
                      →
                    </span>
                  </Link>
                );
              }

              return (
                <a
                  key={b.id}
                  href={b.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass}
                >
                  <span>{b.texto || "Acessar link"}</span>
                  <span aria-hidden="true" className="text-lg">
                    →
                  </span>
                </a>
              );
            }

            if (b.tipo === "anuncio") {
              const anuncioSorteado = mapaAnuncios[b.id];
              if (!anuncioSorteado) return null;
              return (
                <AnuncioView
                  key={b.id}
                  anuncio={anuncioSorteado}
                  formato={b.formato ?? "barra"}
                  rotulo={anuncioSorteado.social ? "Utilidade Pública" : "Publicidade"}
                  slot={0}
                />
              );
            }

            return null;
          })}
