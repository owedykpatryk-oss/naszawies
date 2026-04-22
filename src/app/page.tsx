import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

export default function Home() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src/content/landing-body.html"),
    "utf8"
  );

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Script src="/landing-app.js" strategy="afterInteractive" />
    </>
  );
}
