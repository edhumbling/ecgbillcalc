import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {(() => {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
          const title = "ECG Bill Calculator";
          const description = "Compute ECG electricity bills quickly with editable tariffs.";
          const ogImage = `${siteUrl}/official_ecg_logo.jpg?v=2`;
          return (
            <>
              <link rel="icon" href="/official_ecg_logo.jpg?v=2" sizes="32x32" type="image/jpeg" />
              <link rel="shortcut icon" href="/official_ecg_logo.jpg?v=2" type="image/jpeg" />
              <link rel="apple-touch-icon" href="/official_ecg_logo.jpg?v=2" />
              <link rel="image_src" href="/official_ecg_logo.jpg?v=2" />
              {siteUrl && <link rel="canonical" href={siteUrl} />}
              <meta name="theme-color" content="#0033a1" />
              <meta property="og:type" content="website" />
              <meta property="og:title" content={title} />
              <meta property="og:description" content={description} />
              <meta property="og:url" content={siteUrl} />
              <meta property="og:image" content={ogImage} />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
              <meta property="og:image:alt" content="ECG logo" />
              <meta property="og:site_name" content="ECG Bill Calculator" />
              <meta name="twitter:card" content="summary_large_image" />
              <meta name="twitter:title" content={title} />
              <meta name="twitter:description" content={description} />
              <meta name="twitter:image" content={ogImage} />
              <meta name="twitter:image:alt" content="ECG logo" />
            </>
          );
        })()}
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
