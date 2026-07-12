import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones · Aureo",
  description:
    "Términos y condiciones de uso del sitio de Aureo y de la lista de espera.",
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = "aureosaas@gmail.com";
const ULTIMA_ACTUALIZACION = "12 de julio de 2026";

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-[var(--text-secondary)]">
      <Link
        href="/"
        className="text-sm text-[var(--bronze)] underline underline-offset-2 hover:text-[var(--primary)]"
      >
        ← Volver al inicio
      </Link>

      <h1 className="mt-6 font-display text-3xl font-extrabold text-[var(--text-primary)]">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        Última actualización: {ULTIMA_ACTUALIZACION}
      </p>

      <div className="mt-8 flex flex-col gap-8 leading-relaxed">
        <section>
          <p>
            Estos Términos y Condiciones regulan el uso del sitio web de{" "}
            <strong>Aureo</strong> y la inscripción a nuestra lista de espera. Al
            usar el sitio o registrarte, aceptas estos términos. Si no estás de
            acuerdo, por favor no utilices el sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            1. Naturaleza del servicio
          </h2>
          <p className="mt-2">
            Aureo es un producto de gestión de inventario, ventas y logística
            actualmente <strong>en desarrollo</strong>. La lista de espera te
            permite manifestar interés y obtener acceso anticipado, pero no
            constituye un contrato de prestación del servicio ni garantiza una
            fecha de disponibilidad.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            2. Precios y &quot;precio de fundador&quot;
          </h2>
          <p className="mt-2">
            Los precios mostrados en el sitio, incluido el llamado &quot;precio de
            fundador&quot;, son informativos y pueden cambiar antes del
            lanzamiento comercial. Cualquier oferta quedará sujeta a los términos
            de contratación que se comuniquen al momento de habilitar el producto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            3. Uso aceptable
          </h2>
          <p className="mt-2">
            Te comprometes a no usar el sitio para fines ilícitos, a no intentar
            vulnerar su seguridad, ni a enviar datos falsos o de terceros sin
            autorización en el formulario de registro.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            4. Propiedad intelectual
          </h2>
          <p className="mt-2">
            La marca, el nombre, los textos, el diseño y demás contenidos del
            sitio son propiedad de Aureo o de sus titulares y están protegidos por
            la ley. No se permite su reproducción sin autorización previa.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            5. Limitación de responsabilidad
          </h2>
          <p className="mt-2">
            El sitio se ofrece &quot;tal cual&quot;. En la máxima medida permitida
            por la ley, Aureo no será responsable por daños derivados del uso o la
            imposibilidad de uso del sitio, ni por la exactitud de la información
            mientras el producto esté en desarrollo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            6. Datos personales
          </h2>
          <p className="mt-2">
            El tratamiento de tus datos personales se rige por nuestra{" "}
            <Link
              href="/privacidad"
              className="text-[var(--bronze)] underline underline-offset-2"
            >
              Política de Privacidad
            </Link>
            , que forma parte integral de estos términos.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            7. Ley aplicable y contacto
          </h2>
          <p className="mt-2">
            Estos términos se rigen por las leyes de la República de Colombia.
            Para cualquier consulta escríbenos a{" "}
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
          <p className="text-sm text-[var(--text-muted)]">
            Este documento es un borrador base y no constituye asesoría legal. Se
            recomienda su revisión por un profesional antes del lanzamiento
            comercial.
          </p>
        </section>
      </div>
    </main>
  );
}
