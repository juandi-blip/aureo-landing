export type Module = { id: string; titulo: string; beneficio: string; icono: string };
export type Plan = {
  nombre: string; precio: string; periodo: string; resumen: string;
  destacado: boolean; features: string[]; cta: string;
};
export type FaqItem = { pregunta: string; respuesta: string };

export const site = {
  marca: "Aureo",
  whatsapp: "https://wa.me/57XXXXXXXXXX", // TODO real number antes de prod
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
  },
  fundadores: {
    titulo: "Lo que aprendimos manejando stock de verdad.",
    texto: "Empezamos porque el inventario no cuadraba, el despacho era lento y las herramientas eran caras o incompletas. Aureo concentra POS, bodega y análisis en un solo sistema — pensado desde el piso del depósito.",
    socialProofPlaceholder: "Primeras implementaciones en curso.",
  },
  planes: [
    {
      nombre: "Starter", precio: "Por definir", periodo: "/mes", destacado: false,
      resumen: "Para el negocio que necesita vender y controlar su stock.",
      features: ["Punto de venta y facturación", "Inventario en tiempo real", "Alertas de stock", "Reportes básicos"],
      cta: "Quiero el plan Starter",
    },
    {
      nombre: "Pro", precio: "Por definir", periodo: "/mes", destacado: true,
      resumen: "Para el negocio con bodega que necesita logística de verdad.",
      features: ["Todo lo de Starter", "Mapa de calor de bodega (WMS)", "Análisis ABC / Pareto", "Preparación de pedidos (picking)", "Reubicación inteligente"],
      cta: "Quiero el plan Pro",
    },
  ] as Plan[],
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
