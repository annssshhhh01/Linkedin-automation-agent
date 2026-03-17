import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkedOut — AI Referral Agent",
  description:
    "LinkedOut scrapes jobs, finds alumni and HR contacts, generates personalized connection notes using RAG, and sends requests automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
