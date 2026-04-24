import fs from "node:fs";
import path from "node:path";
import Script from "next/script";
import "../styles/landing-trasy.css";

export default function Home() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src/content/landing-body.html"),
    "utf8"
  );

  return (
    <>
      <main id="strona-glowna" aria-label="Strona główna naszawies.pl">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </main>
      <Script src="/landing-app.js" strategy="afterInteractive" />
    </>
  );
}
