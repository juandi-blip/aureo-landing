import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
});

export const metadata: Metadata = {
  title: "Aureo — Control total de tu inventario, ventas y bodega",
  description:
    "El sistema que le da a tu negocio el control logístico que antes solo tenían las grandes empresas. Inventario, ventas y bodega en un solo lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn("h-full", "antialiased", inter.variable, syne.variable, "font-sans")}
    >
      <body className="font-sans min-h-full flex flex-col">{children}<Analytics /></body>
    </html>
  );
}
