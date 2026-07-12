import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad · Aureo",
  description:
    "Cómo Aureo recolecta, usa y protege tus datos personales, y cómo puedes ejercer tus derechos.",
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "aureosaas@gmail.com";
const ULTIMA_ACTUALIZACION = "12 de julio de 2026";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-[var(--text-secondary)]">
      <Link
        href="/"
        className="text-sm text-[var(--bronze)] underline underline-offset-2 hover:text-[var(--primary)]"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-6 font-display text-3xl font-extrabold text-[var(--text-primary)]">
        Política de Privacidad y Tratamiento de Datos
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Última actualización: {ULTIMA_ACTUALIZACION}
      </p>

      <div className="mt-8 flex flex-col gap-8 leading-relaxed">
        <section>
          <p>
            Esta política describe cómo <strong>Aureo</strong> (&quot;nosotros&quot;)
            recolecta, usa, almacena y protege los datos personales que nos
            entregas al unirte a nuestra lista de espera. Se rige por la Ley 1581
            de 2012 de Colombia y sus decretos reglamentarios sobre protección de
            datos personales (Habeas Data).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            1. Responsable del tratamiento
          </h2>
          <p className="mt-2">
            El responsable del tratamiento de tus datos es Aureo. Para cualquier
            solicitud relacionada con tus datos personales puedes escribirnos a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[var(--bronze)] underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            2. Datos que recolectamos
          </h2>
          <p className="mt-2">
            Cuando te unes a la lista de espera recolectamos únicamente los datos
            que nos proporcionas de forma voluntaria:
          </p>
          <ul className="mt-2 list-disc pl-6">
            <li>Correo electrónico (obligatorio).</li>
            <li>Nombre, tipo de negocio y ciudad (opcionales).</li>
          </ul>
          <p className="mt-2">
            No recolectamos datos sensibles ni utilizamos cookies de seguimiento
            de terceros. Nuestras métricas de uso son anónimas y no emplean
            cookies que te identifiquen.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            3. Finalidad del tratamiento
          </h2>
          <p className="mt-2">Usamos tus datos exclusivamente para:</p>
          <ul className="mt-2 list-disc pl-6">
            <li>Avisarte cuando Aureo esté disponible y darte acceso anticipado.</li>
            <li>Enviarte información relevante sobre el producto y tu cupo.</li>
            <li>Priorizar el acceso según el tipo de negocio.</li>
          </ul>
          <p className="mt-2">
            No vendemos, alquilamos ni compartimos tus datos con terceros para
            fines comerciales ajenos a Aureo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            4. Almacenamiento y seguridad
          </h2>
          <p className="mt-2">
            Tus datos se almacenan de forma segura con nuestros proveedores de
            infraestructura (bases de datos y envío de correo), a los que solo se
            accede desde el servidor con credenciales protegidas. Aplicamos
            medidas técnicas y organizativas razonables para prevenir el acceso no
            autorizado, la pérdida o la alteración de tu información.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            5. Tus derechos
          </h2>
          <p className="mt-2">
            Como titular de los datos, en cualquier momento puedes ejercer tus
            derechos a:
          </p>
          <ul className="mt-2 list-disc pl-6">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso que se ha dado a tus datos.</li>
            <li>
              Revocar la autorización y/o solicitar la supresión de tus datos
              cuando no exista un deber legal de conservarlos.
            </li>
          </ul>
          <p className="mt-2">
            Para ejercer cualquiera de estos derechos, escríbenos a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[var(--bronze)] underline underline-offset-2"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            y atenderemos tu solicitud en los plazos que establece la ley.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            6. Cambios en esta política
          </h2>
          <p className="mt-2">
            Podemos actualizar esta política para reflejar cambios legales o
            mejoras en el producto. Publicaremos siempre la versión vigente en
            esta página con su fecha de actualización.
          </p>
        </section>
      </div>
    </main>
  );
}
