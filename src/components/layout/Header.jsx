import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router";
import { usePreferences } from "../../hooks/usePreferences.js";
import { LogoIcon, MenuIcon, MoonIcon, SunIcon, XIcon } from "../ui/icons.jsx";
import { iconButtonClass } from "../ui/styles.js";

const NAV_ITEMS = [
  { to: "/", label: "Início", end: true },
  { to: "/favoritos", label: "Favoritos" },
  { to: "/ajuda", label: "Ajuda" },
];

// Item ativo: cor + sublinhado + negrito (não só cor — WCAG 1.4.1) e aria-current="page" (automático no NavLink).
const navLinkClass = ({ isActive }) =>
  [
    "flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium transition-colors",
    isActive
      ? "text-accent-text underline decoration-2 underline-offset-8"
      : "text-muted hover:bg-surface-2 hover:text-fg",
  ].join(" ");

export default function Header() {
  const { theme, toggleTheme } = usePreferences();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  // Esc fecha o menu móvel e devolve o foco ao botão que o abriu.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/95 backdrop-blur">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMenu}
          className="mr-auto flex items-center gap-2 rounded-lg text-xl font-extrabold"
        >
          <LogoIcon className="size-8 text-accent-text" />
          <span>
            Movie<span className="text-accent-text">Spot</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="flex items-center">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="menu-principal"
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 font-medium hover:bg-surface-2 md:hidden"
          >
            {menuOpen ? <XIcon /> : <MenuIcon />}
            Menu
          </button>

          <ul
            id="menu-principal"
            className={`${menuOpen ? "flex" : "hidden"} absolute inset-x-0 top-16 flex-col gap-1 border-b border-border bg-bg p-4 shadow-xl md:static md:flex md:flex-row md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
          >
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={navLinkClass}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"
          }
          className={iconButtonClass}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
