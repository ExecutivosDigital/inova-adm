import { ContextProviders } from "@/context/ContextProviders";
import type { Metadata } from "next";
import { CookiesProvider } from "next-client-cookies/server";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TechLub ADM",
  description: "Sistema de Gestão TechLub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <CookiesProvider>
          <ContextProviders>{children}</ContextProviders>
        </CookiesProvider>
      </body>
    </html>
  );
}
