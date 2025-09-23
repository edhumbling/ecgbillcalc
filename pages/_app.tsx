import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("theme") as "light" | "dark" | null) : null;
    const initial = saved ?? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch {}
  };

  return (
    <div>
      <header className="sticky top-0 z-10 text-white shadow" style={{ background: "linear-gradient(90deg, var(--ecg-blue), #002277)" }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src="/official_ecg_logo.jpg"
            alt="ECG Logo"
            width={32}
            height={32}
            style={{ borderRadius: 8 }}
          />
          <Link href="/" className="font-semibold truncate whitespace-nowrap flex-1 text-sm sm:text-base md:text-lg" title="ECG Bill Calculator">ECG Bill Calculator</Link>
          <span className="accent-pill hidden sm:inline-block">Beta</span>
          <button onClick={toggleTheme} className="ml-auto btn-secondary" aria-label="Toggle theme">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <main className="px-4">
        <Component {...pageProps} />
      </main>
      <footer className="mt-10 py-6" style={{ borderTop: "1px solid var(--outline)" }}>
        <div className="max-w-6xl mx-auto px-4 text-sm" style={{ color: "var(--muted)" }}>
          <p className="mb-2">Built for demonstration purposes. Not affiliated with ECG.</p>
          <p className="mb-2">
            <strong>Disclaimer:</strong> Tariffs and charges may change over time. For the most
            accurate and up-to-date rates, always verify with ECG&#39;s current published tariffs
            before relying on these results.
          </p>
          <p className="text-xs">
            © {new Date().getFullYear()} All rights reserved. Made with love by
            {" "}
            <a href="https://www.linkedin.com/in/edhumbling" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80">
              Emma
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
