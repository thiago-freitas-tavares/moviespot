import { Link } from "react-router";
import { textLinkClass } from "../ui/styles.js";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm text-muted sm:px-6 md:grid-cols-[2fr_1fr] lg:px-8">
        <p>
          Dados e imagens fornecidos pelo{" "}
          <a href="https://www.themoviedb.org/" className={textLinkClass}>
            TMDB
          </a>
          . Este produto usa a API do TMDB, mas não é endossado nem certificado
          pelo TMDB.
        </p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 md:justify-end">
          <li>
            <Link to="/ajuda#acessibilidade" className={`${textLinkClass} inline-flex min-h-6 items-center`}>
              Acessibilidade
            </Link>
          </li>
          <li>
            <Link to="/ajuda#atalhos" className={`${textLinkClass} inline-flex min-h-6 items-center`}>
              Atalhos de teclado
            </Link>
          </li>
        </ul>
        <p className="md:col-span-2">
          Projeto acadêmico - Usabilidade, desenvolvimento web, mobile e jogos ·
          2026
        </p>
      </div>
    </footer>
  );
}
