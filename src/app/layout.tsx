import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "PaperWalk — Read research papers like you wrote them",
  description:
    "Walk through research papers word by word, equation by equation, line by line.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          id="MathJax-script"
          async
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
      </head>
      <body className="font-serif antialiased h-screen flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 relative overflow-hidden flex">
          {children}
        </main>
      </body>
    </html>
  );
}
