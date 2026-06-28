import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "600", "700", "800"],
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aureo.com.co";
const SITE_NAME = "Aureo";
const TITLE = "Aureo — Inventario, ventas y bodega para tu negocio";
const DESCRIPTION =
  "Software de gestión de inventario, punto de venta y bodega para ferreterías, distribuidoras y negocios con stock. Control logístico en tiempo real. Acceso anticipado disponible.";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: [
    "software inventario",
    "control de inventario",
    "sistema de inventario",
    "punto de venta",
    "POS Colombia",
    "gestión de bodega",
    "WMS Colombia",
    "software ferretería",
    "software distribuidora",
    "control de stock",
    "inventario en tiempo real",
    "análisis ABC",
    "mapa de calor bodega",
    "picking pedidos",
    "software logística",
    "facturación electrónica",
    "ERP pequeña empresa",
    "Aureo",
  ],
  authors: [{ name: "Aureo", url: SITE_URL }],
  creator: "Aureo",
  publisher: "Aureo",
  category: "Software",
  applicationName: SITE_NAME,
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    alternateLocale: ["es_ES", "es_MX", "es_AR"],
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "Aureo — Inventario, ventas y bodega para tu negocio",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
    creator: "@aureoapp",
    site: "@aureoapp",
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "es-CO": SITE_URL,
      "es-ES": SITE_URL,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  other: {
    "theme-color": "#2E4A6E",
    "msapplication-TileColor": "#2E4A6E",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": SITE_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: "#2E4A6E",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#app`,
      name: "Aureo",
      description: DESCRIPTION,
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "COP",
        description: "Acceso anticipado disponible — únete a la lista de espera.",
      },
      featureList: [
        "Punto de venta y facturación",
        "Inventario en tiempo real",
        "Mapa de calor de bodega (WMS)",
        "Análisis ABC / Pareto",
        "Preparación de pedidos (picking)",
        "Alertas de stock",
        "Reportes y analítica",
      ],
      audience: {
        "@type": "BusinessAudience",
        audienceType: "Ferreterías, distribuidoras, negocios con inventario físico",
      },
      inLanguage: "es",
      image: OG_IMAGE,
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#org`,
      name: "Aureo",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.svg`,
      },
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        availableLanguage: "Spanish",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#org` },
      inLanguage: "es-CO",
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Necesito conocimientos técnicos para usar Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Aureo está pensado para que cualquier persona del negocio lo use desde el primer día.",
          },
        },
        {
          "@type": "Question",
          name: "¿Aureo funciona en la nube?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Sí. Accedes desde cualquier dispositivo, sin instalar nada, con tus datos siempre respaldados.",
          },
        },
        {
          "@type": "Question",
          name: "¿Para qué tipo de negocio es Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Aureo es para cualquier negocio con inventario físico, ventas y bodega: ferreterías, distribuidoras, materiales de construcción, repuestos, agroinsumos y más.",
          },
        },
        {
          "@type": "Question",
          name: "¿Cuándo estará disponible Aureo?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador.",
          },
        },
      ],
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
