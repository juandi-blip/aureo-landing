export type Module = { id: string; titulo: string; beneficio: string; icono: string };
export type Moneda = "cop" | "usd";
export type Periodo = "mensual" | "anual";
export type PlanPrecios = { cop: Record<Periodo, number>; usd: Record<Periodo, number> };
export type Plan = {
  nombre: string; resumen: string; destacado: boolean;
  precios: PlanPrecios; features: string[]; cta: string;
};
export type FaqItem = { pregunta: string; respuesta: string };

export const site = {
  marca: "Aureo",
  whatsapp: "https://wa.me/573205638153",
  hero: {
    tituloLineas: [
      "El control de tu inventario,",
      "ventas y bodega en un solo lugar.",
    ],
    subtitulo: "Aureo le da a tu negocio la inteligencia logística que antes solo tenían las grandes empresas — sin su complejidad ni su precio.",
    cta: "Unirme a la lista de espera",
    nota: "Acceso anticipado y precio de fundador para los primeros negocios.",
  },
  problema: {
    titulo: "Si tienes inventario y bodega, conoces estos dolores.",
    intro: "Le pasa a ferreterías, distribuidoras, depósitos de construcción, repuestos y cualquier negocio con productos que mover.",
    items: [
      { titulo: "Buscas productos a ciegas", texto: "Tu gente pierde horas caminando la bodega sin saber dónde está cada cosa." },
      { titulo: "No sabes qué rota y qué acumula polvo", texto: "Compras de más lo que no se vende y te quedas corto en lo que sí." },
      { titulo: "El despacho es lento", texto: "Preparar un pedido toma demasiado y el cliente espera." },
      { titulo: "El inventario nunca cuadra", texto: "Lo que dice el sistema y lo que hay en la bodega no coinciden." },
    ],
  },
  comoFunciona: {
    titulo: "Aureo lo resuelve en tres pasos.",
    pasos: [
      { titulo: "Carga tu inventario", texto: "Sube tus productos y ubicaciones. Aureo organiza tu bodega por ti." },
      { titulo: "Vende y despacha", texto: "POS rápido, facturación y picking guiado para preparar pedidos sin errores." },
      { titulo: "Decide con datos", texto: "Análisis ABC y mapa de calor te dicen qué mover, qué comprar y dónde ubicarlo." },
    ],
  },
  modulos: [
    { id: "pos", titulo: "Punto de venta", beneficio: "Vende y factura en segundos, con o sin conexión.", icono: "shopping-cart" },
    { id: "inventario", titulo: "Inventario inteligente", beneficio: "Control en tiempo real, alertas de stock y conteos físicos.", icono: "boxes" },
    { id: "wms", titulo: "Mapa de calor de bodega", beneficio: "Ve tu bodega como un plano vivo y ubica lo que más rota cerca del despacho.", icono: "map" },
    { id: "abc", titulo: "Análisis ABC / Pareto", beneficio: "Descubre el 20% de productos que generan el 80% de tus ventas.", icono: "bar-chart" },
    { id: "picking", titulo: "Preparación de pedidos", beneficio: "Recorridos optimizados para despachar más rápido y sin errores.", icono: "route" },
    { id: "reubicacion", titulo: "Reubicación inteligente", beneficio: "Sugerencias para ubicar lo que más rota cerca del despacho.", icono: "arrow-right-left" },
  ] as Module[],
  demo: {
    titulo: "Mira la inteligencia logística en acción.",
    texto: "El mapa de calor y el análisis ABC son lo que separa a Aureo de un POS común.",
    placeholder: "Demo en video — próximamente.",
    ctaExplorar: "Explora la demo tú mismo",
    ctaExplorarNota: "No es un video — es Aureo funcionando. Recorre el inventario, el mapa de calor y el picking con datos reales, sin registrarte.",
  },
  fundadores: {
    titulo: "Lo que aprendimos manejando stock de verdad.",
    texto: "Empezamos porque el inventario no cuadraba, el despacho era lento y las herramientas eran caras o incompletas. Aureo concentra POS, bodega y análisis en un solo sistema — pensado desde el piso del depósito.",
    socialProofPlaceholder: "Primeras implementaciones en curso.",
  },
  planes: [
    {
      nombre: "Starter",
      resumen: "Para vender y controlar tu stock sin desorden.",
      destacado: false,
      precios: { cop: { mensual: 24900, anual: 20750 }, usd: { mensual: 6, anual: 5 } },
      features: [
        "Punto de venta y facturación DIAN",
        "Inventario en tiempo real",
        "Alertas de stock",
        "1 usuario · 1 bodega · 1 dispositivo",
        "Soporte por WhatsApp",
      ],
      cta: "Unirme a la lista de espera",
    },
    {
      nombre: "Pro",
      resumen: "Para operar en serio, con equipo y reportes.",
      destacado: false,
      precios: { cop: { mensual: 54900, anual: 45750 }, usd: { mensual: 14, anual: 12 } },
      features: [
        "Todo lo de Starter",
        "Usuarios y roles: admin, depósito, caja",
        "Inventario ilimitado y conteos físicos",
        "Reportes",
        "Varios dispositivos",
      ],
      cta: "Unirme a la lista de espera",
    },
    {
      nombre: "Logística",
      resumen: "La inteligencia logística que te diferencia.",
      destacado: true,
      precios: { cop: { mensual: 94900, anual: 79100 }, usd: { mensual: 24, anual: 20 } },
      features: [
        "Todo lo de Pro",
        "Mapa de calor de bodega (WMS)",
        "Análisis ABC / Pareto",
        "Preparación de pedidos (picking)",
        "Reubicación inteligente · multi-bodega",
      ],
      cta: "Unirme a la lista de espera",
    },
  ] as Plan[],
  preciosTrial: "Empieza con 14 días gratis. Sin tarjeta.",
  preciosNota: "Precio de fundador garantizado para quienes entren por la lista de espera.",
  faq: [
    { pregunta: "¿Necesito conocimientos técnicos?", respuesta: "No. Aureo está pensado para que cualquier persona del negocio lo use desde el primer día." },
    { pregunta: "¿Funciona en la nube?", respuesta: "Sí. Accedes desde cualquier dispositivo, sin instalar nada, con tus datos siempre respaldados." },
    { pregunta: "¿Sirve solo para ferreterías?", respuesta: "No. Aureo es para cualquier negocio con inventario físico, ventas y bodega: distribuidoras, materiales de construcción, repuestos, agroinsumos y más." },
    { pregunta: "¿Qué pasa con mis datos?", respuesta: "Tus datos son tuyos. Los protegemos y nunca los compartimos." },
    { pregunta: "¿Cuándo estará disponible?", respuesta: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador." },
  ] as FaqItem[],
  finalCta: {
    titulo: "Sé de los primeros en tener el control.",
    texto: "Únete a la lista de espera y asegura tu precio de fundador.",
    cta: "Unirme ahora",
  },
  footer: {
    tagline: "Inteligencia logística para tu negocio.",
    derechos: "© 2026 Aureo. Todos los derechos reservados.",
  },
};
