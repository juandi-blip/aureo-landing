export type Module = { id: string; titulo: string; beneficio: string; icono: string };
export type Moneda = "cop" | "usd";
export type Periodo = "mensual" | "anual";
export type PlanPrecios = { cop: Record<Periodo, number>; usd: Record<Periodo, number> };
export type Plan = {
  nombre: string; resumen: string; destacado: boolean;
  precios: PlanPrecios; precioRegular: PlanPrecios; features: string[]; cta: string;
};
export type FaqItem = { pregunta: string; respuesta: string };
export type ComparativaValor = "si" | "no" | "parcial";
export type ComparativaFila = { criterio: string; valores: ComparativaValor[] };

export const site = {
  marca: "Aureo",
  whatsapp: "https://wa.me/573205638153",
  hero: {
    tituloLineas: [
      "El control de tu inventario,",
      "ventas y bodega en un solo lugar.",
    ],
    subtitulo: "Aureo le da a tu negocio la inteligencia logística que antes solo tenían las grandes empresas — sin su complejidad ni su precio.",
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
    { id: "crm", titulo: "CRM de clientes", beneficio: "Historial de compras, notas y clientes inactivos, sin hoja de cálculo aparte.", icono: "users" },
    { id: "alertas", titulo: "Alertas proactivas", beneficio: "Te avisa de stock bajo, clientes inactivos y facturas pendientes antes de que te cuesten una venta.", icono: "bell" },
    { id: "reportes", titulo: "Reportes exportables", beneficio: "Ventas, rotación, rentabilidad y por cliente, listos para exportar cuando los necesites.", icono: "file-text" },
    { id: "compras", titulo: "Compras inteligentes", beneficio: "Órdenes de compra agrupadas por proveedor, con numeración automática.", icono: "shopping-bag" },
  ] as Module[],
  comparativa: {
    titulo: "Por qué Aureo gana donde el cuaderno y el Excel se quedan cortos.",
    columnas: ["Cuaderno o Excel", "Software contable (Siigo, Alegra…)", "Aureo"],
    filas: [
      { criterio: "Ubicar productos sin perder tiempo", valores: ["no", "no", "si"] },
      { criterio: "Mapa de calor y picking guiado de bodega", valores: ["no", "no", "si"] },
      { criterio: "Saber qué rota y qué no", valores: ["no", "parcial", "si"] },
      { criterio: "Despacho rápido y guiado", valores: ["no", "no", "si"] },
      { criterio: "Inventario que siempre cuadra", valores: ["no", "parcial", "si"] },
      { criterio: "Precio para negocio pequeño", valores: ["si", "no", "si"] },
      { criterio: "Empieza a usarse en minutos", valores: ["si", "no", "si"] },
    ] as ComparativaFila[],
  },
  melyor: {
    eyebrow: "Exclusivo de Aureo",
    nombre: "Melyor",
    version: "1",
    titulo: "El motor de IA detrás de todo Aureo.",
    texto: "Melyor no es un chatbot de soporte. Es el motor de inteligencia que corre por debajo de cada módulo de Aureo — el que genera tus alertas, arma tus compras, detecta tus oportunidades de venta e interpreta tus reportes. Hablar con él por chat es solo una forma más de usarlo.",
    capacidades: [
      { titulo: "Compras óptimas", texto: "Sugiere cuánto y cuándo reabastecer según tu demanda real, y arma la orden de compra por ti." },
      { titulo: "Alertas antes de que duelan", texto: "Vigila tu stock, tus clientes inactivos y tus facturas pendientes — y te avisa antes de que se conviertan en un problema." },
      { titulo: "Venta cruzada que se te escapa", texto: "Detecta en tu historial de clientes a quién podrías venderle más, y te lo dice antes que tu competencia." },
      { titulo: "Reportes que se explican solos", texto: "No solo te muestra el reporte de rotación o rentabilidad — te dice qué significa y qué deberías hacer." },
      { titulo: "Pregúntale directamente", texto: "Además de todo esto, puedes chatear con Melyor sobre stock bajo, clientes inactivos o facturas pendientes, en lenguaje natural." },
    ],
    nota: "Incluido en Aureo. Se activa junto con tu cuenta — sin configuración adicional.",
  },
  demo: {
    eyebrow: "Producto real, no un mockup.",
    titulo: "Mira la inteligencia logística en acción.",
    texto: "El mapa de calor y el análisis ABC son lo que separa a Aureo de un POS común.",
    badges: ["Mapa de calor en vivo", "Picking guiado", "Análisis ABC / Pareto"],
    placeholder: "Demo en video — próximamente.",
    ctaExplorar: "Explora la demo tú mismo",
    ctaExplorarNota: "No es un video — es Aureo funcionando. Recorre el inventario, el mapa de calor y el picking con datos reales, sin registrarte.",
  },
  fundadores: {
    titulo: "Lo que aprendimos manejando stock de verdad.",
    texto: "Empezamos porque el inventario no cuadraba, el despacho era lento y las herramientas eran caras o incompletas. Aureo concentra POS, bodega y análisis en un solo sistema — pensado desde el piso del depósito.",
    nombres: "Leif Guy Florez y Juan David Florez, fundadores de Aureo.",
    socialProofPlaceholder: "Primeras implementaciones en curso.",
  },
  planes: [
    {
      nombre: "Starter",
      resumen: "Para vender y controlar tu stock sin desorden.",
      destacado: false,
      precios: { cop: { mensual: 24900, anual: 20750 }, usd: { mensual: 6, anual: 5 } },
      precioRegular: { cop: { mensual: 34900, anual: 29100 }, usd: { mensual: 8, anual: 7 } },
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
      precios: { cop: { mensual: 64900, anual: 54100 }, usd: { mensual: 16, anual: 13 } },
      precioRegular: { cop: { mensual: 89900, anual: 74900 }, usd: { mensual: 22, anual: 18 } },
      features: [
        "Todo lo de Starter",
        "Usuarios y roles: admin, depósito, caja",
        "Inventario ilimitado y conteos físicos",
        "CRM de clientes y alertas proactivas",
        "Reportes de ventas y rotación",
        "Varios dispositivos",
      ],
      cta: "Unirme a la lista de espera",
    },
    {
      nombre: "Logística",
      resumen: "La inteligencia logística que te diferencia.",
      destacado: true,
      precios: { cop: { mensual: 114900, anual: 95700 }, usd: { mensual: 29, anual: 24 } },
      precioRegular: { cop: { mensual: 159900, anual: 133300 }, usd: { mensual: 39, anual: 32 } },
      features: [
        "Todo lo de Pro",
        "Mapa de calor de bodega (WMS) y análisis ABC/Pareto",
        "Preparación de pedidos (picking) y reubicación inteligente",
        "Compras inteligentes con órdenes automáticas",
        "Permisos configurables por rol",
        "Reportes avanzados: rentabilidad y por cliente",
        "Multi-bodega",
      ],
      cta: "Unirme a la lista de espera",
    },
  ] as Plan[],
  preciosTrial: "Al lanzamiento: 14 días gratis, sin tarjeta.",
  preciosNota: "Precio de fundador de por vida para quienes entran por la lista de espera — nunca sube para ti, aunque suba después del lanzamiento.",
  earlyBird: {
    badge: "Fundador temprano",
    titulo: "Los primeros en la lista se llevan el mejor precio.",
    texto: "Quienes se unan en esta primera etapa acceden a un descuento extra sobre el precio de fundador. Cuanto antes entres, mejor cupo aseguras.",
  },
  // Contenido de components/SecuritySection.tsx — sección deshabilitada
  // mientras estemos en fase lista de espera (sin pasarela de pago aún).
  // Se conserva para reactivación futura, ver nota en ese componente.
  seguridad: {
    titulo: "Tu plata y tus datos, protegidos desde el día uno.",
    intro:
      "Hoy no pagas nada: la lista de espera reserva tu precio de fundador sin pedirte tarjeta. Y cuando abramos los pagos, así será pagar Aureo — y así te protegemos.",
    metodosTitulo: "Así pagarás tu plan al lanzamiento",
    metodos: [
      { id: "tarjetas", nombre: "Tarjeta crédito y débito", detalle: "Visa, Mastercard y Amex", icono: "credit-card" },
      { id: "pse", nombre: "PSE", detalle: "Directo desde tu banco", icono: "landmark" },
      { id: "billeteras", nombre: "Nequi y Daviplata", detalle: "Desde tu billetera móvil", icono: "smartphone" },
      { id: "internacional", nombre: "Pagos en USD", detalle: "Para clientes fuera de Colombia", icono: "globe" },
    ],
    garantiasTitulo: "Cómo te protegemos",
    garantias: [
      {
        titulo: "Nunca tocamos tu tarjeta",
        texto: "Los pagos los procesará una pasarela certificada PCI DSS Nivel 1. Los datos de tu tarjeta jamás pasan ni se guardan en nuestros servidores.",
        icono: "shield-check",
      },
      {
        titulo: "Todo viaja cifrado",
        texto: "El sitio completo corre sobre HTTPS con HSTS y cabeceras de seguridad estrictas. Cada dato que nos envías va cifrado, siempre.",
        icono: "lock",
      },
      {
        titulo: "Tus datos, aislados y respaldados",
        texto: "Base de datos con Row Level Security y respaldos automáticos. Nadie puede leer tu información desde afuera, y nunca la compartimos.",
        icono: "database",
      },
      {
        titulo: "Defensa activa contra fraude",
        texto: "Detección de bots, límite de intentos y validación estricta en cada formulario. La misma disciplina aplicará a cada pago.",
        icono: "radar",
      },
    ],
    nota: "La misma seguridad que ves aquí — desde la demo hasta el producto que contratas en tu plan.",
    cta: "Reservar mi precio de fundador",
  },
  faq: [
    { pregunta: "¿Necesito conocimientos técnicos?", respuesta: "No. Aureo está pensado para que cualquier persona del negocio lo use desde el primer día." },
    { pregunta: "¿Funciona en la nube?", respuesta: "Sí. Accedes desde cualquier dispositivo, sin instalar nada, con tus datos siempre respaldados." },
    { pregunta: "¿Sirve solo para ferreterías?", respuesta: "No. Aureo es para cualquier negocio con inventario físico, ventas y bodega: distribuidoras, materiales de construcción, repuestos, agroinsumos y más." },
    { pregunta: "Ya uso Siigo o Alegra, ¿para qué cambiar?", respuesta: "Siigo y Alegra son software contable — te ayudan a facturar y declarar. Aureo se enfoca en tu bodega: mapa de calor, qué rota y qué no, picking guiado. Muchos negocios usan Aureo junto a su contabilidad, no en reemplazo." },
    { pregunta: "¿Es difícil migrar mi inventario?", respuesta: "No. Cargas tu inventario actual (por Excel o uno por uno) y Aureo lo organiza por ti. No necesitas empezar de cero." },
    { pregunta: "¿Qué pasa con mis datos?", respuesta: "Tus datos son tuyos. Los protegemos y nunca los compartimos." },
    { pregunta: "¿Cuándo estará disponible?", respuesta: "Estamos en desarrollo. Únete a la lista de espera para tener acceso anticipado y precio de fundador." },
  ] as FaqItem[],
  finalCta: {
    titulo: "Sé de los primeros en tener el control.",
    texto: "Únete a la lista de espera y asegura tu precio de fundador.",
    cta: "Unirme ahora",
    referido: "¿Conoces a alguien con ferretería, distribuidora o bodega? Comparte tu invitación — cada referido que se una te acerca más a un cupo temprano.",
  },
  footer: {
    tagline: "Inteligencia logística para tu negocio.",
    derechos: "© 2026 Aureo. Todos los derechos reservados.",
  },
};
