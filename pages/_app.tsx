import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Link from "next/link";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div>
      <header className="sticky top-0 z-10 bg-ecg-blue text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <img
            src="https://www.ecg.com.gh/images/logo.png"
            alt="ECG Logo"
            width={36}
            height={36}
          />
          <Link href="/" className="font-semibold">ECG Bill Calculator</Link>
          <span className="ml-auto accent-pill">Beta</span>
        </div>
      </header>
      <Component {...pageProps} />
      <footer className="mt-10 py-6 border-t">
        <div className="max-w-6xl mx-auto px-4 text-sm text-gray-600">
          Built for demonstration purposes. Not affiliated with ECG.
        </div>
      </footer>
    </div>
  );
}
