import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/official_ecg_logo.jpg?v=2" sizes="32x32" type="image/jpeg" />
        <link rel="shortcut icon" href="/official_ecg_logo.jpg?v=2" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/official_ecg_logo.jpg?v=2" />
        <meta name="theme-color" content="#0033a1" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
