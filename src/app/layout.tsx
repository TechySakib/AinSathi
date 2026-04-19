import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AinSathi (আইনসাথী) — Bangladesh AI Legal Assistant",
  description:
    "AinSathi is your intelligent legal companion for Bangladesh — get instant, AI-powered guidance on laws, acts, and legal rights in Bangla and English.",
  keywords: "Bangladesh law, legal assistant, AI, আইনসাথী, বাংলাদেশ আইন, legal chatbot",
  openGraph: {
    title: "AinSathi (আইনসাথী)",
    description: "Your AI-powered legal companion for Bangladesh",
    type: "website",
  },
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
