"use client";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactoSchema,
  MAX_MENSAJE_CONTACTO,
  type ContactoFormValues,
} from "@/lib/schemas/contacto";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AvisoDatos from "@/components/ui/AvisoDatos";
import IconoWhatsapp from "@/components/ui/IconoWhatsapp";
import {
  IconoInstagram,
  IconoFacebook,
  IconoTiktok,
} from "@/components/ui/IconosRedes";
import { CONTACTO, REDES, whatsappCon } from "@/lib/contacto";
import AvisoGrupos from "@/components/grupos/AvisoGrupos";
import { radicado, ZONA_RADICADO } from "@/lib/radicado";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// El logotipo de cada red junto al nombre: es lo que hace que se reconozcan de
// un vistazo, sin leer. Pintan con currentColor, así que siguen al crimson de la
// píldora y se vuelven crema solos cuando el hover la rellena.
const RED_LINKS = [
  {
    label: "Instagram",
    href: REDES.instagram,
    icono: <IconoInstagram size={18} />,
  },
  {
    label: "Facebook",
    href: REDES.facebook,
    icono: <IconoFacebook size={18} />,
  },
  { label: "TikTok", href: REDES.tiktok, icono: <IconoTiktok size={18} /> },
];

/**
 * El cuerpo de /contacto. Vive aquí y no en la página porque necesita estado
 * —el formulario— y por tanto "use client", y un componente cliente no puede
 * exportar `generateMetadata`: mientras esto fue la página, /contacto y
 * /en/contact se quedaron sin canónica ni hreflang. La página es ahora un
 * servidor delgado que declara los metadatos y monta esto, igual que
 * /tienda hace con TiendaGrid.
 */
export default function ContactoContenido() {
  const t = useTranslations("contacto");
  const tw = useTranslations("whatsapp");

  const [estado, setEstado] = useState<"idle" | "loading" | "ok" | "error">(
    "idle",
  );
  // Lo que responde el backend al guardar: con eso se arma el radicado, que la
  // Ley 2439 de 2024 pide para darle seguimiento a un reclamo.
  const [recibido, setRecibido] = useState<{ id: string; createdAt: string } | null>(null);
  const format = useFormatter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactoFormValues>({ resolver: zodResolver(contactoSchema) });

  // Los errores del esquema son claves de `contacto`; se traducen aquí.
  const msg = (campo: keyof ContactoFormValues) => {
    const clave = errors[campo]?.message;
    return clave ? t(clave, { max: MAX_MENSAJE_CONTACTO }) : undefined;
  };

  const onSubmit = async (data: ContactoFormValues) => {
    setEstado("loading");
    try {
      const res = await fetch(`${API}/contacto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El teléfono vacío no se manda: el DTO lo valida solo si viene.
        body: JSON.stringify({ ...data, telefono: data.telefono || undefined }),
      });
      if (!res.ok) throw new Error();
      // Si el cuerpo no llega completo el mensaje igual quedó guardado: se
      // agradece sin radicado en vez de mostrar un error que no es cierto.
      const cuerpo = await res.json().catch(() => null);
      if (cuerpo?.id && cuerpo?.createdAt) setRecibido(cuerpo);
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  };

  return (
    <section className="page-shell contacto-shell">
      {/* La página no tenía <h1>: arrancaba en <h2> y dejaba el documento sin
          encabezado de primer nivel. Va oculto porque el diseño no lleva
          titular —el rótulo de la página ya lo da la barra de navegación— pero
          un lector de pantalla necesita saber dónde ha caído, y un buscador
          usa el <h1> para entender de qué va la página. Mismo recurso que
          /tienda y /experiencias.

          No dice solo «Contacto», que es lo que ya dice el menú: nombra
          también el municipio y el «cómo llegar», que son las dos consultas
          con las que se busca esta página. Un encabezado oculto se lee igual
          que uno visible, así que no hay motivo para desaprovecharlo. */}
      <h1 className="solo-lectores">{t("h1")}</h1>

      {/* Arriba del formulario y no al pie: esta página es donde cae hoy el
          tráfico institucional —un coordinador que no encontró capacidad de
          grupo en ningún otro sitio— y el formulario de acá pide tres campos
          que no sirven para cotizar. Es el desvío de mayor rendimiento del
          proyecto y hay que verlo antes de empezar a escribir el mensaje. */}
      <AvisoGrupos variante="contacto" />

      <div className="contacto-grid">
        <div className="contacto-formulario">
          <h2 className="contacto-subtitulo">{t("escribenos")}</h2>
          {estado === "ok" ? (
            <div role="status" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <p style={{ color: "var(--color-crimson)", fontSize: "1.1rem" }}>
                {t("gracias")}
              </p>
              {recibido && (
                <>
                  <p style={{ color: "var(--color-brown)", overflowWrap: "anywhere" }}>
                    {t.rich("radicado", {
                      numero: radicado(recibido.id, recibido.createdAt),
                      b: (texto) => <strong style={{ fontFamily: "monospace", fontSize: "1.05em" }}>{texto}</strong>,
                    })}
                  </p>
                  <p style={{ color: "var(--color-brown)", fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {t("radicadoTexto", {
                      fecha: format.dateTime(new Date(recibido.createdAt), {
                        dateStyle: "long",
                        timeStyle: "short",
                        timeZone: ZONA_RADICADO,
                      }),
                    })}
                  </p>
                </>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <Input
                label={t("nombre")}
                required
                autoComplete="name"
                maxLength={100}
                error={msg("nombre")}
                {...register("nombre")}
              />
              <Input
                label={t("email")}
                type="email"
                required
                autoComplete="email"
                maxLength={255}
                error={msg("email")}
                {...register("email")}
              />
              <Input
                label={t("telefono")}
                nota={t("opcional")}
                ayuda={t("telefonoAyuda")}
                type="tel"
                autoComplete="tel"
                placeholder="+57 300 000 0000"
                error={msg("telefono")}
                {...register("telefono")}
              />
              <Input
                label={t("mensaje")}
                required
                multiline
                maxLength={MAX_MENSAJE_CONTACTO}
                error={msg("mensaje")}
                {...register("mensaje")}
              />
              {/* Honeypot: fuera de pantalla, sin tabulación y sin
                  autocompletado. Los bots lo llenan y el backend los descarta. */}
              <div className="campo-trampa" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("website")}
                />
              </div>
              {estado === "error" && (
                <p
                  role="alert"
                  style={{
                    color: "var(--color-crimson)",
                    fontSize: 14,
                    margin: 0,
                  }}
                >
                  {t("error", { email: CONTACTO.email })}
                </p>
              )}
              <Button type="submit" disabled={estado === "loading"}>
                {estado === "loading" ? t("enviando") : t("enviar")}
              </Button>
              <AvisoDatos />
            </form>
          )}
        </div>

        <aside
          className="contacto-canales"
          aria-label={t("otrasFormasAria")}
        >
          <h2 className="contacto-subtitulo">{t("otrasFormas")}</h2>

          <a
            href={whatsappCon(tw("contacto"))}
            target="_blank"
            rel="noopener noreferrer"
            className="contacto-canal contacto-canal-destacado"
          >
            <span className="contacto-canal-icono" aria-hidden="true">
              <IconoWhatsapp />
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">WhatsApp</span>
              <span className="contacto-canal-dato">{CONTACTO.telefono}</span>
              <span className="contacto-canal-nota">{t("whatsappNota")}</span>
            </span>
          </a>

          <a href={`tel:${CONTACTO.telefonoE164}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              📞
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("llamanos")}</span>
              <span className="contacto-canal-dato">{CONTACTO.telefono}</span>
            </span>
          </a>

          <a href={`mailto:${CONTACTO.email}`} className="contacto-canal">
            <span className="contacto-canal-icono" aria-hidden="true">
              ✉️
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("correo")}</span>
              <span className="contacto-canal-dato">{CONTACTO.email}</span>
            </span>
          </a>

          <div className="contacto-canal contacto-canal-estatico">
            <span className="contacto-canal-icono" aria-hidden="true">
              📍
            </span>
            <span className="contacto-canal-texto">
              <span className="contacto-canal-titulo">{t("dondeEstamos")}</span>
              <span className="contacto-canal-dato">{CONTACTO.direccion}</span>
              <span className="contacto-canal-nota">{CONTACTO.municipio}</span>
            </span>
          </div>
        </aside>
        
      </div>
      <div className="contacto-redes-lista">
          {RED_LINKS.map(({ label, href, icono }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="contacto-red"
            >
              {icono}
              {label}
            </a>
          ))}
        </div>
    </section>
  );
}
