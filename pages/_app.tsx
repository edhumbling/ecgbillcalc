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
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="https://www.ecg.com.gh/images/logo.png"
            alt="ECG Logo"
            width={36}
            height={36}
          />
          <Link href="/" className="font-semibold">ECG Bill Calculator</Link>
          <span className="ml-auto accent-pill">Beta</span>
          <button onClick={toggleTheme} className="ml-3 btn-secondary" aria-label="Toggle theme">
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </header>
      <main className="px-4">
        <Component {...pageProps} />
      </main>
      <footer className="mt-10 py-6" style={{ borderTop: "1px solid var(--outline)" }}>
        <div className="max-w-6xl mx-auto px-4 text-sm" style={{ color: "var(--muted)" }}>
          Built for demonstration purposes. Not affiliated with ECG.
        </div>
      </footer>
    </div>
  );
}
